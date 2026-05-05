import { NextResponse } from "next/server";
import { format, endOfMonth, isSameDay } from "date-fns";
import { getManagerDashboardStats } from "@/lib/queries/dashboard";
import { notifyDepositReminder, notifyMonthlySummary } from "@/lib/notifications/service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}` || url.searchParams.get("secret") === process.env.CRON_SECRET;

  if (!isVercelCron && process.env.NODE_ENV === "production") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date();
    const isFirstDay = today.getDate() === 1;
    const isLastDay = isSameDay(today, endOfMonth(today));

    if (!isFirstDay && !isLastDay) {
      return NextResponse.json({ success: true, message: "Not a notification day" });
    }

    const stats = await getManagerDashboardStats();
    let notificationsSent = 0;

    if (isFirstDay) {
      // 1st of the month: Monthly summary for the *previous* month
      const prevMonth = new Date(today);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const forMonthStr = format(prevMonth, "yyyy-MM");

      const totalMembers = stats.membersCount || 20;
      const totalExpected = stats.monthlyChart?.find((m) => m.month === format(prevMonth, "MMM yy"))?.expected || 0;
      const totalCollected = stats.monthlyChart?.find((m) => m.month === format(prevMonth, "MMM yy"))?.collected || 0;
      
      const unpaidMembers = stats.memberPendings
        .map((m) => {
           const due = m.breakdown.find((b) => b.month === forMonthStr)?.due;
           return due ? { name: m.name, due } : null;
        })
        .filter(Boolean) as { name: string; due: number }[];

      const membersPaid = totalMembers - unpaidMembers.length;

      // Notify all members (using heatmapData to easily get all member IDs)
      for (const member of stats.heatmapData.heatmapData || []) {
        await notifyMonthlySummary(member.memberId, {
          forMonth: forMonthStr,
          totalCollected,
          totalExpected,
          membersPaid,
          totalMembers,
          fundBalance: stats.balance,
          unpaidMembers,
        });
        notificationsSent++;
      }

    } else if (isLastDay) {
      // Last day of the month: Reminders for the *current* month
      const forMonthStr = format(today, "yyyy-MM");
      
      for (const member of stats.memberPendings) {
        const monthDue = member.breakdown.find((b) => b.month === forMonthStr);
        if (monthDue && monthDue.due > 0) {
          await notifyDepositReminder(member.memberId, {
            memberName: member.name,
            forMonth: forMonthStr,
            amountDue: monthDue.due,
          });
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (e: any) {
    console.error("Cron Error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
