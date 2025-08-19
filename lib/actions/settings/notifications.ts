// lib/actions/settings/notifications.ts
"use server";

import { db } from "@/lib/db";
import { users, notifications, notificationSettings, deposits } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getKindeManagementToken } from "@/lib/kinde-management";
import { z } from "zod";
import { format } from "date-fns";

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

const sendReminderSchema = z.object({
  month: z.string(),
  senderUserId: z.string(),
});

export async function getNotificationSettings(userId: string) {
  try {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
      
    // Return fetched settings or default values if none exist
    return settings || { emailNotifications: true, smsNotifications: false };
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return { error: "Failed to fetch settings" };
  }
}

export async function saveNotificationSettings(data: z.infer<typeof notificationSettingsSchema>, userId: string) {
  const parsed = notificationSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }
  
  try {
    // Check if settings already exist for the user
    const [existingSettings] = await db.select().from(notificationSettings).where(eq(notificationSettings.userId, userId));
    
    if (existingSettings) {
      await db.update(notificationSettings)
        .set({
          emailNotifications: parsed.data.emailNotifications,
          smsNotifications: parsed.data.smsNotifications,
          updatedAt: new Date(),
        })
        .where(eq(notificationSettings.userId, userId));
    } else {
      // Insert new settings if they don't exist
      await db.insert(notificationSettings).values({
        userId,
        emailNotifications: parsed.data.emailNotifications,
        smsNotifications: parsed.data.smsNotifications,
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return { error: "Failed to save settings" };
  }
}

export async function sendDepositReminder(month: string, senderUserId: string) {
  try {
    const token = await getKindeManagementToken();
    const usersRes = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allKindeUsers = (await usersRes.json()).users;
    
    const depositedUsers = await db.select({ userId: deposits.userId }).from(deposits).where(and(eq(deposits.month, month), inArray(deposits.status, ['verified', 'pending'])));
    const depositedUserIds = new Set(depositedUsers.map(d => d.userId));

    const usersToNotify = allKindeUsers.filter((user: any) => user.id && !depositedUserIds.has(user.id));

    if (usersToNotify.length === 0) {
      return { message: "All users have submitted deposits" };
    }

    const notificationsToInsert = usersToNotify.map((user: any) => ({
      recipientUserId: user.id,
      senderUserId,
      type: "deposit_reminder",
      message: `Reminder: Please submit your deposit for ${month}.`,
      metadata: { month },
    }));

    await db.insert(notifications).values(notificationsToInsert);
    
    return { success: true, notifiedCount: usersToNotify.length };
  } catch (error) {
    console.error("Failed to send deposit reminders:", error);
    return { error: "Internal server error" };
  }
}