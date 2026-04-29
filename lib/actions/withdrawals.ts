"use server";

import { db } from "@/db/client";
import { withdrawals } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createWithdrawal(formData: FormData) {
  const user = await requireManager();
  
  const memberId = formData.get("memberId") as string;
  const amount = Number(formData.get("amount"));
  const purpose = formData.get("purpose") as string;
  const details = formData.get("details") as string;
  const status = formData.get("status") as string || "pending";
  const fundId = Number(formData.get("fundId") || 9); // default to Bank account if none provided

  if (!memberId || !amount || !purpose) {
    throw new Error("Missing required fields");
  }

  await db.insert(withdrawals).values({
    userId: memberId,
    amount: amount.toString(),
    fundId,
    purpose,
    details: details || "",
    status,
    reviewedBy: user.email || user.id,
    reviewedAt: new Date(),
    attachmentUrl: "",
    rejectionReason: "",
  });

  revalidatePath("/withdrawals");
  return { success: true };
}
