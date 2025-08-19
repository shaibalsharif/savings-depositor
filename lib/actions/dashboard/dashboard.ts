// lib/actions/dashboard.ts
"use server";

import { db } from "@/lib/db";
import {
  deposits,
  withdrawals,
  funds,
  users,
  depositSettings,
} from "@/db/schema";
import { and, eq, desc, sql, like } from "drizzle-orm";
import { format, startOfMonth, subMonths } from "date-fns";

interface DashboardData {
  totalBalance: number;
  monthlyCollected: number;
  monthlyCollectable: number;
  recentDeposits: any[];
  recentWithdrawals: any[];
}
export interface User {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
}

export async function getDashboardData(
  currentUserId: string
): Promise<any | { error: string }> {
  try {
    const today = new Date();
    const currentMonthStr = format(startOfMonth(today), "yyyy-MM");
    const twelveMonthsAgo = format(
      startOfMonth(subMonths(today, 12)),
      "yyyy-MM"
    );

    // Fetch all data in parallel
    const [
      allFunds,
      allUsers,
      currentMonthDeposits,
      allVerifiedDeposits,
      recentDeposits,
      recentWithdrawals,
      myDepositsThisMonth,
      myDeposits,
      myWithdrawals,
      monthlySetting,
    ] = await Promise.all([
      db
        .select({ balance: funds.balance })
        .from(funds)
        .where(eq(funds.deleted, false)),
      db.select().from(users),
      db
        .select()
        .from(deposits)
        .where(
          and(
            eq(deposits.status, "verified"),
            eq(deposits.month, currentMonthStr)
          )
        ),
      db.select().from(deposits).where(eq(deposits.status, "verified")),
      db
        .select({
          id: deposits.id,
          amount: deposits.amount,
          createdAt: deposits.createdAt,
          userId: deposits.userId,
          user: {
            name: users.name,
            picture: users.picture,
            email: users.email,
          },
        })
        .from(deposits)
        .leftJoin(users, eq(deposits.userId, users.id))
        .where(eq(deposits.status, "verified"))
        .orderBy(desc(deposits.createdAt))
        .limit(5),
      db
        .select({
          id: withdrawals.id,
          amount: withdrawals.amount,
          createdAt: withdrawals.createdAt,
          userId: withdrawals.userId,
          purpose: withdrawals.purpose,
          user: {
            name: users.name,
            email: users.email,
            picture: users.picture,
          },
        })
        .from(withdrawals)
        .leftJoin(users, eq(withdrawals.userId, users.id))
        .where(eq(withdrawals.status, "verified"))
        .orderBy(desc(withdrawals.createdAt))
        .limit(5),
      db
        .select()
        .from(deposits)
        .where(
          and(
            eq(deposits.userId, currentUserId),
            eq(deposits.month, currentMonthStr)
          )
        ),
      db
        .select({ amount: deposits.amount })
        .from(deposits)
        .where(eq(deposits.userId, currentUserId)),
      db
        .select({ amount: withdrawals.amount })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.userId, currentUserId),
            eq(withdrawals.status, "verified")
          )
        ),
      db
        .select()
        .from(depositSettings)
        .where(eq(depositSettings.effectiveMonth, currentMonthStr))
        .limit(1), // <-- Fetch the current deposit setting
    ]);

    // Calculate total balances
    const totalBalance = allFunds.reduce(
      (acc, fund) => acc + Number(fund.balance),
      0
    );
    const myTotalDeposit = myDeposits.reduce(
      (acc, d) => acc + Number(d.amount),
      0
    );
    const myTotalWithdrawal = myWithdrawals.reduce(
      (acc, w) => acc + Number(w.amount),
      0
    );
    const myCurrentBalance = myTotalDeposit - myTotalWithdrawal;

    // Get current deposit setting amount

    // Process monthly collection
    const monthlyDepositAmount = monthlySetting?.[0]?.monthlyAmount
      ? Number(monthlySetting[0].monthlyAmount)
      : 2100;
    const totalActiveUsers = allUsers.length; // Assuming users is fetched
    const monthlyCollectable = monthlyDepositAmount * totalActiveUsers;

    // Outstanding users
    const depositedUserIds = new Set(currentMonthDeposits.map((d) => d.userId));
    const outstandingUsers = allUsers.filter(
      (u) => !depositedUserIds.has(u.id)
    );
    const totalOutstanding = outstandingUsers.length * monthlyDepositAmount;

    // Monthly collection for Bar Chart
    const monthlyData: any = {};
    allVerifiedDeposits.forEach((d) => {
      const month = format(d.createdAt, "yyyy-MM");
      if (!monthlyData[month])
        monthlyData[month] = { deposits: 0, withdrawals: 0 };
      monthlyData[month].deposits += Number(d.amount);
    });

    const allVerifiedWithdrawals = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.status, "verified"));
    allVerifiedWithdrawals.forEach((w) => {
      const month = format(w.createdAt, "yyyy-MM");
      if (!monthlyData[month])
        monthlyData[month] = { deposits: 0, withdrawals: 0 };
      monthlyData[month].withdrawals += Number(w.amount);
    });

    const monthlyCollectionChartData = Object.keys(monthlyData)
      .sort()
      .filter((month) => month >= twelveMonthsAgo)
      .map((month) => ({
        month: month,
        deposits: monthlyData[month].deposits,
        withdrawals: monthlyData[month].withdrawals,
      }));

    // Payment Patterns Heatmap
    const paymentPatternData = allVerifiedDeposits.map((d) => ({
      userId: d.userId,
      month: d.month,
      status: "paid",
    }));

    return {
      totalBalance,
      myCurrentBalance,
      myDepositsThisMonth,
      monthlyCollectable,
      recentDeposits,
      recentWithdrawals,
      monthlyCollectionChartData,
      outstandingUsers,
      totalOutstanding,
      monthlyDepositAmount,
      paymentPatternData,
      allUsers,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { error: "Failed to fetch dashboard data" };
  }
}
