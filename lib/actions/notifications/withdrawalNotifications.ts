// lib/actions/notifications/withdrawalNotifications.ts

"use server";

import { db } from "@/lib/db";
import { notifications, notificationRecipients, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Sends a notification to all managers when a new withdrawal request is submitted.
 * @param withdrawalId The ID of the newly created withdrawal request.
 * @param userId The ID of the user who submitted the request.
 * @param amount The amount of the withdrawal.
 * @param purpose The purpose of the withdrawal.
 */
export async function sendWithdrawalSubmittedNotification(
  withdrawalId: string,
  userId: string,
  amount: number,
  purpose: string
) {
  try {
    const user = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const senderName = user[0]?.name || "A user";

    const newNotification = await db
      .insert(notifications)
      .values({
        senderUserId: userId,
        type: "new_withdrawal_request",
        title: "New Withdrawal Request",
        message: `${senderName} has submitted a withdrawal request of ৳${amount} for "${purpose}".`,
        relatedEntityId: withdrawalId,
        relatedEntityType: "withdrawal",
      })
      .returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const managers = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`permissions @> '["manager"]'`);

    const recipientValues = managers.map((manager) => ({
      notificationId,
      recipientUserId: manager.id,
    }));

    if (recipientValues.length > 0) {
      await db.insert(notificationRecipients).values(recipientValues);
    }
  } catch (error) {
    console.error("Failed to create notification for new withdrawal:", error);
  }
}

/**
 * Sends a notification to the user after their withdrawal request has been reviewed.
 * @param withdrawalId The ID of the reviewed withdrawal.
 * @param reviewerId The ID of the manager who reviewed the request.
 * @param recipientUserId The ID of the user who submitted the request.
 * @param status The status of the review ('approved' or 'rejected').
 * @param amount The amount of the withdrawal.
 */
export async function sendWithdrawalReviewNotification(
  withdrawalId: string,
  reviewerId: string,
  recipientUserId: string,
  status: "approved" | "rejected",
  amount: number
) {
  try {
    let title;
    let message;
    if (status === "approved") {
      title = "Withdrawal Approved! 🟢";
      message = `Your withdrawal request of ৳${amount} has been approved.`;
    } else {
      title = "Withdrawal Rejected 🔴";
      message = `Your withdrawal request of ৳${amount} has been rejected.`;
    }

    const newNotification = await db
      .insert(notifications)
      .values({
        senderUserId: reviewerId,
        type: `withdrawal_${status}`,
        title,
        message,
        relatedEntityId: withdrawalId,
        relatedEntityType: "withdrawal",
      })
      .returning({ id: notifications.id });

    const notificationId = newNotification[0].id;

    await db.insert(notificationRecipients).values({
      notificationId,
      recipientUserId,
    });
  } catch (error) {
    console.error(
      "Failed to create notification for withdrawal review:",
      error
    );
  }
}
