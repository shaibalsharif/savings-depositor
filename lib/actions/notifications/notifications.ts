// lib/actions/notifications/db.ts

"use server";

import { db } from "@/lib/db";
import { notificationRecipients, notifications, users } from "@/db/schema";
import { eq, inArray, and, sql, desc } from "drizzle-orm";

const PAGE_LIMIT = 10;

/**
 * Fetches notifications for a specific user with cursor-based pagination.
 * @param userId The ID of the recipient user.
 * @param cursor The ID of the last notification from the previous page for pagination.
 * @param isReadFilter Filter for read/unread status. 'all' | 'read' | 'unread'
 */
export async function fetchNotificationsForUser(userId: string, cursor: string | null = null, isReadFilter: 'all' | 'read' | 'unread' = 'all') {
    if (!userId) {
        return { notifications: [], nextCursor: null, prevCursor: null };
    }

    const whereConditions = [
        eq(notificationRecipients.recipientUserId, userId)
    ];

    if (isReadFilter === 'read') {
        whereConditions.push(eq(notificationRecipients.isRead, true));
    } else if (isReadFilter === 'unread') {
        whereConditions.push(eq(notificationRecipients.isRead, false));
    }

    if (cursor) {
        whereConditions.push(sql`${notifications.createdAt} < (SELECT "createdAt" FROM "notifications" WHERE id = ${cursor})`);
    }

    try {
        const result = await db
            .select({
                id: notificationRecipients.id,
                isRead: notificationRecipients.isRead,
                notification: notifications,
            })
            .from(notificationRecipients)
            .innerJoin(notifications, eq(notificationRecipients.notificationId, notifications.id))
            .where(and(...whereConditions))
            .orderBy(desc(notifications.createdAt))
            .limit(PAGE_LIMIT + 1);

        let nextCursor = null;
        if (result.length > PAGE_LIMIT) {
            const lastItem = result.pop();
            nextCursor = lastItem?.notification.id || null;
        }

        const prevCursor = cursor; // The current cursor becomes the previous cursor for the next page.
        
        return { notifications: result, nextCursor, prevCursor };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { notifications: [], nextCursor: null, prevCursor: null };
    }
}
/**
 * Fetches unread notifications for a user, limited by a specific count.
 * This is designed for the dashboard header's quick view.
 * @param userId The ID of the recipient user.
 * @param limit The maximum number of notifications to return.
 */
export async function getUnreadNotifications(userId: string, limit: number) {
    if (!userId) {
        return [];
    }
    try {
        const result = await db
            .select({
                id: notificationRecipients.id,
                isRead: notificationRecipients.isRead,
                notification: notifications,
            })
            .from(notificationRecipients)
            .innerJoin(notifications, eq(notificationRecipients.notificationId, notifications.id))
            .where(and(eq(notificationRecipients.recipientUserId, userId), eq(notificationRecipients.isRead, false)))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);

        return result;
    } catch (error) {
        console.error("Failed to fetch unread notifications for header:", error);
        return [];
    }
}
/**
 * Marks a list of notifications as read for a specific user.
 * @param notificationIds An array of notification IDs (which are numbers) to mark as read.
 */
export async function markNotificationsAsRead(notificationIds: number[]) {
    if (notificationIds.length === 0) {
        return { success: false, error: "No notifications provided." };
    }
    try {
        await db.update(notificationRecipients).set({ isRead: true }).where(inArray(notificationRecipients.id, notificationIds));
        return { success: true };
    } catch (error) {
        console.error("Failed to mark notifications as read:", error);
        return { success: false, error: "Failed to mark notifications as read." };
    }
}

/**
 * Fetches all users from the database.
 */
export async function fetchAllUsers() {
    try {
        const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
        return allUsers;
    } catch (error) {
        console.error("Failed to fetch all users:", error);
        return [];
    }
}