/**
 * PAI2 Messages API Route
 *
 * GET /api/pai2/messages?chatId=xxx — Fetch messages for a conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { chatConversations, chatMessages } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const chatId = req.nextUrl.searchParams.get("chatId");
    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    // Verify ownership
    const conv = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.chatId, chatId),
        eq(chatConversations.userId, user.id)
      ),
    });

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json({
      messages,
      conversation: conv,
    });
  } catch (err) {
    console.error("[PAI2 Messages GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * DELETE /api/pai2/messages — Delete specific messages from an owned conversation.
 * Body: { chatId: string, messageIds: string[] }
 * Used by the client for "regenerate" and "edit & resend" flows.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();
    const { chatId, messageIds } = body as {
      chatId?: string;
      messageIds?: string[];
    };

    if (!chatId || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "chatId and a non-empty messageIds array are required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting anything
    const conv = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.chatId, chatId),
        eq(chatConversations.userId, user.id)
      ),
    });

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await db
      .delete(chatMessages)
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          inArray(chatMessages.messageId, messageIds)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PAI2 Messages DELETE Error]", err);
    return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 });
  }
}
