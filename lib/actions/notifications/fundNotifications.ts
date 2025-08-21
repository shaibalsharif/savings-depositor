// lib/actions/notifications/fundNotifications.ts

"use server";

import { db } from "@/lib/db";
import { notifications, notificationRecipients, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const getAdmins = () => db.select({ id: users.id }).from(users).where(sql`permissions @> '["admin"]'`);
const getAdminsAndManagers = () => db.select({ id: users.id }).from(users).where(sql`permissions @> '["admin"]' OR permissions @> '["manager"]'`);


/**
 * Sends a notification to all admins and managers when a new fund is created.
 */
export async function sendFundCreationNotification(fundId: number, fundTitle: string, createdBy: string) {
  try {
    const newNotification = await db.insert(notifications).values({
      senderUserId: createdBy,
      type: "fund_created",
      title: "New Fund Created",
      message: `A new fund titled "${fundTitle}" has been created.`,
      relatedEntityId: fundId.toString(),
      relatedEntityType: "fund",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const recipients = await getAdminsAndManagers();
    
    if (recipients.length > 0) {
      await db.insert(notificationRecipients).values(recipients.map(r => ({
        notificationId,
        recipientUserId: r.id,
      })));
    }
  } catch (error) {
    console.error("Failed to send fund creation notification:", error);
  }
}

/**
 * Sends a notification to all admins and managers when a fund is deleted.
 */
export async function sendFundDeletionNotification(fundId: number, fundTitle: string, deletedBy: string) {
  try {
    const newNotification = await db.insert(notifications).values({
      senderUserId: deletedBy,
      type: "fund_deleted",
      title: "Fund Deleted",
      message: `The fund "${fundTitle}" has been deleted.`,
      relatedEntityId: fundId.toString(),
      relatedEntityType: "fund",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const recipients = await getAdminsAndManagers();

    if (recipients.length > 0) {
      await db.insert(notificationRecipients).values(recipients.map(r => ({
        notificationId,
        recipientUserId: r.id,
      })));
    }
  } catch (error) {
    console.error("Failed to send fund deletion notification:", error);
  }
}

/**
 * Sends a notification to all admins when a fund transfer occurs.
 */
export async function sendFundTransferNotification(fromFundTitle: string, toFundTitle: string, amount: number, transferredBy: string) {
  try {
    const newNotification = await db.insert(notifications).values({
      senderUserId: transferredBy,
      type: "fund_transfer",
      title: "Fund Transfer Complete",
      message: `A fund transfer of ৳${amount} was completed from "${fromFundTitle}" to "${toFundTitle}".`,
      metadata: { fromFund: fromFundTitle, toFund: toFundTitle, amount },
      relatedEntityType: "fund_transaction",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const recipients = await getAdmins();

    if (recipients.length > 0) {
      await db.insert(notificationRecipients).values(recipients.map(r => ({
        notificationId,
        recipientUserId: r.id,
      })));
    }
  } catch (error) {
    console.error("Failed to send fund transfer notification:", error);
  }
}