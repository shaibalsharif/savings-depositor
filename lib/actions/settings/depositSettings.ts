// lib/actions/settings/depositSettings.ts
"use server";

import { db } from "@/lib/db";
import { deposits, depositSettings, logs } from "@/db/schema";
import { eq, and, isNull, lt, desc } from "drizzle-orm";
import { format, startOfMonth, addMonths } from "date-fns";
import { z } from "zod";

const depositSettingSchema = z.object({
  monthlyAmount: z.string(),
  dueDay: z.string(),
  reminderDay: z.string(),
  effectiveMonth: z.string(),
});

interface DepositSetting {
  id?: number;
  monthlyAmount: string;
  dueDay: string;
  reminderDay: string;
  effectiveMonth: string;
  terminatedAt: string | null;
  createdBy: string;
  createdAt: Date;
}

// ... (getDepositSettings and other functions remain the same)


/**
 * Saves a new or updates an existing deposit setting.
 * @param data The deposit setting data to save.
 * @param createdBy The user ID of the person creating the setting.
 * @returns The new setting object or an error.
 */
export async function saveDepositSettings(
  data: z.infer<typeof depositSettingSchema>,
  createdBy: string
): Promise<{ setting: DepositSetting } | { error: string }> {
  const parsed = depositSettingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  const { monthlyAmount, dueDay, reminderDay, effectiveMonth } = parsed.data;

  try {
    // 1. Find the current latest setting (the one with terminatedAt = null)
    const [latestSetting] = await db
      .select()
      .from(depositSettings)
      .where(isNull(depositSettings.terminatedAt))
      .orderBy(desc(depositSettings.effectiveMonth))
      .limit(1);

    // 2. Validate the new effectiveMonth: it must be after the latest setting's effectiveMonth
    if (latestSetting && effectiveMonth <= latestSetting.effectiveMonth) {
      return {
        error: "Effective month must be after the last active setting's effective month.",
      };
    }

    // 3. Update the latest setting's terminatedAt field
    if (latestSetting) {
      await db
        .update(depositSettings)
        .set({ terminatedAt: effectiveMonth })
        .where(eq(depositSettings.id, latestSetting.id));
    }

    // 4. Insert the new setting with terminatedAt = null
    const [newSetting] = await db
      .insert(depositSettings)
      .values({
        monthlyAmount,
        dueDay,
        reminderDay,
        effectiveMonth,
        terminatedAt: null, // The new setting is the latest, so it is not terminated
        createdBy: createdBy,
      })
      .returning();

    // // 5. Log the action
    // await db.insert(logs).values({
    //   userId: createdBy,
    //   action: "create_deposit_setting",
    //   details: JSON.stringify({ ...parsed.data }),
    // });

    return { setting: newSetting };
  } catch (error) {
    console.error("Error saving deposit settings:", error);
    return { error: "Failed to save settings" };
  }
}
export async function getDepositSettings(): Promise<
  | { currentSetting: DepositSetting | null; upcomingSettings: DepositSetting[] }
  | { error: string }
> {
  try {
    const today = new Date();
    const currentMonth = format(startOfMonth(today), "yyyy-MM");

    const allSettings = await db
      .select()
      .from(depositSettings)
      .orderBy(depositSettings.effectiveMonth);

    let currentSetting =
      allSettings.find((s) => s.effectiveMonth <= currentMonth) || null;
    const upcomingSettings = allSettings.filter(
      (s) => s.effectiveMonth > currentMonth
    );


    return { currentSetting, upcomingSettings };
  } catch (error) {
    console.error("Error fetching deposit settings:", error);
    return { error: "Failed to fetch deposit settings" };
  }
}

/**
 * Saves a new or updates an existing deposit setting.
 * @param data The deposit setting data to save.
 * @param createdBy The user ID of the person creating the setting.
 * @returns The new setting object or an error.
 */


/**
 * Deletes an upcoming deposit setting.
 * @param id The ID of the setting to delete.
 * @returns A success message or an error.
 */
export async function deleteUpcomingSetting(
  id: number
): Promise<{ success: true } | { error: string }> {
  try {
    const [settingToDelete] = await db
      .select()
      .from(depositSettings)
      .where(eq(depositSettings.id, id));

    if (!settingToDelete) {
      return { error: "Setting not found" };
    }

    await db.delete(depositSettings).where(eq(depositSettings.id, id));

    const [previousSetting] = await db
      .select()
      .from(depositSettings)
      .where(eq(depositSettings.terminatedAt, settingToDelete.effectiveMonth));

    if (previousSetting) {
      await db
        .update(depositSettings)
        .set({ terminatedAt: null })
        .where(eq(depositSettings.id, previousSetting.id));
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting deposit setting:", error);
    return { error: "Failed to delete setting" };
  }
}