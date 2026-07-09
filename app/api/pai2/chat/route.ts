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
  isAIError,
  type ProviderKey,
  type ChatMessage,
} from "@/lib/ai/providers";
import { isManager as checkIsManager } from "@/lib/auth";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

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

    // Build system prompt with DB context
    const systemPrompt = await buildSystemPrompt(
      user.id,
      managerRole,
      userName
    );

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...existingMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20) // Keep last 20 messages to avoid token overflow
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
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
              `data: ${JSON.stringify({ type: "done" })}\n\n`
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
