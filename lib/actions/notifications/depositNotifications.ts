// lib/actions/notifications/depositNotifications.ts

"use server";

import { db } from "@/lib/db";
import { notifications, notificationRecipients, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Sends a notification to all managers when a new deposit is submitted.
 * @param depositId The ID of the newly created deposit.
 * @param userId The ID of the user who submitted the deposit.
 * @param amount The amount of the deposit.
 * @param month The month for which the deposit was made.
 */
export async function sendDepositSubmittedNotification(depositId: string, userId: string, amount: number, month: string) {
  try {
    const user = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    const senderName = user[0]?.name || "A user";

    const newNotification = await db.insert(notifications).values({
      senderUserId: userId,
      type: "new_deposit_request",
      title: "New Deposit Request",
      message: `${senderName} has submitted a deposit request of ৳${amount} for ${month}.`,
      relatedEntityId: depositId,
      relatedEntityType: "deposit",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const managers = await db.select({ id: users.id }).from(users).where(sql`permissions @> '["manager"]'`);

    const recipientValues = managers.map(manager => ({
      notificationId,
      recipientUserId: manager.id,
    }));

    if (recipientValues.length > 0) {
      await db.insert(notificationRecipients).values(recipientValues);
    }
  } catch (error) {
    console.error("Failed to create notification for new deposit:", error);
  }
}

/**
 * Sends a notification to the user after their deposit has been reviewed.
 * @param depositId The ID of the reviewed deposit.
 * @param reviewerId The ID of the manager who reviewed the deposit.
 * @param recipientUserId The ID of the user who submitted the deposit.
 * @param status The status of the review ('verified' or 'rejected').
 * @param amount The amount of the deposit.
 * @param reason The reason for rejection (if applicable).
 */
export async function sendDepositReviewNotification(depositId: string, reviewerId: string, recipientUserId: string, status: "verified" | "rejected", amount: number, reason?: string) {
  try {
    let title;
    let message;
    if (status === "verified") {
      title = "Deposit Verified! 🟢";
      message = `Your deposit of ৳${amount} has been successfully verified.`;
    } else {
      title = "Deposit Rejected 🔴";
      message = `Your deposit of ৳${amount} has been rejected. Reason: ${reason || "Not provided"}.`;
    }

    const newNotification = await db.insert(notifications).values({
      senderUserId: reviewerId,
      type: `deposit_${status}`,
      title,
      message,
      relatedEntityId: depositId,
      relatedEntityType: "deposit",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;

    await db.insert(notificationRecipients).values({
      notificationId,
      recipientUserId,
    });
  } catch (error) {
    console.error("Failed to create notification for deposit review:", error);
  }
}