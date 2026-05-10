import { db } from "@/db/client";
import {
  payments,
  depositAllocations,
  expenses,
  investments,
  revenueLosses,
  depositSettings,
  personalInfo,
  investmentShares,
} from "@/db/schema";
import { format, subMonths, startOfMonth } from "date-fns";
import { eq, desc, sql, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";

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
export const getManagerDashboardStats = unstable_cache(
  async () => {
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

    const validExpenses = allExpenses.filter((e) => !e.voided && !e.deleted);
    const totalExpenses = validExpenses.reduce((s, e) => s + Number(e.amount), 0);

    const activeInvestments = allInvestments.filter((i) => i.status === "active" && !i.deleted);
    const totalInvested = activeInvestments.reduce((s, i) => s + Number(i.principal), 0);

    const validRevenue = allRevenue.filter((r) => !r.voided && !r.deleted);

    const totalIncome = validRevenue
      .filter((r) => r.sourceType !== "loss")
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalLoss = validRevenue
      .filter((r) => r.sourceType === "loss")
      .reduce((s, r) => s + Number(r.amount), 0);
    const netRevenue = totalIncome - totalLoss;

    const balance = totalCollected - totalExpenses - totalInvested + netRevenue;

    const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
    const globalStart = settingsSorted.length > 0 ? settingsSorted[0].effectiveMonth : "2024-01";
    const currentMonth = format(new Date(), "yyyy-MM");
    const allMonths = generateMonthRange(globalStart, currentMonth);

    const memberPendings = allMembers.map((member) => {
      const memAllocs = allAllocations.filter((a) => a.memberId === member.userId);
      const paidByMonth = memAllocs.reduce((acc, a) => {
        acc[a.forMonth] = (acc[a.forMonth] || 0) + Number(a.amountAllocated);
        return acc;
      }, {} as Record<string, number>);
      let due = 0;
      const breakdown: { month: string; expected: number; paid: number; due: number }[] = [];
      for (const m of allMonths) {
        if (m < member.depositStartDate) continue;
        const exp = getExpectedForMonth(settingsSorted, m);
        const paid = paidByMonth[m] || 0;
        const mDue = Math.max(0, exp - paid);
        due += mDue;
        if (mDue > 0) {
          breakdown.push({ month: m, expected: exp, paid, due: mDue });
        }
      }
      return { memberId: member.userId, name: member.name, photo: member.photo, due, breakdown };
    }).filter((m) => m.due > 0).sort((a, b) => b.due - a.due);

    const totalOutstanding = memberPendings.reduce((s, m) => s + m.due, 0);

    const currentMonthActiveMembers = allMembers.filter(m => m.depositStartDate <= currentMonth);
    const currentExpected = getExpectedForMonth(settingsSorted, currentMonth) * currentMonthActiveMembers.length;
    const currentAllocated = allAllocations.filter((a) => a.forMonth === currentMonth).reduce((s, a) => s + Number(a.amountAllocated), 0);

    const nextReturn = activeInvestments
      .sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate))[0]?.expectedReturnDate ?? null;

    const last12 = Array.from({ length: 12 }, (_, i) =>
      format(subMonths(new Date(), 11 - i), "yyyy-MM")
    );

    const monthlyChart = last12.map((month) => {
      const collected = allAllocations
        .filter((a) => a.forMonth === month)
        .reduce((s, a) => s + Number(a.amountAllocated), 0);
      const activeInMonth = allMembers.filter(m => m.depositStartDate <= month).length;
      const expected = getExpectedForMonth(settingsSorted, month) * activeInMonth;
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

    const currentYearNum = new Date().getFullYear();
    const monthsInYear = Array.from({ length: 12 }, (_, i) =>
      `${currentYearNum}-${String(i + 1).padStart(2, "0")}`
    );

    const paymentDateByPaymentId = Object.fromEntries(
      allPayments.map((p) => [p.paymentId, p.paymentDate])
    );

    const heatmapData = allMembers.map((member) => {
      const memAllocs = allAllocations.filter((a) => a.memberId === member.userId);
      const byMonth: Record<string, { paid: number; lastDate: string | null }> = {};
      for (const a of memAllocs) {
        const date = paymentDateByPaymentId[a.paymentId] ?? null;
        if (!byMonth[a.forMonth]) byMonth[a.forMonth] = { paid: 0, lastDate: null };
        byMonth[a.forMonth].paid += Number(a.amountAllocated);
        if (date && (!byMonth[a.forMonth].lastDate || date > byMonth[a.forMonth].lastDate!)) {
          byMonth[a.forMonth].lastDate = date;
        }
      }

      const months = monthsInYear.map((m) => {
        const isJoined = m >= member.depositStartDate;
        const exp = isJoined ? getExpectedForMonth(settingsSorted, m) : 0;
        const paid = byMonth[m]?.paid ?? 0;
        const pct = exp > 0 ? Math.min(paid / exp, 1) : 0;
        return { 
          month: m, 
          paid, 
          expected: exp, 
          pct, 
          lastPaymentDate: byMonth[m]?.lastDate ?? null,
          joined: isJoined
        };
      });
      return { memberId: member.userId, name: member.name, photo: member.photo, months };
    });

    let runningBalance = 0;
    const trendChart = allMonths.map((m) => {
      const monthPayments = validPayments.filter(p => p.paymentDate.startsWith(m)).reduce((s, p) => s + Number(p.amountReceived), 0);
      const monthExpenses = validExpenses.filter(e => e.expenseDate.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0);
      const monthRevenue = validRevenue.filter(r => r.eventDate.startsWith(m)).reduce((s, r) => {
        return r.sourceType === "loss" ? s - Number(r.amount) : s + Number(r.amount);
      }, 0);
      const monthInvestmentsOut = allInvestments.filter(i => !i.deleted && i.investDate.startsWith(m)).reduce((s, i) => s + Number(i.principal), 0);
      const monthInvestmentsIn = allInvestments.filter(i => !i.deleted && i.status === "matured" && i.actualReturnDate?.startsWith(m)).reduce((s, i) => s + Number(i.principal), 0);

      const netFlow = monthPayments - monthExpenses + monthRevenue - monthInvestmentsOut + monthInvestmentsIn;
      runningBalance += netFlow;

      return {
        month: format(new Date(m + "-01"), "MMM yy"),
        balance: runningBalance,
      };
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
      heatmapData: {
        year: currentYearNum,
        months: monthsInYear,
        heatmapData,
      },
      trendChart,
    };
  },
  ["manager-stats"],
  { tags: ["dashboard-stats", "manager-stats"] }
);

export async function getHeatmapData(year: number) {
  const [allAllocations, allPayments, allSettings, allMembers] = await Promise.all([
    db.select().from(depositAllocations),
    db.select({ paymentId: payments.paymentId, paymentDate: payments.paymentDate }).from(payments),
    db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth)),
    db.select().from(personalInfo),
  ]);

  // Build paymentId → paymentDate lookup
  const paymentDateByPaymentId = Object.fromEntries(
    allPayments.map((p) => [p.paymentId, p.paymentDate])
  );

  const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));

  // Jan to Dec for the given year
  const monthsInYear = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "00")}`
  );

  const heatmapData = allMembers.map((member) => {
    const memAllocs = allAllocations.filter((a) => a.memberId === member.userId);

    // paid amount + latest payment date per forMonth
    const byMonth: Record<string, { paid: number; lastDate: string | null }> = {};
    for (const a of memAllocs) {
      const date = paymentDateByPaymentId[a.paymentId] ?? null;
      if (!byMonth[a.forMonth]) byMonth[a.forMonth] = { paid: 0, lastDate: null };
      byMonth[a.forMonth].paid += Number(a.amountAllocated);
      if (date && (!byMonth[a.forMonth].lastDate || date > byMonth[a.forMonth].lastDate!)) {
        byMonth[a.forMonth].lastDate = date;
      }
    }

    const months = monthsInYear.map((m) => {
      const isJoined = m >= member.depositStartDate;
      const exp = isJoined ? getExpectedForMonth(settingsSorted, m) : 0;
      const paid = byMonth[m]?.paid ?? 0;
      const pct = exp > 0 ? Math.min(paid / exp, 1) : 0;
      return { 
        month: m, 
        paid, 
        expected: exp, 
        pct, 
        lastPaymentDate: byMonth[m]?.lastDate ?? null,
        joined: isJoined
      };
    });

    return { memberId: member.userId, name: member.name, photo: member.photo, months };
  });

  return { year, months: monthsInYear, heatmapData };
}

export async function getAllTimeHeatmapData() {
  const [allAllocations, allPayments, allSettings, allMembers] = await Promise.all([
    db.select().from(depositAllocations),
    db.select({ paymentId: payments.paymentId, paymentDate: payments.paymentDate }).from(payments),
    db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth)),
    db.select().from(personalInfo),
  ]);

  const paymentDateByPaymentId = Object.fromEntries(
    allPayments.map((p) => [p.paymentId, p.paymentDate])
  );

  const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));

  const globalStart = settingsSorted.length > 0 ? settingsSorted[0].effectiveMonth : "2024-01";
  const currentMonth = format(new Date(), "yyyy-MM");
  const allMonths = generateMonthRange(globalStart, currentMonth);

  const heatmapData = allMembers.map((member) => {
    const memAllocs = allAllocations.filter((a) => a.memberId === member.userId);

    const byMonth: Record<string, { paid: number; lastDate: string | null }> = {};
    for (const a of memAllocs) {
      const date = paymentDateByPaymentId[a.paymentId] ?? null;
      if (!byMonth[a.forMonth]) byMonth[a.forMonth] = { paid: 0, lastDate: null };
      byMonth[a.forMonth].paid += Number(a.amountAllocated);
      if (date && (!byMonth[a.forMonth].lastDate || date > byMonth[a.forMonth].lastDate!)) {
        byMonth[a.forMonth].lastDate = date;
      }
    }

    const months = allMonths.map((m) => {
      const exp = m < member.depositStartDate ? 0 : getExpectedForMonth(settingsSorted, m);
      const paid = byMonth[m]?.paid ?? 0;
      const pct = exp > 0 ? Math.min(paid / exp, 1) : 0;
      return { month: m, paid, expected: exp, pct, lastPaymentDate: byMonth[m]?.lastDate ?? null, joined: m >= member.depositStartDate };
    });

    return { memberId: member.userId, name: member.name, photo: member.photo, months };
  });

  return { year: null as null, months: allMonths, heatmapData, startMonth: globalStart, endMonth: currentMonth };
}

// ─── Member Dashboard Stats ───────────────────────────────────────────────────
export const getMemberDashboardStats = (memberId: string) => unstable_cache(
  async (mId: string) => {
    const [member, allAllocations, allSettings, myPayments, allShares] = await Promise.all([
      db.query.personalInfo.findFirst({ where: eq(personalInfo.userId, mId) }),
      db.select().from(depositAllocations).where(eq(depositAllocations.memberId, mId)),
      db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth)),
      db.select().from(payments)
        .where(eq(payments.memberId, mId))
        .orderBy(desc(payments.paymentDate))
        .limit(10),
      db.select({
        principal: investments.principal,
        sharePct: investmentShares.sharePercentage,
      })
      .from(investments)
      .innerJoin(investmentShares, eq(investments.entryId, investmentShares.investmentId))
      .where(and(
        eq(investments.status, "active"),
        eq(investments.deleted, false),
        eq(investmentShares.memberId, mId)
      )),
    ]);

    if (!member) throw new Error("Member not found");

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
      const isJoined = m >= (member as any).depositStartDate;
      const exp = isJoined ? getExpectedForMonth(settingsSorted, m) : 0;
      const paid = paidByMonth[m] || 0;
      totalExpected += exp;
      totalPaid += Math.min(paid, exp);
      return { month: m, expected: exp, paid, due: Math.max(0, exp - paid), joined: isJoined };
    });

    const totalDue = Math.max(0, totalExpected - totalPaid);

    const currentExp = getExpectedForMonth(settingsSorted, currentMonth);
    const currentPaid = paidByMonth[currentMonth] || 0;

    const last12 = Array.from({ length: 12 }, (_, i) =>
      format(subMonths(new Date(), 11 - i), "yyyy-MM")
    );
    const memberChart = last12.map((m) => ({
      month: format(new Date(m + "-01"), "MMM yy"),
      paid: paidByMonth[m] || 0,
      expected: getExpectedForMonth(settingsSorted, m),
    }));

    const totalInvested = (allShares as any[]).reduce((sum, s) => {
      return sum + (Number(s.principal) * Number(s.sharePct)) / 100;
    }, 0);

    const liquidBalance = Math.max(0, totalPaid - totalInvested);

    return {
      totalPaid,
      totalDue,
      totalExpected,
      totalInvested,
      liquidBalance,
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
  },
  [`member-stats-${memberId}`],
  { tags: ["dashboard-stats", "member-stats", `member-stats-${memberId}`] }
)(memberId);
