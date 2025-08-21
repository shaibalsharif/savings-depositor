// lib/actions/notifications/userNotifications.ts

"use server";

import { db } from "@/lib/db";
import { notifications, notificationRecipients, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const getAdminsAndManagers = () => db.select({ id: users.id }).from(users).where(sql`permissions @> '["admin"]' OR permissions @> '["manager"]'`);
const getAllUsers = () => db.select({ id: users.id }).from(users);

/**
 * Sends notifications to a new user and all admins/managers.
 */
export async function sendNewUserNotifications(newUserId: string, adderId: string) {
  try {
    // Notify the new user
    const newUserNotification = await db.insert(notifications).values({
      senderUserId: adderId,
      type: "user_account_created",
      title: "Welcome!",
      message: "Your account has been successfully created.",
      relatedEntityId: newUserId,
      relatedEntityType: "user",
    }).returning({ id: notifications.id });

    await db.insert(notificationRecipients).values({
      notificationId: newUserNotification[0].id,
      recipientUserId: newUserId,
    });

    // Notify all admins and managers
    const newAccountNotification = await db.insert(notifications).values({
      senderUserId: adderId,
      type: "new_user_added",
      title: "New User Added",
      message: "A new user has been added to the system.",
    }).returning({ id: notifications.id });

    const recipients = await getAdminsAndManagers();
    
    if (recipients.length > 0) {
      await db.insert(notificationRecipients).values(recipients.map(r => ({
        notificationId: newAccountNotification[0].id,
        recipientUserId: r.id,
      })));
    }
  } catch (error) {
    console.error("Failed to create notification for new user:", error);
  }
}

/**
 * Sends notifications to a user and the admin who suspended/unsuspended them.
 */
export async function sendUserSuspensionNotification(userId: string, adminId: string, isSuspended: boolean) {
  try {
    const action = isSuspended ? "suspended" : "unsuspended";
    const title = `Account ${action}`;
    const message = `Your account has been ${action}.`;

    const newNotification = await db.insert(notifications).values({
      senderUserId: adminId,
      type: `user_${action}`,
      title,
      message,
      relatedEntityId: userId,
      relatedEntityType: "user",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;
    await db.insert(notificationRecipients).values([
      { notificationId, recipientUserId: userId }, // Affected user
      { notificationId, recipientUserId: adminId }  // Admin who took the action
    ]);
  } catch (error) {
    console.error("Failed to create notification for user suspension:", error);
  }
}

/**
 * Sends a notification to all users when a new manager is assigned or removed.
 */
export async function sendManagerRoleNotification(userId: string, type: "assign" | "remove") {
  try {
    const action = type === 'assign' ? 'assigned' : 'removed';
    const title = `Manager Role ${action}`;
    const allUsersList = await getAllUsers();

    if (allUsersList.length === 0) return;

    const newNotification = await db.insert(notifications).values({
      senderUserId: null, // System-generated notification
      type: `manager_role_${action}`,
      title,
      message: `The manager role has been ${action}.`,
      relatedEntityId: userId,
      relatedEntityType: "permission_change",
    }).returning({ id: notifications.id });

    const notificationId = newNotification[0].id;

    const recipientValues = allUsersList.map(user => ({
      notificationId,
      recipientUserId: user.id,
    }));
    await db.insert(notificationRecipients).values(recipientValues);

  } catch (error) {
    console.error("Failed to create manager role notification:", error);
  }
}