"use server";

import { db } from "@/lib/db";
import { deposits } from "@/db/schema";
import { eq, and, desc, gte, lte, asc } from "drizzle-orm";
import { z } from "zod";
import { parseISO, } from "date-fns";
import { Deposit } from "@/types";

// Define a Zod schema for input validation
const filterSchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  sortBy: z.string().optional(), // <-- New sorting parameter
  sortOrder: z.enum(["asc", "desc"]).optional(), // <-- New sorting parameter
});

export async function getMyDeposits(
  userId: string,
  filters: z.infer<typeof filterSchema>
): Promise<Deposit[] | { error: string }> {
  const parsedFilters = filterSchema.safeParse(filters);
  if (!parsedFilters.success) {
    console.error("Invalid filters:", parsedFilters.error);
    return { error: "Invalid filter parameters" };
  }

  try {
    const conditions = [eq(deposits.userId, userId)];
    const { status, startDate, endDate, sortBy, sortOrder } = parsedFilters.data;

    if (status && status !== "all") {
      conditions.push(eq(deposits.status, status));
    }
    if (startDate) {
      conditions.push(gte(deposits.createdAt, parseISO(startDate)));
    }
    if (endDate) {
      conditions.push(lte(deposits.createdAt, endOfDay(parseISO(endDate))));
    }

    // Dynamic sorting
    let orderByClause;
    const order = sortOrder === "desc" ? desc : asc;
    if (sortBy === "createdAt") {
      orderByClause = order(deposits.createdAt);
    } else if (sortBy === "month") {
      orderByClause = order(deposits.month);
    } else {
      orderByClause = desc(deposits.createdAt); // Default sort
    }

    const allDeposits = await db
      .select({
        id: deposits.id,
        month: deposits.month,
        amount: deposits.amount,
        transactionId: deposits.transactionId,
        createdAt: deposits.createdAt,
        status: deposits.status,
        depositType: deposits.depositType,
        imageUrl: deposits.imageUrl,
        updatedBalance: deposits.updatedBalance,
        userId: deposits.userId,
        fundId: deposits.fundId,
        updatedAt: deposits.updatedAt,
      })
      .from(deposits)
      .where(and(...conditions))
      .orderBy(orderByClause);

    const typedDeposits: Deposit[] = allDeposits.map((deposit) => {
      return {
        id: deposit.id,
        month: deposit.month,
        amount: Number(deposit.amount),
        transactionId: deposit.transactionId,
        createdAt: deposit.createdAt.toISOString(),
        status: deposit.status as "pending" | "verified" | "rejected",
        depositType: deposit.depositType as "full" | "partial",
        imageUrl: deposit.imageUrl,
        updatedBalance:
          deposit.updatedBalance !== null ? Number(deposit.updatedBalance) : 0,
        userId: deposit.userId,
        fundId: deposit.fundId || null,
        updatedAt: deposit.updatedAt ? deposit.updatedAt.toISOString() : "", // <-- FIX: Provide default value
      };
    });

    return typedDeposits;
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return { error: "Internal server error" };
  }
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}