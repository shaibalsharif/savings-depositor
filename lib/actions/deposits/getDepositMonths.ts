// lib/actions/deposits/getDepositMonths.ts
"use server";

import { db } from "@/lib/db";
import { deposits, depositSettings } from "@/db/schema";
import { eq, and, gte, lte, isNull, inArray } from "drizzle-orm";
import { format, startOfMonth, subMonths, addMonths, parse } from "date-fns";

interface DepositMonth {
  month: string;
  status: "current" | "due" | "advance";
  monthlyAmount: number;
}

/**
 * Fetches months and their effective monthly deposit amounts for a user.
 * Only returns months that do not have a verified or pending deposit.
 */
export async function getDepositMonths(
  userId: string
): Promise<DepositMonth[] | { error: string }> {
  if (!userId) {
    return { error: "Missing userId" };
  }

  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    const settings = await db
      .select()
      .from(depositSettings)
      .where(isNull(depositSettings.terminatedAt));

    if (!settings.length) {
      return { error: "No active deposit settings found" };
    }

    const minEffectiveMonth = settings.reduce((min, curr) => {
      return curr.effectiveMonth < min ? curr.effectiveMonth : min;
    }, settings[0].effectiveMonth);
    const minEffectiveDate = parse(minEffectiveMonth, "yyyy-MM", new Date());

    const getEffectiveAmount = (monthStr: string) => {
      const monthDate = parse(monthStr, "yyyy-MM", new Date());
      const setting = settings.find((s) => {
        const effectiveMonthDate = parse(s.effectiveMonth, "yyyy-MM", new Date());
        return monthDate >= effectiveMonthDate;
      });
      return setting?.monthlyAmount || "0";
    };

    const getMonthString = (offset: number) =>
      format(addMonths(currentMonthStart, offset), "yyyy-MM");

    const rangeStartDate = subMonths(currentMonthStart, 6);
    const rangeEndDate = addMonths(currentMonthStart, 6);
    const rangeStart = format(rangeStartDate, "yyyy-MM");
    const rangeEnd = format(rangeEndDate, "yyyy-MM");

    const userDeposits = await db
      .select()
      .from(deposits)
      .where(
        and(
          eq(deposits.userId, userId),
          gte(deposits.month, rangeStart),
          lte(deposits.month, rangeEnd)
        )
      );

    const depositsByMonth = new Map<string, typeof userDeposits>();
    for (const deposit of userDeposits) {
      const month = deposit.month;
      if (!depositsByMonth.has(month)) {
        depositsByMonth.set(month, []);
      }
      depositsByMonth.get(month)!.push(deposit);
    }

    const results: DepositMonth[] = [];

    const hasActiveDeposit = (deps: typeof userDeposits) =>
      deps.some((d) => inArray(deposits.status, ["pending", "verified"]));

    for (let i = -6; i <= 6; i++) {
      const monthStr = getMonthString(i);
      const monthDate = parse(monthStr, "yyyy-MM", new Date());

      if (monthDate < minEffectiveDate) {
        continue;
      }

      const depositsForMonth = depositsByMonth.get(monthStr) || [];

      if (!hasActiveDeposit(depositsForMonth)) {
        const monthlyAmount = getEffectiveAmount(monthStr);

        let status: "current" | "due" | "advance";
        if (monthStr === format(currentMonthStart, "yyyy-MM")) {
          status = "current";
        } else if (monthDate < currentMonthStart) {
          status = "due";
        } else {
          status = "advance";
        }

        const monthResult: DepositMonth = {
          month: monthStr,
          status,
          monthlyAmount:parseInt(monthlyAmount),
        };

        results.push(monthResult);
      }
    }

    results.sort((a, b) => {
      const dateA = new Date(a.month + "-01");
      const dateB = new Date(b.month + "-01");
      return dateA.getTime() - dateB.getTime();
    });

    return results; // <-- Simplified return
  } catch (error) {
    console.error("Error fetching deposit months:", error);
    return { error: "Internal server error" };
  }
}