"use server"

import { db } from "@/lib/db"
import { depositSettings } from "@/db/schema"
import { isNull } from "drizzle-orm"

export async function getSystemSettings() {
  try {
    const settings = await db
      .select({ monthlyDepositAmount: depositSettings.monthlyAmount })
      .from(depositSettings)
      .where(isNull(depositSettings.terminatedAt))
      .limit(1)

    if (!settings.length) {
      return { error: "No active deposit settings found" }
    }


    return { monthlyDepositAmount: settings[0].monthlyDepositAmount }
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return { error: "Internal server error" }
  }
}