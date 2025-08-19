// lib/actions/funds.ts
"use server";

import { db } from "@/lib/db";
import { funds, fundTransactions, logs, users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { z } from "zod";

const fundSchema = z.object({
  title: z.string().min(1, "Fund title is required."),
});

const transferSchema = z.object({
  fromFundId: z.number(),
  toFundId: z.number(),
  amount: z.number().positive("Amount must be a positive number."),
  description: z.string().optional(),
});

interface Fund {
  id: number;
  title: string;
  balance: string;
  currency: string;
  createdBy: string;
  createdAt: Date;
  deleted: boolean;
}

interface FundTransaction {
  id: number;
  fromFundId: number | null;
  toFundId: number | null;
  amount: string;
  createdBy: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    picture: string | null;
  };
  createdAt: Date;
  description: string | null;
}

/**
 * Fetches all non-deleted funds.
 */
export async function getFunds(): Promise<Fund[] | { error: string }> {
  try {
    const data = await db.select().from(funds).where(eq(funds.deleted, false));
    return data as Fund[];
  } catch (error) {
    console.error("Error fetching funds:", error);
    return { error: "Failed to fetch funds" };
  }
}

/**
 * Fetches all fund transactions with user details.
 */
export async function getFundTransactions(): Promise<FundTransaction[] | { error: string }> {
  try {
    const data = await db
      .select({
        id: fundTransactions.id,
        fromFundId: fundTransactions.fromFundId,
        toFundId: fundTransactions.toFundId,
        amount: fundTransactions.amount,
        createdBy: fundTransactions.createdBy,
        createdAt: fundTransactions.createdAt,
        description: fundTransactions.description,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          picture: users.picture,
        },
      })
      .from(fundTransactions)
      .leftJoin(users, eq(fundTransactions.createdBy, users.id)) // FIX: Joined users table
      .orderBy(desc(fundTransactions.createdAt));

    return data as FundTransaction[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { error: "Failed to fetch fund transactions" };
  }
}

/**
 * Adds a new fund.
 */
export async function addFund(data: z.infer<typeof fundSchema>, userId: string): Promise<{ fund: Fund } | { error: string }> {
  const parsed = fundSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid fund title" };
  }
  
  try {
    const [newFund] = await db
      .insert(funds)
      .values({
        title: parsed.data.title,
        createdBy: userId,
        balance: "0.00",
        currency: "BDT",
        deleted: false,
      })
      .returning();

    // await db.insert(logs).values({
    //   userId: userId,
    //   action: "create_fund",
    //   details: JSON.stringify({ fundId: newFund.id, title: newFund.title }),
    // });

    return { fund: newFund };
  } catch (error) {
    console.error("Error adding fund:", error);
    return { error: "Failed to create fund" };
  }
}

/**
 * Deletes a fund if its balance is zero.
 */
export async function deleteFund(fundId: number, userId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const [fund] = await db.select().from(funds).where(eq(funds.id, fundId));

    if (!fund) {
      return { error: "Fund not found" };
    }
    if (Number(fund.balance) !== 0) {
      return { error: "Balance must be 0 to delete" };
    }

    await db.update(funds).set({ deleted: true }).where(eq(funds.id, fundId));
    
    // await db.insert(logs).values({
    //   userId: userId,
    //   action: "remove_fund",
    //   details: JSON.stringify({ fundId: fund.id }),
    // });

    return { success: true };
  } catch (error) {
    console.error("Error deleting fund:", error);
    return { error: "Failed to delete fund" };
  }
}

/**
 * Transfers funds between two accounts.
 */
export async function transferFunds(data: z.infer<typeof transferSchema>, userId: string): Promise<{ success: boolean } | { error: string }> {
  const parsed = transferSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid transfer data" };
  }

  const { fromFundId, toFundId, amount, description } = parsed.data;

  if (fromFundId === toFundId) {
    return { error: "Source and destination funds must be different" };
  }

  try {
    await db.transaction(async (trx) => {
      const [fromFund] = await trx.select().from(funds).where(eq(funds.id, fromFundId)).for("update");
      const [toFund] = await trx.select().from(funds).where(eq(funds.id, toFundId)).for("update");

      if (!fromFund || !toFund) {
        throw new Error("One or both fund IDs are invalid.");
      }

      const fromBalance = Number(fromFund.balance);
      const transferAmount = Number(amount);

      if (fromBalance < transferAmount) {
        throw new Error("Insufficient funds in the source fund.");
      }

      await trx.update(funds).set({ balance: sql`${funds.balance} - ${transferAmount}` }).where(eq(funds.id, fromFundId));
      await trx.update(funds).set({ balance: sql`cast(${funds.balance} as double precision) + ${transferAmount}` as any }).where(eq(funds.id, toFundId));

      await trx.insert(fundTransactions).values({
        fromFundId,
        toFundId,
        amount: transferAmount.toString(),
        createdBy: userId,
        description,
      });

      // await trx.insert(logs).values({
      //   userId: userId,
      //   action: "fund_transfer",
      //   details: JSON.stringify({ fromFundId, toFundId, amount, description }),
      // });
    });

    return { success: true };
  } catch (error: any) {

    console.error("Fund transfer error:", error);
    return { error: error.message || "Fund transfer failed." };
  }
}