import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeManagementToken } from "@/lib/kinde-management";
import { deposits, notifications } from "@/db/schema/logs";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { month, senderUserId } = await req.json();

    if (!month || !senderUserId) {
      return NextResponse.json(
        { error: "Missing month or senderUserId" },
        { status: 400 }
      );
    }

    // 1. Get all users from Kinde Management API
    const token = await getKindeManagementToken();

    const usersRes = await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/users`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!usersRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch users from Kinde" },
        { status: 500 }
      );
    }
    const allUsers = await usersRes.json(); // assuming array of users

    // 2. Get userIds who have deposited for the month
    const depositedUsers = await db
      .select({ userId: deposits.userId })
      .from(deposits)
      .where(eq(deposits.month, month));

    const depositedUserIds = new Set(depositedUsers.map((d) => d.userId));

    // 3. Filter users who have NOT deposited
    const usersToNotify =
      allUsers &&
      allUsers.users &&
      allUsers.users.length &&
      allUsers.users?.filter(
        (user: any) => user.id && !depositedUserIds.has(user.id)
      );

    if (!usersToNotify || usersToNotify.length === 0) {
      return NextResponse.json({
        message: "All users have submitted deposits",
      });
    }

    // 4. Create notifications for those users
    const notificationsToInsert = usersToNotify.map((user: any) => ({
      recipientUserId: user.id,
      senderUserId,
      type: "deposit_reminder",
      message: `Reminder: Please submit your deposit for ${month}.`,
      metadata: { month },
      isRead: false,
      createdAt: new Date(),
    }));

    await db.insert(notifications).values(notificationsToInsert);

    return NextResponse.json({
      success: true,
      notifiedCount: usersToNotify.length,
    });
  } catch (error) {
    console.error("Failed to send deposit reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
