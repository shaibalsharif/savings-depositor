// actions/deposits.ts
"use server";

import { db } from "@/lib/db";
import { deposits } from "@/db/schema";

interface DepositPayload {
  userId: string;
  month: string;
  amount: number;
  transactionId?: string;
  depositType: "full" | "partial";
  imageUrl?: string;
}

export async function submitDeposit(payload: DepositPayload) {
  try {
    // 1. Create a new deposit entry
    await db.insert(deposits).values({
      userId: payload.userId,
      month: payload.month,
      amount: payload.amount.toString(),
      transactionId: payload.transactionId || null,
      imageUrl: payload.imageUrl || null,
      status: "pending",
    });

    // 2. Log the action (as you had in your API route)
    // You would create a similar Server Action for logging
    // For now, let's just log to the console


    return { success: true };
  } catch (error) {
    console.error("Error submitting deposit:", error);
    return { error: "Internal server error" };
  }
}
