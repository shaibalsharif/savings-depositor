/**
 * PAI2 AI Provider Abstraction Layer
 *
 * Unified interface to Groq, OpenRouter, and HuggingFace inference APIs.
 * All providers use OpenAI-compatible chat completion endpoints.
 * No SDK dependencies — plain fetch() calls.
 */

export type ProviderKey = "groq" | "openrouter" | "huggingface";

export interface ModelInfo {
  id: string;
  label: string;
  contextWindow?: number;
}

export interface ProviderConfig {
  key: ProviderKey;
  label: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  models: ModelInfo[];
  headers: Record<string, string>;
}

/** User-friendly error with status info */
export interface AIError {
  code: string;
  message: string;
  retryable: boolean;
  suggestSwitch: boolean; // suggest switching provider
}

// ─── Provider Configurations ───────────────────────────────────────────

function getProviderConfigs(): Record<ProviderKey, ProviderConfig> {
  return {
    groq: {
      key: "groq",
      label: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY || "",
      // NOTE: These are only a *fallback* used if the live /models fetch
      // fails. The live list (see fetchLiveModels) is the source of truth
      // so deprecated models never appear. Keep these to known-current IDs.
      defaultModel: "openai/gpt-oss-120b",
      models: [
        { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", contextWindow: 131072 },
        { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", contextWindow: 131072 },
      ],
      headers: {},
    },
    openrouter: {
      key: "openrouter",
      label: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultModel: "google/gemini-2.0-flash-exp:free",
      models: [
        { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (Free)", contextWindow: 1048576 },
        { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)", contextWindow: 131072 },
        { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B (Free)", contextWindow: 131072 },
        { id: "mistralai/mistral-nemo:free", label: "Mistral Nemo (Free)", contextWindow: 131072 },
        { id: "openrouter/free", label: "Auto Router (Free)", contextWindow: 131072 },
      ],
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "PAI2 - Savings Deposit Manager",
      },
    },
    huggingface: {
      key: "huggingface",
      label: "HuggingFace",
      baseUrl: "https://router.huggingface.co/v1",
      apiKey: process.env.HUGGINGFACE_API_KEY || "",
      defaultModel: "Qwen/Qwen2.5-72B-Instruct",
      models: [
        { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B", contextWindow: 32768 },
        { id: "meta-llama/Meta-Llama-3-8B-Instruct", label: "Llama 3 8B", contextWindow: 8192 },
      ],
      headers: {},
    },
  };
}

export function getProvider(key: ProviderKey): ProviderConfig {
  const configs = getProviderConfigs();
  const config = configs[key];
  if (!config) throw new Error(`Unknown provider: ${key}`);
  if (!config.apiKey) throw new Error(`API key not configured for provider: ${key}`);
  return config;
}

export function getAllProviders(): ProviderConfig[] {
  const configs = getProviderConfigs();
  return Object.values(configs).filter((c) => !!c.apiKey);
}

/** Client-safe provider info (no API keys) */
export interface ProviderInfo {
  key: ProviderKey;
  label: string;
  defaultModel: string;
  models: ModelInfo[];
}

export function getProviderInfoList(): ProviderInfo[] {
  return getAllProviders().map((p) => ({
    key: p.key,
    label: p.label,
    defaultModel: p.defaultModel,
    models: p.models,
  }));
}

// ─── Live Model Discovery ──────────────────────────────────────────────
//
// Every provider here is OpenAI-compatible and exposes `GET /models`, which
// only ever returns *currently available* (non-deprecated) models. We fetch
// that live, drop non-chat models, rank by a per-provider preference list,
// and keep the top N — so deprecated model IDs disappear automatically and
// nobody has to hand-edit a list. Results are cached in memory; on any
// failure we fall back to the static `models` above.

const TOP_N_MODELS = 5;
const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ModelsCacheEntry {
  models: ModelInfo[];
  expires: number;
}
const modelsCache = new Map<ProviderKey, ModelsCacheEntry>();

/** IDs that are not text-chat models (transcription, TTS, moderation, etc.). */
function isNonChatModel(id: string): boolean {
  return /(whisper|tts|orpheus|guard|safeguard|embed|embedding|moderation|rerank|ocr|distil|stable-diffusion|sdxl|flux|dall-?e|clip)/i.test(
    id
  );
}

/** Ordered preference patterns — earlier = higher priority in the dropdown. */
const MODEL_PREFERENCES: Record<ProviderKey, string[]> = {
  groq: [
    "gpt-oss-120b",
    "gpt-oss-20b",
    "qwen3",
    "qwen",
    "llama-3.3",
    "llama-4",
    "llama-3.1",
    "kimi",
    "gemma",
  ],
  openrouter: [
    "gemini-2.0-flash",
    "llama-3.3-70b",
    "qwen",
    "deepseek",
    "mistral",
    "gemma",
  ],
  huggingface: ["qwen2.5-72b", "qwen", "llama-3.3", "llama-3", "mistral", "gemma"],
};

function preferenceScore(id: string, prefs: string[]): number {
  const lower = id.toLowerCase();
  for (let i = 0; i < prefs.length; i++) {
    if (lower.includes(prefs[i])) return i;
  }
  return prefs.length + 1;
}

function prettifyModelId(id: string): string {
  const tail = id.split("/").pop() || id;
  return tail
    .replace(/[:_-]+/g, " ")
    .replace(/\bfree\b/i, "(Free)")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RawModel {
  id?: string;
  name?: string;
  context_window?: number;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

/**
 * Fetch, filter and rank the live model list for a provider.
 * Cached in memory for MODELS_CACHE_TTL_MS. Throws on network/HTTP failure
 * so the caller can fall back to the static list.
 */
async function fetchLiveModels(key: ProviderKey): Promise<ModelInfo[]> {
  const cached = modelsCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.models;

  const config = getProvider(key);

  const res = await fetch(`${config.baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    // Never let a slow provider stall the dropdown for long
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    throw new Error(`${key} /models returned ${res.status}`);
  }

  const json = await res.json();
  const rawList: RawModel[] = Array.isArray(json?.data) ? json.data : [];

  const prefs = MODEL_PREFERENCES[key] || [];
  const ranked = rawList
    .filter((m): m is RawModel & { id: string } => typeof m.id === "string")
    // Keep only text-chat models
    .filter((m) => !isNonChatModel(m.id))
    // For OpenRouter, keep only free models (aligns with free-tier usage)
    .filter((m) => {
      if (key !== "openrouter") return true;
      const price = parseFloat(m.pricing?.prompt ?? "0");
      return !Number.isFinite(price) || price === 0;
    })
    .map<ModelInfo>((m) => ({
      id: m.id,
      label: m.name || prettifyModelId(m.id),
      contextWindow: m.context_window ?? m.context_length,
    }))
    .sort((a, b) => {
      const sa = preferenceScore(a.id, prefs);
      const sb = preferenceScore(b.id, prefs);
      if (sa !== sb) return sa - sb;
      return (b.contextWindow ?? 0) - (a.contextWindow ?? 0);
    })
    .slice(0, TOP_N_MODELS);

  if (ranked.length === 0) {
    throw new Error(`${key} /models returned no usable chat models`);
  }

  modelsCache.set(key, {
    models: ranked,
    expires: Date.now() + MODELS_CACHE_TTL_MS,
  });
  return ranked;
}

/**
 * Client-safe provider list with LIVE, non-deprecated models.
 * Falls back to the static `models` for any provider whose live fetch fails.
 */
export async function getProviderInfoListLive(): Promise<ProviderInfo[]> {
  const providers = getAllProviders();

  return Promise.all(
    providers.map(async (p) => {
      let models = p.models;
      try {
        models = await fetchLiveModels(p.key);
      } catch (err) {
        console.warn(
          `[PAI2] Live model fetch failed for ${p.key}, using fallback list:`,
          err instanceof Error ? err.message : err
        );
      }
      const defaultModel = models.some((m) => m.id === p.defaultModel)
        ? p.defaultModel
        : models[0]?.id || p.defaultModel;
      return {
        key: p.key,
        label: p.label,
        defaultModel,
        models,
      };
    })
  );
}

// ─── Chat Completion ───────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  provider: ProviderKey;
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Non-streaming chat completion.
 * Returns the full assistant response text.
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const config = getProvider(options.provider);
  const model = options.model || config.defaultModel;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw createAIError(response.status, await response.text(), options.provider);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Streaming chat completion.
 * Returns a ReadableStream that emits SSE-formatted text chunks.
 */
export async function chatCompletionStream(
  options: ChatCompletionOptions
): Promise<Response> {
  const config = getProvider(options.provider);
  const model = options.model || config.defaultModel;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw createAIError(response.status, await response.text(), options.provider);
  }

  return response;
}

// ─── Audio Transcription (Groq Whisper) ────────────────────────────────

export async function transcribeAudio(audioFile: File | Blob): Promise<string> {
  const config = getProvider("groq");

  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "bn"); // Bangla — auto-detects if wrong

  const response = await fetch(`${config.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw createAIError(response.status, await response.text(), "groq");
  }

  const data = await response.json();
  return data.text || "";
}

// ─── Error Handling ────────────────────────────────────────────────────

function createAIError(
  status: number,
  body: string,
  provider: ProviderKey
): AIError {
  let parsed: { error?: { message?: string }; message?: string } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    // body is not JSON
  }

  const serverMessage =
    parsed?.error?.message || parsed?.message || body.slice(0, 200);

  switch (status) {
    case 401:
      return {
        code: "AUTH_ERROR",
        message: `Authentication failed for ${provider}. API key may be invalid or expired.`,
        retryable: false,
        suggestSwitch: true,
      };
    case 402:
      return {
        code: "QUOTA_EXHAUSTED",
        message: `Free tier quota exhausted for ${provider}. Please switch to another provider.`,
        retryable: false,
        suggestSwitch: true,
      };
    case 429:
      return {
        code: "RATE_LIMIT",
        message: `Rate limit reached for ${provider}. Please wait a moment and try again, or switch provider.`,
        retryable: true,
        suggestSwitch: true,
      };
    case 413:
      return {
        code: "PAYLOAD_TOO_LARGE",
        message: `Request too large for ${provider}. Try shortening your message or reducing context.`,
        retryable: false,
        suggestSwitch: false,
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: "SERVER_ERROR",
        message: `${provider} server is temporarily unavailable. Try again or switch provider. (${status})`,
        retryable: true,
        suggestSwitch: true,
      };
    default:
      return {
        code: "UNKNOWN_ERROR",
        message: `Error from ${provider}: ${serverMessage}`,
        retryable: false,
        suggestSwitch: true,
      };
  }
}

/**
 * Check if an error is an AIError from our provider layer
 */
export function isAIError(err: unknown): err is AIError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    "retryable" in err
  );
}
