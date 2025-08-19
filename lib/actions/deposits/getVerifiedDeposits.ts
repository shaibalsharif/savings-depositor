"use server";

import { db } from "@/lib/db";
import { deposits, users } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";



interface VerifiedDeposit {
  id: number;
  userId: string;
  month: string;
  amount: number;
  transactionId: string | null;
  depositType: "full" | "partial";
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    picture: string | null;
  };
}

/**
 * Fetches verified deposits for a specific month and a list of all months with verified deposits.
 *
 * @param month The month (e.g., "2024-05") to fetch deposits for.
 * @returns An object containing deposits and a list of months with verified deposits.
 */
export async function getVerifiedDeposits(
  month: string
): Promise<{ deposits: VerifiedDeposit[]; availableMonths: string[] } | { error: string }> {
  try {
    const depositsForMonth = await db
      .select({
        id: deposits.id,
        userId: deposits.userId,
        month: deposits.month,
        amount: deposits.amount,
        transactionId: deposits.transactionId,
        depositType: deposits.depositType,
        imageUrl: deposits.imageUrl,
        createdAt: deposits.createdAt,
        updatedAt: deposits.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          picture: users.picture,
        },
      })
      .from(deposits)
      .where(and(eq(deposits.status, "verified"), eq(deposits.month, month)))
      .leftJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt));

    // Get a list of all unique months with verified deposits
    const allMonthsResult = await db
      .select({ month: deposits.month })
      .from(deposits)
      .where(eq(deposits.status, "verified"))
      .groupBy(deposits.month)
      .orderBy(sql`${deposits.month} DESC`);

    const availableMonths = allMonthsResult.map((m) => m.month);

    return {
      deposits: depositsForMonth.map((deposit) => ({
        ...deposit,
        amount: Number(deposit.amount),
        depositType: deposit.depositType as "full" | "partial",
        user: {
          id: deposit.user?.id || 'N/A', 
          name: deposit.user?.name || "N/A",
          email: deposit.user?.email || "N/A",
          picture: deposit.user?.picture || null,
        },
      })),
      availableMonths,
    };
  } catch (error) {
    console.error("Error fetching verified deposits:", error);
    return { error: "Failed to fetch deposits" };
  }
}