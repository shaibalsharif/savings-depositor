import { db } from "@/db/client";
import {
  payments,
  depositAllocations,
  expenses,
  investments,
  revenueLosses,
  depositSettings,
  personalInfo,
} from "@/db/schema";
import { format, subMonths, startOfMonth } from "date-fns";
import { eq, desc } from "drizzle-orm";

// Generate YYYY-MM range from start to end inclusive
export function generateMonthRange(from: string, to: string): string[] {
  const months: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

// Get effective monthly amount for a given month string
function getExpectedForMonth(
  settings: { effectiveMonth: string; terminatedAt: string | null; monthlyAmount: string }[],
  monthStr: string
): number {
  let expected = 0;
  for (let i = settings.length - 1; i >= 0; i--) {
    const s = settings[i];
    if (s.effectiveMonth <= monthStr) {
      if (!s.terminatedAt || s.terminatedAt > monthStr) {
        expected = Number(s.monthlyAmount);
        break;
      }
    }
  }
  return expected;
}

// ─── Manager Dashboard Stats ─────────────────────────────────────────────────
export async function getManagerDashboardStats() {
  const [
    allPayments,
    allAllocations,
    allExpenses,
    allInvestments,
    allRevenue,
    allSettings,
    allMembers,
  ] = await Promise.all([
    db.select().from(payments),
    db.select().from(depositAllocations),
    db.select().from(expenses),
    db.select().from(investments),
    db.select().from(revenueLosses),
    db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth)),
    db.select().from(personalInfo),
  ]);

  const validPayments = allPayments.filter((p) => !p.voided);
  const totalCollected = validPayments.reduce((s, p) => s + Number(p.amountReceived), 0);

  const validExpenses = allExpenses.filter((e) => !e.voided);
  const totalExpenses = validExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const activeInvestments = allInvestments.filter((i) => i.status === "active");
  const totalInvested = activeInvestments.reduce((s, i) => s + Number(i.principal), 0);

  const validRevenue = allRevenue.filter((r) => !r.voided);

  // amount is always positive; sourceType drives direction:
  // profit / bank_profit / other / principal_return → add to balance
  // loss → subtract from balance
  const totalIncome = validRevenue
    .filter((r) => r.sourceType !== "loss")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalLoss = validRevenue
    .filter((r) => r.sourceType === "loss")
    .reduce((s, r) => s + Number(r.amount), 0);
  const netRevenue = totalIncome - totalLoss;

  // Available liquid balance:
  // Collected − Expenses − Active Invested + Net Revenue (profit − loss + principal returns)
  const balance = totalCollected - totalExpenses - totalInvested + netRevenue;

  // Settings map
  const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
  const globalStart = settingsSorted.length > 0 ? settingsSorted[0].effectiveMonth : "2024-01";
  const currentMonth = format(new Date(), "yyyy-MM");
  const allMonths = generateMonthRange(globalStart, currentMonth);

  // Per-member outstanding
  const memberPendings = allMembers.map((member) => {
    const memAllocs = allAllocations.filter((a) => a.memberId === member.userId);
    const paidByMonth = memAllocs.reduce((acc, a) => {
      acc[a.forMonth] = (acc[a.forMonth] || 0) + Number(a.amountAllocated);
      return acc;
    }, {} as Record<string, number>);
    let due = 0;
    for (const m of allMonths) {
      const exp = getExpectedForMonth(settingsSorted, m);
      due += Math.max(0, exp - (paidByMonth[m] || 0));
    }
    return { memberId: member.userId, name: member.name, due };
  }).filter((m) => m.due > 0).sort((a, b) => b.due - a.due);

  // Total outstanding across all members
  const totalOutstanding = memberPendings.reduce((s, m) => s + m.due, 0);

  // Current month collection
  const currentExpected = getExpectedForMonth(settingsSorted, currentMonth) * allMembers.length;
  const currentAllocated = allAllocations.filter((a) => a.forMonth === currentMonth).reduce((s, a) => s + Number(a.amountAllocated), 0);

  // Next return date for active investments
  const nextReturn = activeInvestments
    .sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate))[0]?.expectedReturnDate ?? null;

  // ── Monthly collection chart data (last 12 months) ─────────────────────────
  const last12 = Array.from({ length: 12 }, (_, i) =>
    format(subMonths(new Date(), 11 - i), "yyyy-MM")
  );

  const monthlyChart = last12.map((month) => {
    const collected = allAllocations
      .filter((a) => a.forMonth === month)
      .reduce((s, a) => s + Number(a.amountAllocated), 0);
    const expected = getExpectedForMonth(settingsSorted, month) * allMembers.length;
    const expenseTotal = validExpenses
      .filter((e) => e.expenseDate.startsWith(month))
      .reduce((s, e) => s + Number(e.amount), 0);
    return {
      month: format(new Date(month + "-01"), "MMM yy"),
      collected,
      expected,
      expenses: expenseTotal,
    };
  });

  // ── Member payment heatmap data (last 12 months × all members) ──────────────
  const heatmapData = allMembers.map((member) => {
    const memAllocs = allAllocations.filter((a) => a.memberId === member.userId);
    const paidByMonth = memAllocs.reduce((acc, a) => {
      acc[a.forMonth] = (acc[a.forMonth] || 0) + Number(a.amountAllocated);
      return acc;
    }, {} as Record<string, number>);
    const months = last12.map((m) => {
      const exp = getExpectedForMonth(settingsSorted, m);
      const paid = paidByMonth[m] || 0;
      const pct = exp > 0 ? Math.min(paid / exp, 1) : 0;
      return { month: m, paid, expected: exp, pct };
    });
    return { memberId: member.userId, name: member.name, months };
  });

  return {
    totalCollected,
    totalOutstanding,
    totalExpenses,
    totalInvested,
    totalIncome,
    totalLoss,
    netRevenue,
    balance,
    membersCount: allMembers.length,
    membersWithDues: memberPendings.length,
    activeInvestmentsCount: activeInvestments.length,
    nextReturn,
    currentMonthExpected: currentExpected,
    currentMonthAllocated: currentAllocated,
    memberPendings,
    monthlyChart,
    heatmapData,
  };
}

// ─── Member Dashboard Stats ───────────────────────────────────────────────────
export async function getMemberDashboardStats(memberId: string) {
  const [allAllocations, allSettings, myPayments] = await Promise.all([
    db.select().from(depositAllocations).where(eq(depositAllocations.memberId, memberId)),
    db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth)),
    db.select().from(payments)
      .where(eq(payments.memberId, memberId))
      .orderBy(desc(payments.paymentDate))
      .limit(10),
  ]);

  const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
  const globalStart = settingsSorted.length > 0 ? settingsSorted[0].effectiveMonth : "2024-01";
  const currentMonth = format(new Date(), "yyyy-MM");
  const allMonths = generateMonthRange(globalStart, currentMonth);

  const paidByMonth = allAllocations.reduce((acc, a) => {
    acc[a.forMonth] = (acc[a.forMonth] || 0) + Number(a.amountAllocated);
    return acc;
  }, {} as Record<string, number>);

  let totalExpected = 0;
  let totalPaid = 0;
  const monthBreakdown = allMonths.map((m) => {
    const exp = getExpectedForMonth(settingsSorted, m);
    const paid = paidByMonth[m] || 0;
    totalExpected += exp;
    totalPaid += Math.min(paid, exp);
    return { month: m, expected: exp, paid, due: Math.max(0, exp - paid) };
  });

  const totalDue = Math.max(0, totalExpected - totalPaid);

  const currentExp = getExpectedForMonth(settingsSorted, currentMonth);
  const currentPaid = paidByMonth[currentMonth] || 0;

  // Last 12 months chart for member
  const last12 = Array.from({ length: 12 }, (_, i) =>
    format(subMonths(new Date(), 11 - i), "yyyy-MM")
  );
  const memberChart = last12.map((m) => ({
    month: format(new Date(m + "-01"), "MMM yy"),
    paid: paidByMonth[m] || 0,
    expected: getExpectedForMonth(settingsSorted, m),
  }));

  return {
    totalPaid,
    totalDue,
    totalExpected,
    currentMonth: {
      month: currentMonth,
      expected: currentExp,
      paid: currentPaid,
      due: Math.max(0, currentExp - currentPaid),
    },
    recentPayments: myPayments,
    monthBreakdown,
    memberChart,
  };
}
