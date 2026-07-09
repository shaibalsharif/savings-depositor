import { requireMember, isManager } from "@/lib/auth";
import { db } from "@/db/client";
import { chatConversations, chatMessages, personalInfo } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireMember();
    const managerRole = await isManager();

    const [allMembers, userConvs] = await Promise.all([
      managerRole ? db.select().from(personalInfo) : db.select().from(personalInfo).where(eq(personalInfo.userId, user.id)),
      managerRole ? db.select().from(chatConversations) : db.select().from(chatConversations).where(eq(chatConversations.userId, user.id)),
    ]);

    const convIds = userConvs.map((c) => c.chatId);
    
    const allMsgs = convIds.length > 0 
      ? await db.select().from(chatMessages).where(inArray(chatMessages.chatId, convIds))
      : [];

    const totalChats = userConvs.length;
    const totalMessages = allMsgs.filter((m) => m.role === "user").length;
    
    const providerStats = userConvs.reduce((acc, conv) => {
      acc[conv.provider] = (acc[conv.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const memberUsage = allMembers.map((member) => {
      const memberConvs = userConvs.filter((c) => c.userId === member.userId);
      const memberConvIds = memberConvs.map((c) => c.chatId);
      const memberMsgs = allMsgs.filter(
        (m) => memberConvIds.includes(m.chatId) && m.role === "user"
      );

      const voiceMsgs = memberMsgs.filter((m) => m.inputType === "voice").length;
      const fileMsgs = memberMsgs.filter((m) => m.inputType === "file").length;

      const lastActive = memberMsgs.length > 0 
        ? new Date(Math.max(...memberMsgs.map((m) => new Date(m.createdAt).getTime())))
        : null;

      return {
        name: member.name,
        userId: member.userId,
        chats: memberConvs.length,
        prompts: memberMsgs.length,
        voice: voiceMsgs,
        files: fileMsgs,
        lastActive: lastActive ? lastActive.toISOString() : null,
      };
    }).sort((a, b) => b.prompts - a.prompts);

    return NextResponse.json({
      totalChats,
      totalMessages,
      providerStats,
      memberUsage,
      totalMembers: allMembers.length,
      managerRole,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
