/**
 * PAI2 Conversations API Route
 *
 * GET    /api/pai2/conversations — List user's conversations
 * POST   /api/pai2/conversations — Create new conversation
 * PATCH  /api/pai2/conversations — Rename / move to folder
 * DELETE /api/pai2/conversations — Delete conversation(s)
 */

import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { chatConversations, chatMessages, chatFolders } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── GET — List conversations ──────────────────────────────────────────
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

    const [conversations, folders] = await Promise.all([
      db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.userId, user.id))
        .orderBy(desc(chatConversations.updatedAt)),
      db
        .select()
        .from(chatFolders)
        .where(eq(chatFolders.userId, user.id))
        .orderBy(chatFolders.name),
    ]);

    return NextResponse.json({ conversations, folders });
  } catch (err) {
    console.error("[PAI2 Conversations GET Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

// ── POST — Create conversation ────────────────────────────────────────
export async function POST(req: NextRequest) {
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
    const {
      title = "New Chat",
      provider = "groq",
      model = "default",
      folderId,
    } = body;

    const chatId = generateId("CHAT");
    await db.insert(chatConversations).values({
      chatId,
      title,
      userId: user.id,
      folderId: folderId || null,
      provider,
      model,
      status: "active",
    });

    const conversation = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.chatId, chatId),
    });

    return NextResponse.json({ conversation });
  } catch (err) {
    console.error("[PAI2 Conversations POST Error]", err);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}

// ── PATCH — Update conversation ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
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
    const { chatId, title, folderId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const conv = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.chatId, chatId),
        eq(chatConversations.userId, user.id),
      ),
    });

    if (!conv) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (folderId !== undefined) updates.folderId = folderId || null;

    if (Object.keys(updates).length > 0) {
      await db
        .update(chatConversations)
        .set(updates)
        .where(eq(chatConversations.chatId, chatId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PAI2 Conversations PATCH Error]", err);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 },
    );
  }
}

// ── DELETE — Delete conversation(s) ───────────────────────────────────
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
    const { chatIds } = body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json(
        { error: "chatIds array is required" },
        { status: 400 },
      );
    }

    // Verify ownership of all conversations
    const convs = await db
      .select({ chatId: chatConversations.chatId })
      .from(chatConversations)
      .where(
        and(
          inArray(chatConversations.chatId, chatIds),
          eq(chatConversations.userId, user.id),
        ),
      );

    const ownedChatIds = convs.map((c) => c.chatId);
    if (ownedChatIds.length === 0) {
      return NextResponse.json(
        { error: "No conversations found" },
        { status: 404 },
      );
    }

    // Delete messages first, then conversations
    await db
      .delete(chatMessages)
      .where(inArray(chatMessages.chatId, ownedChatIds));
    await db
      .delete(chatConversations)
      .where(inArray(chatConversations.chatId, ownedChatIds));

    return NextResponse.json({
      success: true,
      deleted: ownedChatIds.length,
    });
  } catch (err) {
    console.error("[PAI2 Conversations DELETE Error]", err);
    return NextResponse.json(
      { error: "Failed to delete conversations" },
      { status: 500 },
    );
  }
}
