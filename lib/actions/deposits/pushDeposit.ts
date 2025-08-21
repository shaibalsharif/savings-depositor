// actions/deposits.ts
"use server";

import { db } from "@/lib/db";
import { deposits } from "@/db/schema";
import { sendDepositSubmittedNotification } from "../notifications/depositNotifications";

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
    const [newDeposit] = await db
      .insert(deposits)
      .values({
        userId: payload.userId,
        month: payload.month,
        amount: payload.amount.toString(),
        transactionId: payload.transactionId || null,
        imageUrl: payload.imageUrl || null,
        status: "pending",
      })
      .returning({ id: deposits.id });

    await sendDepositSubmittedNotification(
      newDeposit.id.toString(),
      payload.userId,
      payload.amount,
      payload.month
    );

    return { success: true };
  } catch (error) {
    console.error("Error submitting deposit:", error);
    return { error: "Internal server error" };
  }
}
