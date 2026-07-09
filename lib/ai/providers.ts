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
      defaultModel: "llama-3.3-70b-versatile",
      models: [
        { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)", contextWindow: 131072 },
        { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Instant)", contextWindow: 131072 },
        { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", contextWindow: 32768 },
        { id: "gemma2-9b-it", label: "Gemma 2 9B", contextWindow: 8192 },
        { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill (70B)", contextWindow: 131072 },
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
