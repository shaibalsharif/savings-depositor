// lib/actions/notifications/reminders.ts

"use server";

import { db } from "@/lib/db";
import {
  notifications,
  notificationRecipients,
  deposits,
  users,
  funds,
} from "@/db/schema";
import { and, eq, lt, notInArray, sql } from "drizzle-orm";

/**
 * Sends a monthly deposit reminder notification to all users who have not yet deposited this month.
 * @param senderUserId The ID of the user who initiated this action (e.g., admin or manager).
 */
export async function sendMonthlyDepositReminder(senderUserId: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Find all users who have made a deposit this month.
    const usersWithDeposits = await db
      .selectDistinct({ userId: deposits.userId })
      .from(deposits)
      .where(eq(deposits.month, currentMonth));
    const depositedUserIds = usersWithDeposits.map((d) => d.userId);

    // Find all users who have NOT made a deposit this month.
    const usersToNotify = await db
      .select({ id: users.id })
      .from(users)
      .where(notInArray(users.id, depositedUserIds));

    if (usersToNotify.length === 0) {
      return {
        success: true,
        message:
          "All users have already submitted their deposits for this month.",
      };
    }

    const newNotification = await db
      .insert(notifications)
      .values({
        senderUserId,
        type: "monthly_deposit_reminder",
        title: "Deposit Reminder",
        message: "This is a friendly reminder to submit your monthly deposit.",
        relatedEntityType: "monthly_reminder",
      })
      .returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const recipientValues = usersToNotify.map((user) => ({
      notificationId,
      recipientUserId: user.id,
    }));

    await db.insert(notificationRecipients).values(recipientValues);

    return {
      success: true,
      message: `Reminders sent to ${usersToNotify.length} users.`,
    };
  } catch (error) {
    console.error("Failed to send monthly deposit reminders:", error);
    return { success: false, error: "Failed to send reminders." };
  }
}

/**
 * Sends a reminder notification to users with outstanding deposits from past months.
 * @param senderUserId The ID of the user who initiated this action.
 */
export async function sendOverdueDepositReminder(senderUserId: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Find all users with pending deposits from previous months
    const overdueDeposits = await db
      .select({ userId: deposits.userId, month: deposits.month })
      .from(deposits)
      .where(
        and(eq(deposits.status, "pending"), lt(deposits.month, currentMonth))
      )
      .groupBy(deposits.userId, deposits.month);

    if (overdueDeposits.length === 0) {
      return { success: true, message: "No overdue deposits found." };
    }

    // Map the overdue deposits to the user IDs to notify
    const usersToNotify = [...new Set(overdueDeposits.map((d) => d.userId))];

    const newNotification = await db
      .insert(notifications)
      .values({
        senderUserId,
        type: "overdue_deposit_reminder",
        title: "Overdue Deposit Reminder",
        message:
          "You have one or more outstanding deposits from previous months. Please submit them to clear your balance.",
        relatedEntityType: "overdue_reminder",
      })
      .returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    const recipientValues = usersToNotify.map((userId) => ({
      notificationId,
      recipientUserId: userId,
    }));

    await db.insert(notificationRecipients).values(recipientValues);

    return {
      success: true,
      message: `Overdue reminders sent to ${usersToNotify.length} users.`,
    };
  } catch (error) {
    console.error("Failed to send overdue deposit reminders:", error);
    return { success: false, error: "Failed to send overdue reminders." };
  }
}

/**
 * Sends a notification with current system stats to all users.
 * @param senderUserId The ID of the user who initiated this action.
 */
export async function sendCurrentStatsNotification(senderUserId: string) {
  try {
    // Calculate total fund balance
    const fundBalanceResult = await db
      .select({
        totalBalance: sql<string>`sum(${funds.balance})`.as("total_balance"),
      })
      .from(funds);
    const totalBalance = fundBalanceResult[0]?.totalBalance || "0.00";

    // Calculate total outstanding balance
    const outstandingBalanceResult = await db
      .select({
        totalOutstanding: sql<string>`sum(${deposits.amount})`.as(
          "total_outstanding"
        ),
      })
      .from(deposits)
      .where(eq(deposits.status, "pending"));
    const totalOutstanding =
      outstandingBalanceResult[0]?.totalOutstanding || "0.00";

    // Count users who haven't deposited this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usersWithDeposits = await db
      .selectDistinct({ userId: deposits.userId })
      .from(deposits)
      .where(eq(deposits.month, currentMonth));
    const depositedUserIds = usersWithDeposits.map((d) => d.userId);
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const usersNotDepositedCount =
      totalUsers[0].count - depositedUserIds.length;

    const message = `📊 Current Stats:\n- Total Fund Balance: ৳${totalBalance}\n- Total Outstanding Balance: ৳${totalOutstanding}\n- Users who haven't deposited this month: ${usersNotDepositedCount}`;

    const newNotification = await db
      .insert(notifications)
      .values({
        senderUserId,
        type: "system_stats_update",
        title: "Monthly System Stats",
        message,
        relatedEntityType: "stats_update",
      })
      .returning({ id: notifications.id });

    const notificationId = newNotification[0].id;

    // Send to all users
    const allUsers = await db.select({ id: users.id }).from(users);
    const recipientValues = allUsers.map((user) => ({
      notificationId,
      recipientUserId: user.id,
    }));

    await db.insert(notificationRecipients).values(recipientValues);

    return {
      success: true,
      message: "System stats notification sent to all users.",
    };
  } catch (error) {
    console.error("Failed to send current stats notification:", error);
    return { success: false, error: "Failed to send stats notification." };
  }
}
