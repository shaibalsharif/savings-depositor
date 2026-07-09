/**
 * PAI2 Chat API Route — Streaming Chat Completion
 *
 * POST /api/pai2/chat
 *
 * Receives a message, builds context, calls the selected AI provider,
 * and streams the response back via SSE.
 * Also saves messages to the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { chatConversations, chatMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import {
  chatCompletionStream,
  rawChatCompletion,
  getProviderInfoListLive,
  isAIError,
  type ProviderKey,
  type ChatMessage,
} from "@/lib/ai/providers";
import { AI_TOOLS, executeTool } from "@/lib/ai/tools";
import { isManager as checkIsManager } from "@/lib/auth";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

const MAX_TOOL_ROUNDS = 6;

/**
 * Run the tool-calling loop: let the model request tools, execute them against
 * the real database, feed the results back, and repeat until it produces a
 * final textual answer. Returns the answer text. Throws on provider errors so
 * the caller can fall back to plain streaming.
 */
interface ToolLoopResult {
  text: string;
  toolsUsed: string[];
}

async function runToolLoop(
  provider: ProviderKey,
  model: string | undefined,
  baseMessages: ChatMessage[]
): Promise<ToolLoopResult> {
  const convo: Array<Record<string, unknown>> = baseMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const toolsUsed: string[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const asst = await rawChatCompletion({
      provider,
      model,
      messages: convo,
      tools: AI_TOOLS,
      temperature: 0.3,
    });

    if (asst.tool_calls && asst.tool_calls.length > 0) {
      convo.push({
        role: "assistant",
        content: asst.content ?? "",
        tool_calls: asst.tool_calls,
      });
      for (const tc of asst.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          // leave args empty on malformed JSON
        }
        toolsUsed.push(tc.function.name);
        const result = await executeTool(tc.function.name, args);
        convo.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    return { text: asst.content || "", toolsUsed };
  }

  // Hit the round cap with tools still pending — force a final text answer.
  const finalMsg = await rawChatCompletion({
    provider,
    model,
    messages: convo,
    tools: AI_TOOLS,
    toolChoice: "none",
    temperature: 0.3,
  });
  return { text: finalMsg.content || "", toolsUsed };
}

/**
 * Try the tool loop across an ordered list of provider/model candidates,
 * automatically moving to the next one on a retryable/switchable error
 * (rate limit, request-too-large, server error, decommissioned model). Returns
 * the first successful answer along with which provider/model produced it.
 */
async function runToolLoopWithFallback(
  candidates: Array<{ provider: ProviderKey; model?: string }>,
  baseMessages: ChatMessage[]
): Promise<{ text: string; toolsUsed: string[]; provider: ProviderKey; model?: string } | null> {
  let lastError: unknown = null;
  for (const cand of candidates) {
    try {
      const { text, toolsUsed } = await runToolLoop(
        cand.provider,
        cand.model,
        baseMessages
      );
      if (text.trim()) {
        return { text, toolsUsed, provider: cand.provider, model: cand.model };
      }
      // Empty answer — try the next candidate.
    } catch (err) {
      lastError = err;
      // Non-switchable hard errors: stop trying and surface it.
      if (isAIError(err) && !err.retryable && !err.suggestSwitch) {
        throw err;
      }
      // Otherwise fall through to the next candidate.
    }
  }
  if (lastError) throw lastError;
  return null;
}

/**
 * Build the ordered list of tool-capable provider/model candidates to try,
 * starting with the user's choice, then other configured providers' best model.
 */
async function buildToolCandidates(
  preferredProvider: ProviderKey,
  preferredModel: string | undefined
): Promise<Array<{ provider: ProviderKey; model?: string }>> {
  const candidates: Array<{ provider: ProviderKey; model?: string }> = [
    { provider: preferredProvider, model: preferredModel },
  ];
  try {
    const live = await getProviderInfoListLive();
    for (const p of live) {
      if (p.key !== "groq" && p.key !== "openrouter") continue; // tool-capable only
      if (p.key === preferredProvider) continue; // already first
      candidates.push({ provider: p.key as ProviderKey, model: p.defaultModel });
    }
  } catch {
    // If discovery fails, we still have the preferred candidate.
  }
  return candidates;
}

/**
 * Emit an already-computed answer to the client over the same SSE contract the
 * streaming path uses (meta → token* → done), chunked so the UI still animates.
 */
function simulatedStream(
  chatId: string,
  messageId: string,
  isNewConversation: boolean,
  text: string,
  meta?: Record<string, unknown>
): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "meta", chatId, messageId, isNewConversation })}\n\n`
        )
      );
      for (let i = 0; i < text.length; i += 80) {
        const chunk = text.slice(i, i + 80);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "token", content: chunk })}\n\n`)
        );
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", meta })}\n\n`)
      );
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const { isAuthenticated, getUser } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // ── Parse Request ─────────────────────────────────────────────────
    const body = await req.json();
    const {
      chatId,
      message,
      provider = "groq" as ProviderKey,
      model,
      inputType = "text",
      userMemories = [],
    } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const startedAt = Date.now();
    // Tool-capable providers get a lean prompt + tool calling; others get the
    // full data snapshot injected and plain streaming.
    const toolCapable = provider === "groq" || provider === "openrouter";

    const managerRole = await checkIsManager();
    const userName = user.given_name || user.family_name || "User";

    // ── Get or create conversation ────────────────────────────────────
    let conversationChatId = chatId;
    let isNewConversation = false;

    if (!conversationChatId) {
      // Create new conversation
      conversationChatId = generateId("CHAT");
      isNewConversation = true;
      const title =
        message.length > 60
          ? message.slice(0, 57) + "..."
          : message;

      await db.insert(chatConversations).values({
        chatId: conversationChatId,
        title,
        userId: user.id,
        provider,
        model: model || "default",
        status: "active",
      });
    } else {
      // Verify ownership
      const conv = await db.query.chatConversations.findFirst({
        where: eq(chatConversations.chatId, conversationChatId),
      });
      if (!conv || conv.userId !== user.id) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      // Clear draft if any
      if (conv.draftPrompt) {
        await db
          .update(chatConversations)
          .set({ draftPrompt: null, status: "active" })
          .where(eq(chatConversations.chatId, conversationChatId));
      }
    }

    // ── Save user message ─────────────────────────────────────────────
    const userMessageId = generateId("MSG");
    await db.insert(chatMessages).values({
      messageId: userMessageId,
      chatId: conversationChatId,
      role: "user",
      content: message.trim(),
      inputType,
      status: "complete",
    });

    // ── Build message history ─────────────────────────────────────────
    const existingMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, conversationChatId))
      .orderBy(chatMessages.createdAt);

    // Build system prompt with DB context (lean when tools are available)
    const systemPrompt = await buildSystemPrompt(
      user.id,
      managerRole,
      userName,
      userMemories,
      toolCapable
    );

    // History window: smaller + length-capped when using tools, since tool
    // results already carry the data and long chart tables in old messages
    // otherwise bloat the request ("Request too large").
    const historyWindow = toolCapable ? 10 : 20;
    const perMsgCap = toolCapable ? 1500 : 8000;
    const capContent = (c: string) =>
      c.length > perMsgCap ? c.slice(0, perMsgCap) + " …[truncated]" : c;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...existingMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-historyWindow)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: capContent(m.content),
        })),
    ];

    // ── Save draft in case user leaves ────────────────────────────────
    await db
      .update(chatConversations)
      .set({ draftPrompt: message.trim() })
      .where(eq(chatConversations.chatId, conversationChatId));

    // ── Stream response from AI provider ──────────────────────────────
    const assistantMessageId = generateId("MSG");

    // Create placeholder message for streaming
    await db.insert(chatMessages).values({
      messageId: assistantMessageId,
      chatId: conversationChatId,
      role: "assistant",
      content: "",
      inputType: "text",
      status: "streaming",
    });

    // ── Tool-calling path (providers/models that support function calling) ─
    // The model calls DB-backed tools for exact figures instead of guessing.
    // Automatically fails over across providers on rate-limit / too-large /
    // decommissioned errors. Falls through to plain streaming if all fail.
    if (toolCapable) {
      try {
        const candidates = await buildToolCandidates(provider as ProviderKey, model);
        const result = await runToolLoopWithFallback(candidates, messages);

        if (result && result.text.trim()) {
          await db
            .update(chatMessages)
            .set({ content: result.text, status: "complete" })
            .where(eq(chatMessages.messageId, assistantMessageId));
          await db
            .update(chatConversations)
            .set({ draftPrompt: null })
            .where(eq(chatConversations.chatId, conversationChatId));

          const meta = {
            provider: result.provider,
            model: result.model || "default",
            mode: "tools" as const,
            toolsUsed: result.toolsUsed,
            contextMessages: messages.length - 1,
            ms: Date.now() - startedAt,
          };

          return new Response(
            simulatedStream(
              conversationChatId,
              assistantMessageId,
              isNewConversation,
              result.text,
              meta
            ),
            { headers: SSE_HEADERS }
          );
        }
        // Empty answer → fall through to streaming as a fallback.
      } catch (err) {
        // If every tool-capable provider failed with a switchable error,
        // surface it to the client (so it can show "rate limited", etc.).
        if (isAIError(err)) {
          await db
            .update(chatMessages)
            .set({ content: err.message, status: "error" })
            .where(eq(chatMessages.messageId, assistantMessageId));
          await db
            .update(chatConversations)
            .set({ draftPrompt: null })
            .where(eq(chatConversations.chatId, conversationChatId));
          return NextResponse.json(
            {
              error: err.message,
              code: err.code,
              retryable: err.retryable,
              suggestSwitch: err.suggestSwitch,
              chatId: conversationChatId,
              messageId: assistantMessageId,
            },
            { status: 200 }
          );
        }
        console.warn(
          "[PAI2] Tool loop failed, falling back to plain streaming:",
          err instanceof Error ? err.message : err
        );
      }
    }

    let providerResponse: Response;
    try {
      providerResponse = await chatCompletionStream({
        provider: provider as ProviderKey,
        model,
        messages,
        stream: true,
      });
    } catch (err) {
      // Update message status to error
      await db
        .update(chatMessages)
        .set({
          content: isAIError(err) ? err.message : "Failed to get response",
          status: "error",
        })
        .where(eq(chatMessages.messageId, assistantMessageId));

      // Clear draft
      await db
        .update(chatConversations)
        .set({ draftPrompt: null })
        .where(eq(chatConversations.chatId, conversationChatId));

      if (isAIError(err)) {
        return NextResponse.json(
          {
            error: err.message,
            code: err.code,
            retryable: err.retryable,
            suggestSwitch: err.suggestSwitch,
            chatId: conversationChatId,
            messageId: assistantMessageId,
          },
          { status: 200 } // 200 so client can read the body
        );
      }
      throw err;
    }

    // ── Transform provider SSE stream to our SSE stream ───────────────
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send chatId and messageId first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "meta", chatId: conversationChatId, messageId: assistantMessageId, isNewConversation })}\n\n`
            )
          );

          const reader = providerResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "token", content: delta })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip malformed JSON chunks
              }
            }
          }

          // Save complete message to DB
          await db
            .update(chatMessages)
            .set({ content: fullContent, status: "complete" })
            .where(eq(chatMessages.messageId, assistantMessageId));

          // Clear draft
          await db
            .update(chatConversations)
            .set({ draftPrompt: null })
            .where(eq(chatConversations.chatId, conversationChatId));

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                meta: {
                  provider,
                  model: model || "default",
                  mode: "stream",
                  toolsUsed: [],
                  contextMessages: messages.length - 1,
                  ms: Date.now() - startedAt,
                },
              })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          // Save partial content on error
          if (fullContent) {
            await db
              .update(chatMessages)
              .set({ content: fullContent, status: "error" })
              .where(eq(chatMessages.messageId, assistantMessageId));
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Stream interrupted. Partial response saved." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[PAI2 Chat Error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
