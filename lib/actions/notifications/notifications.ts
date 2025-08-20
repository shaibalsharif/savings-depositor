// lib/actions/notifications/notifications.ts
"use server";

import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface UserNotification {
  id: string;
  recipientUserId: string;
  senderUserId: string | null;
  type: string;
  message: string;
  metadata: any | null;
  isRead: boolean;
  createdAt: Date;
}

export async function getUnreadNotifications(
  recipientUserId: string,
  limit: number
): Promise<UserNotification[] | { error: string }> {
  try {
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientUserId, recipientUserId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return unreadNotifications;
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return { error: "Failed to fetch notifications" };
  }
}