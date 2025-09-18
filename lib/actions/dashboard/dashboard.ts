"use server";

import { db } from "@/lib/db";
import {
  deposits,
  withdrawals,
  funds,
  users,
  depositSettings,
} from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { format, startOfMonth, subMonths,differenceInDays,addDays } from "date-fns";
// import { format, startOfMonth, subMonths,  } from "date-fns";


// Define a type for a user with their outstanding months
export interface OutstandingUser {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
  outstandingMonths: string[];
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

    // Fetch all necessary data in parallel
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
        .where(eq(withdrawals.status, "approved"))
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
            eq(withdrawals.status, "approved")
          )
        ),
      db
        .select()
        .from(depositSettings)
        .where(eq(depositSettings.effectiveMonth, currentMonthStr))
        .limit(1),
    ]);

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

    const monthlyDepositAmount = monthlySetting?.[0]?.monthlyAmount
      ? Number(monthlySetting[0].monthlyAmount)
      : 2100;
    const totalActiveUsers = allUsers.length;
    const monthlyCollectable = monthlyDepositAmount * totalActiveUsers;
    const monthlyCollected = currentMonthDeposits.reduce(
      (acc, d) => acc + Number(d.amount),
      0
    );

    // --- NEW LOGIC FOR OUTSTANDING PAYMENTS ---
    // 1. Get all distinct past months with verified deposits
    const pastMonths = [...new Set(allVerifiedDeposits.map((d) => d.month))]
      .filter((m) => m !== currentMonthStr)
      .sort();

    // 2. Create a map of user payments for quick lookup
    const userPaymentsMap = new Map();
    allVerifiedDeposits.forEach((d) => {
      if (!userPaymentsMap.has(d.userId)) {
        userPaymentsMap.set(d.userId, new Set());
      }
      userPaymentsMap.get(d.userId).add(d.month);
    });

    // 3. Find outstanding months for each user
    const outstandingUsers: OutstandingUser[] = allUsers
      .map((user) => {
        const paidMonths = userPaymentsMap.get(user.id) || new Set();
        const outstandingMonths = pastMonths.filter(
          (month) => !paidMonths.has(month)
        );
        return {
          ...user,
          outstandingMonths,
        };
      })
      .filter((user) => user.outstandingMonths.length > 0);

    // 4. Calculate total outstanding amount based on the count of outstanding months
    const totalOutstanding = outstandingUsers.reduce(
      (acc, user) => acc + user.outstandingMonths.length * monthlyDepositAmount,
      0
    );
    // --- END OF NEW LOGIC ---

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
      .where(eq(withdrawals.status, "approved"));
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

    const paymentPatternData = allVerifiedDeposits.map((d) => {
      const depositDate = d.createdAt;
      const monthDueDate = addDays(startOfMonth(d.createdAt), 10); // Assuming deposits are due on the 10th
      const daysDelayed = differenceInDays(depositDate, monthDueDate);

      return {
        userId: d.userId,
        month: d.month,
        status: "paid",
        daysDelayed: daysDelayed > 0 ? daysDelayed : undefined,
      };
    });

    return {
      totalBalance,
      myCurrentBalance,
      myDepositsThisMonth,
      monthlyCollectable,
      monthlyCollected,
      monthlyDepositAmount,
      recentDeposits,
      recentWithdrawals,
      monthlyCollectionChartData,
      outstandingUsers, // This is now a more detailed list
      totalOutstanding, // This is now a more accurate total
      paymentPatternData,
      allUsers,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { error: "Failed to fetch dashboard data" };
  }
}
