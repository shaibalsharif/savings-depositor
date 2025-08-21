// lib/actions/notifications/customNotifications.ts

"use server";

import { db } from "@/lib/db";
import { notifications, notificationRecipients } from "@/db/schema";

/**
 * Sends a custom notification message to a list of specified users.
 * @param senderUserId The ID of the user sending the notification.
 * @param recipientUserIds An array of user IDs to receive the notification.
 * @param message The custom message to be sent.
 */
export async function sendCustomNotification(
  senderUserId: string,
  recipientUserIds: string[],
  message: string
) {
  if (recipientUserIds.length === 0) {
    return { success: false, error: "No recipients selected." };
  }

  try {
    const newNotification = await db
      .insert(notifications)
      .values({
        senderUserId,
        type: "custom_message",
        title: "New Message from Admin",
        message: message,
        relatedEntityType: "custom",
      })
      .returning({ id: notifications.id });

    const notificationId = newNotification[0].id;

    const recipientValues = recipientUserIds.map((id) => ({
      notificationId,
      recipientUserId: id,
    }));

    await db.insert(notificationRecipients).values(recipientValues);

    return { success: true, message: "Notifications sent successfully." };
  } catch (error) {
    console.error("Failed to send custom notifications:", error);
    return { success: false, error: "Failed to send notifications." };
  }
}
