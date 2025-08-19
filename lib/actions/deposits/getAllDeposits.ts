// lib/actions/deposits/getAllDeposits.ts
"use server";

import { db } from "@/lib/db";
import { deposits, personalInfo, users } from "@/db/schema";
import { eq, and, desc, gte, lte, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { AllDeposit } from "@/types";
import { endOfDay, startOfMonth, endOfMonth } from "date-fns";

const filterSchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  month: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(), // <-- Added for sorting
  sortOrder: z.enum(["asc", "desc"]).optional(), // <-- Added for sorting
});

export async function getAllDeposits(
  filters: z.infer<typeof filterSchema>
): Promise<AllDeposit[] | { error: string }> {
  const parsedFilters = filterSchema.safeParse(filters);
  if (!parsedFilters.success) {
    console.error("Invalid filters:", parsedFilters.error);
    return { error: "Invalid filter parameters" };
  }

  try {
    const conditions = [];
    const { userId, status, month, startDate, endDate, sortBy, sortOrder } = parsedFilters.data;

    if (userId) {
      conditions.push(eq(deposits.userId, userId));
    }
    if (status && status !== "all") {
      conditions.push(eq(deposits.status, status as any));
    }
    if (month && month !== "all") {
      try {
        const [yearStr, monthStr] = month.split("-");
        const dateInMonth = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        const startOfM = startOfMonth(dateInMonth);
        const endOfM = endOfDay(endOfMonth(dateInMonth));
        conditions.push(gte(deposits.createdAt, startOfM));
        conditions.push(lte(deposits.createdAt, endOfM));
      } catch (e) {
        console.error("Invalid month format:", e);
      }
    }
    if (startDate) {
      conditions.push(gte(deposits.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(deposits.createdAt, endOfDay(new Date(endDate))));
    }
    
    // Dynamic sorting based on sortBy and sortOrder
    let orderByClause;
    const order = sortOrder === "asc" ? asc : desc;
    if (sortBy === "month") {
      orderByClause = order(deposits.month);
    } else {
      // Default sort is by createdAt descending
      orderByClause = order(deposits.createdAt);
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
        userId: deposits.userId,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          picture: users.picture,
          mobile: personalInfo.mobile,
        },
      })
      .from(deposits)
      .leftJoin(users, eq(deposits.userId, users.id))
      .leftJoin(personalInfo, eq(deposits.userId, personalInfo.userId))
      .where(and(...conditions))
      .orderBy(orderByClause);

    const typedDeposits = allDeposits.map((deposit) => ({
      id: deposit.id,
      month: deposit.month,
      amount: Number(deposit.amount),
      transactionId: deposit.transactionId,
      createdAt: deposit.createdAt,
      status: deposit.status as "pending" | "verified" | "rejected",
      depositType: deposit.depositType as "full" | "partial",
      imageUrl: deposit.imageUrl,
      userId: deposit.userId,
      user: {
        id: deposit.user?.id || 'N/A',
        name: deposit.user?.name || null,
        email: deposit.user?.email || 'N/A',
        picture: deposit.user?.picture || null,
        mobile: deposit.user?.mobile || null,
      },
    }));

    return typedDeposits;
  } catch (error) {
    console.error("Error fetching all deposits:", error);
    return { error: "Internal server error" };
  }
}