"use server";

import { db } from "@/db/client";
import { depositSettings, logs } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createDepositSetting(monthlyAmount: number, effectiveMonth: string) {
  const user = await requireManager();
  
  await db.transaction(async (tx) => {
    await tx.insert(depositSettings).values({
      effectiveMonth,
      monthlyAmount: monthlyAmount.toString(),
      dueDay: "10",       // default due day
      reminderDay: "5",   // default reminder day
      createdBy: user.id,
      updatedBy: user.id,
    });

    await tx.insert(logs).values({
      userId: user.id,
      action: "CREATE_SETTING",
      details: JSON.stringify({ effectiveMonth, monthlyAmount })
    });
  });

  revalidatePath("/settings/deposits");
  return { success: true };
}
