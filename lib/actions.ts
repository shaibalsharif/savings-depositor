import { NextRequest } from "next/server";
import { db } from "./db";
import { withdrawals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const withdrawalSchema = z.object({
  userId: z.string().min(1),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0, { message: "Amount must be positive" }),
  purpose: z.string().min(1),
  details: z.string().optional(),
});

//✅ Fetch all withdrawals
export const getAllWithdrawals = async () => {
  const results = await db
    .select()
    .from(withdrawals)
    .orderBy(withdrawals.createdAt);
  return results.map((w) => ({
    ...w,
    requestedBy: w.userId, // You can replace with user name if you have join logic
  }));
};

// ✅ Create a new withdrawal (called via server form)
export async function createWithdrawal(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const raw = {
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    purpose: formData.get("purpose"),
    details: formData.get("details"),
  };

  const parsed = withdrawalSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid form submission" };
  }

  const { userId, amount, purpose, details } = parsed.data;

  await db.insert(withdrawals).values({
    userId,
    amount: amount.toString(),
    purpose,
    details,
  });

  return { success: true };
}

// ✅ Fetch pending withdrawals
export const getPendingWithdrawals = async () => {
  const results = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.status, "pending"))
    .orderBy(withdrawals.createdAt);
  return results.map((w) => ({
    ...w,
    requestedBy: w.userId,
  }));
};
