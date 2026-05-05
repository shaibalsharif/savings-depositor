"use server";

import { db } from "@/db/client";
import { sentNotifications, personalInfo } from "@/db/schema";
import { requireManager, requireMember } from "@/lib/auth";
import { notifyCustom } from "@/lib/notifications/service";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotificationQuota() {
  await requireManager();

  // Resend free tier gives 3,000 emails per month. We count how many emails sent this month.
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const res = await db.execute<{ count: string }>(
    sql`SELECT count(*) FROM sent_notifications WHERE created_at >= ${startOfMonth} AND channels ? 'email'`
  );

  return {
    used: parseInt(res.rows[0]?.count || "0", 10),
    total: 3000,
  };
}

export async function getManagerNotificationHistory() {
  await requireManager();

  const history = await db.select({
    id: sentNotifications.id,
    type: sentNotifications.type,
    title: sentNotifications.title,
    message: sentNotifications.message,
    channels: sentNotifications.channels,
    createdAt: sentNotifications.createdAt,
    senderId: sentNotifications.senderId,
    userId: sentNotifications.userId,
    userName: personalInfo.name,
  })
  .from(sentNotifications)
  .leftJoin(personalInfo, eq(sentNotifications.userId, personalInfo.userId))
  .orderBy(desc(sentNotifications.createdAt))
  .limit(100);

  return history;
}

export async function getMemberNotifications() {
  const user = await requireMember();

  const notifications = await db.select()
    .from(sentNotifications)
    .where(eq(sentNotifications.userId, user.id))
    .orderBy(desc(sentNotifications.createdAt))
    .limit(50);

  return notifications;
}

export async function markNotificationAsRead(id: number) {
  const user = await requireMember();
  
  await db.update(sentNotifications)
    .set({ isRead: true })
    .where(and(
      eq(sentNotifications.id, id),
      eq(sentNotifications.userId, user.id)
    ));
    
  revalidatePath("/notifications");
  return { success: true };
}

export async function sendManualNotification(data: {
  userIds: string[]; // empty array means broadcast
  type: string; // 'info' or 'reminder'
  title: string;
  message: string;
}) {
  const manager = await requireManager();

  try {
    let targets = data.userIds;

    if (targets.length === 0) {
      // Broadcast to all active members
      const allMembers = await db.select({ userId: personalInfo.userId }).from(personalInfo);
      targets = allMembers.map(m => m.userId);
    }

    for (const targetId of targets) {
      await notifyCustom(manager.id, targetId, data.title, data.message, data.type);
    }

    revalidatePath("/notifications");
    return { success: true, count: targets.length };
  } catch (error: any) {
    console.error("Failed to send notifications:", error);
    return { success: false, error: error.message };
  }
}
