import { db } from "@/db/client";
import { depositSettings, depositAllocations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { parse, isAfter, format, addMonths, startOfMonth } from "date-fns";

export function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const start = parse(startMonth, "yyyy-MM", new Date());
  const end = parse(endMonth, "yyyy-MM", new Date());
  const months = [];
  let current = startOfMonth(start);
  const endDate = startOfMonth(end);
  
  while (!isAfter(current, endDate)) {
    months.push(format(current, "yyyy-MM"));
    current = addMonths(current, 1);
  }
  return months;
}

export async function allocatePayment(
  memberId: string,
  amountReceived: number,
  paymentDate: string // YYYY-MM-DD
): Promise<Array<{ forMonth: string; amountAllocated: number }>> {
  // 1. Fetch settings
  const settings = await db.select().from(depositSettings).orderBy(asc(depositSettings.effectiveMonth));
  if (settings.length === 0) return [];

  // Earliest start month
  const globalStartMonth = settings[0].effectiveMonth;
  const currentMonth = format(new Date(), "yyyy-MM"); 
  
  const allMonths = generateMonthRange(globalStartMonth, currentMonth);

  // 2. Fetch existing allocations for member
  const allocations = await db.select()
    .from(depositAllocations)
    .where(eq(depositAllocations.memberId, memberId));

  const paidByMonth = allocations.reduce((acc, alloc) => {
    acc[alloc.forMonth] = (acc[alloc.forMonth] || 0) + Number(alloc.amountAllocated);
    return acc;
  }, {} as Record<string, number>);

  // 3. Calculate expected per month based on settings
  const getExpectedAmountForMonth = (monthStr: string) => {
    let expected = 0;
    for (const setting of settings) {
      if (setting.effectiveMonth <= monthStr) {
        if (!setting.terminatedAt || setting.terminatedAt > monthStr) {
          expected = Number(setting.monthlyAmount);
        }
      }
    }
    return expected;
  };

  // 4. Build list of months where paid < expected
  const dueMonths = allMonths.map(month => {
    const expected = getExpectedAmountForMonth(month);
    const paid = paidByMonth[month] || 0;
    return {
      month,
      remaining: Math.max(0, expected - paid)
    };
  }).filter(m => m.remaining > 0);

  // 5. FIFO fill
  let remainingCash = Number(amountReceived);
  const result: Array<{ forMonth: string; amountAllocated: number }> = [];

  for (const due of dueMonths) {
    if (remainingCash <= 0) break;
    
    const allocation = Math.min(due.remaining, remainingCash);
    result.push({
      forMonth: due.month,
      amountAllocated: allocation
    });
    remainingCash -= allocation;
  }

  // Overpayment handling: allocate to future months
  if (remainingCash > 0) {
    let nextMonth = format(addMonths(parse(currentMonth, "yyyy-MM", new Date()), 1), "yyyy-MM");
    
    while (remainingCash > 0) {
      const expected = getExpectedAmountForMonth(nextMonth) || Number(settings[settings.length - 1].monthlyAmount);
      const paid = paidByMonth[nextMonth] || 0;
      const remaining = Math.max(0, expected - paid);
      
      const actualAlloc = Math.min(remainingCash, expected);
      
      result.push({
        forMonth: nextMonth,
        amountAllocated: actualAlloc
      });
      remainingCash -= actualAlloc;
      nextMonth = format(addMonths(parse(nextMonth, "yyyy-MM", new Date()), 1), "yyyy-MM");
    }
  }

  return result;
}
