import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { sendEmail } from "./email-adapter";
import { sendPush } from "./push-adapter";
import {
  depositConfirmedEmail,
  depositReminderEmail,
  monthlySummaryEmail,
} from "./templates";
import type {
  DepositNotificationData,
  NotificationPayload,
  ReminderNotificationData,
  SummaryNotificationData,
} from "./types";

// ── Low-level: send push to all subscriptions for a user ──────────────────

async function pushToUser(userId: string, payload: NotificationPayload): Promise<void> {
  const subs = await db.execute<{ endpoint: string; p256dh: string; auth: string }>(
    sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}`
  );

  for (const row of subs.rows) {
    const result = await sendPush(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      payload
    );
    if (result === "expired") {
      // Clean up dead subscription
      await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${row.endpoint}`);
      console.log("[NotificationService] Removed expired subscription:", row.endpoint.slice(0, 50));
    }
  }
}

// ── High-level notification functions ─────────────────────────────────────

export async function notifyDepositConfirmed(
  userId: string,
  data: DepositNotificationData
): Promise<void> {
  // Check member preferences + get notification email
  const rows = await db.execute<{
    notify_on_deposit: boolean;
    notification_email: string | null;
    email: string | null;
  }>(
    sql`SELECT notify_on_deposit, notification_email, email FROM personal_info WHERE user_id = ${userId} LIMIT 1`
  );

  const prefs = rows.rows[0];
  if (!prefs?.notify_on_deposit) return;

  const toEmail = prefs.notification_email ?? prefs.email;

  // Push notification
  await pushToUser(userId, {
    title: "✅ Deposit Recorded — Project 13",
    body: `৳${data.amount.toLocaleString()} for ${data.forMonth} confirmed. Your balance: ৳${data.memberBalance.toLocaleString()}`,
    url: "/dashboard",
  });

  // Email notification
  if (toEmail) {
    const { subject, html } = depositConfirmedEmail(data);
    await sendEmail(toEmail, subject, html);
  }
}

export async function notifyDepositReminder(
  userId: string,
  data: ReminderNotificationData
): Promise<void> {
  const rows = await db.execute<{
    notify_on_reminder: boolean;
    notification_email: string | null;
    email: string | null;
  }>(
    sql`SELECT notify_on_reminder, notification_email, email FROM personal_info WHERE user_id = ${userId} LIMIT 1`
  );

  const prefs = rows.rows[0];
  if (!prefs?.notify_on_reminder) return;

  const toEmail = prefs.notification_email ?? prefs.email;

  await pushToUser(userId, {
    title: "⚠️ Deposit Reminder",
    body: `${data.forMonth} deposit of ৳${data.amountDue.toLocaleString()} is still pending!`,
    url: "/dashboard",
  });

  if (toEmail) {
    const { subject, html } = depositReminderEmail(data);
    await sendEmail(toEmail, subject, html);
  }
}

export async function notifyMonthlySummary(
  userId: string,
  data: SummaryNotificationData
): Promise<void> {
  const rows = await db.execute<{
    notify_on_summary: boolean;
    notification_email: string | null;
    email: string | null;
  }>(
    sql`SELECT notify_on_summary, notification_email, email FROM personal_info WHERE user_id = ${userId} LIMIT 1`
  );

  const prefs = rows.rows[0];
  if (!prefs?.notify_on_summary) return;

  const toEmail = prefs.notification_email ?? prefs.email;
  const pct = data.totalExpected > 0
    ? Math.round((data.totalCollected / data.totalExpected) * 100)
    : 0;

  await pushToUser(userId, {
    title: `📊 ${data.forMonth} Summary — Project 13`,
    body: `Collected ৳${data.totalCollected.toLocaleString()} of ৳${data.totalExpected.toLocaleString()} (${pct}%). Fund: ৳${data.fundBalance.toLocaleString()}`,
    url: "/dashboard",
  });

  if (toEmail) {
    const { subject, html } = monthlySummaryEmail(data);
    await sendEmail(toEmail, subject, html);
  }
}
