"use server";

import { db } from "@/db/client";
import { depositAllocations, depositSettings, personalInfo } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format, subMonths } from "date-fns";
import { requireManager } from "@/lib/auth";
import { generateMonthRange } from "@/lib/allocation";

export type OutstandingMonth = {
  month: string;       // YYYY-MM
  expected: number;
  paid: number;
  remaining: number;
};

export async function getMemberOutstandingMonths(memberId: string): Promise<OutstandingMonth[]> {
  await requireManager();

  // Load member details to get their depositStartDate
  const member = await db.query.personalInfo.findFirst({
    where: eq(personalInfo.userId, memberId),
  });

  const settings = await db
    .select()
    .from(depositSettings)
    .orderBy(desc(depositSettings.effectiveMonth));

  if (settings.length === 0) return [];

  const sorted = [...settings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
  const globalStart = sorted[0].effectiveMonth;
  const memberStart = member?.depositStartDate || globalStart;
  const startMonth = memberStart > globalStart ? memberStart : globalStart;

  const currentMonth = format(new Date(), "yyyy-MM");
  const allMonths = generateMonthRange(startMonth, currentMonth);

  const allAllocs = await db
    .select()
    .from(depositAllocations)
    .where(eq(depositAllocations.memberId, memberId));

  const paidByMonth: Record<string, number> = {};
  for (const a of allAllocs) {
    paidByMonth[a.forMonth] = (paidByMonth[a.forMonth] || 0) + Number(a.amountAllocated);
  }

  function getExpected(monthStr: string): number {
    let exp = 0;
    for (const s of sorted) {
      if (s.effectiveMonth <= monthStr) {
        if (!s.terminatedAt || s.terminatedAt > monthStr) {
          exp = Number(s.monthlyAmount);
        }
      }
    }
    return exp;
  }

  const result: OutstandingMonth[] = [];
  for (const m of allMonths) {
    const expected = getExpected(m);
    const paid = paidByMonth[m] || 0;
    const remaining = Math.max(0, expected - paid);
    // Include all months — both outstanding and current (even if paid partially)
    result.push({ month: m, expected, paid, remaining });
  }

  return result;
}
