// utils/notifications.ts

import { notifications } from "@/db/schema";
import { db } from "@/lib/db";

export interface NotificationPayload {
  recipientUserId: string;
  senderUserId?: string | null;
  type: string;
  message: string;
  metadata?: any;
  relatedEntityId?: string | null;
  roleTarget?: string | null;
}

export async function createNotification(payload: NotificationPayload) {
  await db.insert(notifications).values({
    recipientUserId: payload.recipientUserId,
    senderUserId: payload.senderUserId || null,
    type: payload.type,
    message: payload.message,
    metadata: payload.metadata || null,
    isRead: false,
    createdAt: new Date(),
    relatedEntityId: payload.relatedEntityId || null,
    roleTarget: payload.roleTarget || null,
  });
}
