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

import { sentNotifications, pendingNotifications, payments } from "@/db/schema";
import { eq, lte, and } from "drizzle-orm";

// Helper to log notifications
async function logNotification(
  senderId: string,
  userId: string,
  type: string,
  title: string,
  message: string,
  channels: string[]
) {
  await db.insert(sentNotifications).values({
    senderId,
    userId,
    type,
    title,
    message,
    channels,
  });
}

// ── High-level notification functions ─────────────────────────────────────

export async function notifyDepositConfirmed(
  userId: string,
  data: DepositNotificationData
): Promise<void> {
  const scheduledFor = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now

  await db.insert(pendingNotifications).values({
    userId,
    paymentId: data.paymentId,
    type: "deposit",
    payload: data,
    scheduledFor,
    status: "pending",
  });
}

export async function processPendingNotifications() {
  const pending = await db.select().from(pendingNotifications).where(
    and(
      eq(pendingNotifications.status, "pending"),
      lte(pendingNotifications.scheduledFor, new Date())
    )
  );

  for (const job of pending) {
    try {
      // Check if payment was voided
      const paymentRow = await db.select({ voided: payments.voided }).from(payments).where(eq(payments.paymentId, job.paymentId)).limit(1);
      
      if (!paymentRow.length || paymentRow[0].voided) {
        await db.update(pendingNotifications).set({ status: "cancelled" }).where(eq(pendingNotifications.id, job.id));
        continue;
      }

      const userId = job.userId;
      const data = job.payload as unknown as DepositNotificationData;

      const rows = await db.execute<{
        notify_on_deposit: boolean;
        notification_email: string | null;
        email: string | null;
      }>(
        sql`SELECT notify_on_deposit, notification_email, email FROM personal_info WHERE user_id = ${userId} LIMIT 1`
      );

      const prefs = rows.rows[0];
      if (!prefs?.notify_on_deposit) {
        await db.update(pendingNotifications).set({ status: "cancelled" }).where(eq(pendingNotifications.id, job.id));
        continue;
      }

      const toEmail = prefs.notification_email ?? prefs.email;
      const channels: string[] = [];

      const title = "✅ Deposit Recorded — Project 13";
      const body = `৳${data.amount.toLocaleString()} for ${data.forMonth} confirmed. Your balance: ৳${data.memberBalance.toLocaleString()}`;

      await pushToUser(userId, { title, body, url: "/dashboard" });
      channels.push("push");

      if (toEmail) {
        const { subject, html } = depositConfirmedEmail(data);
        await sendEmail(toEmail, subject, html);
        channels.push("email");
      }

      await logNotification("system", userId, "deposit", title, body, channels);
      await db.update(pendingNotifications).set({ status: "sent" }).where(eq(pendingNotifications.id, job.id));

    } catch (e) {
      console.error(`Failed to process pending notification ${job.id}`, e);
    }
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
  const channels: string[] = [];

  const title = "⚠️ Deposit Reminder";
  const body = `${data.forMonth} deposit of ৳${data.amountDue.toLocaleString()} is still pending!`;

  await pushToUser(userId, { title, body, url: "/dashboard" });
  channels.push("push");

  if (toEmail) {
    const { subject, html } = depositReminderEmail(data);
    await sendEmail(toEmail, subject, html);
    channels.push("email");
  }

  await logNotification("system", userId, "reminder", title, body, channels);
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
  const channels: string[] = [];
  
  const pct = data.totalExpected > 0
    ? Math.round((data.totalCollected / data.totalExpected) * 100)
    : 0;

  const title = `📊 ${data.forMonth} Summary — Project 13`;
  const body = `Collected ৳${data.totalCollected.toLocaleString()} of ৳${data.totalExpected.toLocaleString()} (${pct}%). Fund: ৳${data.fundBalance.toLocaleString()}`;

  await pushToUser(userId, { title, body, url: "/dashboard" });
  channels.push("push");

  if (toEmail) {
    const { subject, html } = monthlySummaryEmail(data);
    await sendEmail(toEmail, subject, html);
    channels.push("email");
  }

  await logNotification("system", userId, "summary", title, body, channels);
}

export async function notifyCustom(
  senderId: string,
  userId: string,
  title: string,
  message: string,
  type: string = "info"
): Promise<void> {
  const rows = await db.execute<{
    notification_email: string | null;
    email: string | null;
  }>(
    sql`SELECT notification_email, email FROM personal_info WHERE user_id = ${userId} LIMIT 1`
  );

  const prefs = rows.rows[0];
  if (!prefs) return;

  const toEmail = prefs.notification_email ?? prefs.email;
  const channels: string[] = [];

  await pushToUser(userId, { title, body: message, url: "/notifications" });
  channels.push("push");

  if (toEmail) {
    // Basic custom email template
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a;">${title}</h2>
        <p style="color: #334155; line-height: 1.6; font-size: 16px;">
          ${message.replace(/\n/g, "<br/>")}
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Sent via Project 13 Notification System.</p>
      </div>
    `;
    await sendEmail(toEmail, title, html);
    channels.push("email");
  }

  await logNotification(senderId, userId, type, title, message, channels);
}
