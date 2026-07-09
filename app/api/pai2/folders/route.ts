/**
 * PAI2 Folders API Route
 *
 * GET    /api/pai2/folders — List user's folders
 * POST   /api/pai2/folders — Create folder
 * PATCH  /api/pai2/folders — Rename folder
 * DELETE /api/pai2/folders — Delete folder (moves chats to unfiled)
 */

import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { chatFolders, chatConversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

    const folders = await db
      .select()
      .from(chatFolders)
      .where(eq(chatFolders.userId, user.id))
      .orderBy(chatFolders.name);

    return NextResponse.json({ folders });
  } catch (err) {
    console.error("[PAI2 Folders GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

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
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const folderId = generateId("FOLD");
    await db.insert(chatFolders).values({
      folderId,
      name: name.trim(),
      userId: user.id,
    });

    const folder = await db.query.chatFolders.findFirst({
      where: eq(chatFolders.folderId, folderId),
    });

    return NextResponse.json({ folder });
  } catch (err) {
    console.error("[PAI2 Folders POST Error]", err);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

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
    const { folderId, name } = body;

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    const folder = await db.query.chatFolders.findFirst({
      where: and(eq(chatFolders.folderId, folderId), eq(chatFolders.userId, user.id)),
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (name && typeof name === "string" && name.trim().length > 0) {
      await db
        .update(chatFolders)
        .set({ name: name.trim() })
        .where(eq(chatFolders.folderId, folderId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PAI2 Folders PATCH Error]", err);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

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
    const { folderId } = body;

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    const folder = await db.query.chatFolders.findFirst({
      where: and(eq(chatFolders.folderId, folderId), eq(chatFolders.userId, user.id)),
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Move all chats in this folder to unfiled
    await db
      .update(chatConversations)
      .set({ folderId: null })
      .where(eq(chatConversations.folderId, folderId));

    // Delete the folder
    await db.delete(chatFolders).where(eq(chatFolders.folderId, folderId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PAI2 Folders DELETE Error]", err);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
