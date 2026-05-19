"use server";

import { db } from "@/db/client";
import {
  payments,
  depositAllocations,
  expenses,
  investments,
  revenueLosses,
  depositSettings,
  personalInfo,
  syncLogs,
} from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { eq, and, lte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Generate YYYY-MM range from start to end inclusive
function generateMonthRange(from: string, to: string): string[] {
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

function getExpectedForMonth(
  settings: any[],
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

// Check if report has been generated for a month
export async function getReportForMonth(monthStr: string) {
  const existing = await db.query.syncLogs.findFirst({
    where: and(
      eq(syncLogs.direction, "monthly_report"),
      eq(syncLogs.sheetName, monthStr)
    ),
  });
  if (!existing) return null;
  return existing.payload as any;
}

// Get all available generated report months
export async function getAvailableReports() {
  const all = await db
    .select({
      month: syncLogs.sheetName,
      createdAt: syncLogs.createdAt,
    })
    .from(syncLogs)
    .where(eq(syncLogs.direction, "monthly_report"));
  
  return all.map((r) => ({
    month: r.month || "Unknown",
    createdAt: r.createdAt,
  })).sort((a, b) => b.month.localeCompare(a.month));
}

export async function getMinMaxMonthLimits() {
  const allSettings = await db.select().from(depositSettings);
  const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
  const minMonth = settingsSorted.length > 0 ? settingsSorted[0].effectiveMonth : "2024-01";
  
  // Previous completed month
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const maxMonth = d.toISOString().slice(0, 7);
  return { minMonth, maxMonth };
}

// Generate the monthly report
export async function generateReport(monthStr: string) {
  await requireManager();

  // Validate format
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new Error("Invalid month format. Expected YYYY-MM");
  }

  // Prevent generating future months
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (monthStr > currentMonth) {
    throw new Error("You cannot generate reports for future months.");
  }

  // Prevent regenerating
  const existing = await getReportForMonth(monthStr);
  if (existing) {
    throw new Error(`Report for ${monthStr} has already been generated.`);
  }

  // Load all necessary records
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
    db.select().from(depositSettings),
    db.select().from(personalInfo),
  ]);

  // Compute month starting and ending bounds
  const firstDay = `${monthStr}-01`;
  const lastDate = new Date(parseInt(monthStr.split("-")[0]), parseInt(monthStr.split("-")[1]), 0);
  const lastDay = `${monthStr}-${String(lastDate.getDate()).padStart(2, "0")}`;

  // Starting balance calculations: up until right before firstDay
  const prevPayments = allPayments.filter((p) => !p.voided && p.paymentDate < firstDay);
  const prevExpenses = allExpenses.filter((e) => !e.voided && !e.deleted && e.expenseDate < firstDay);
  const prevInvestments = allInvestments.filter((i) => !i.deleted && i.investDate < firstDay && (i.actualReturnDate === null || i.actualReturnDate >= firstDay));
  const prevRevenue = allRevenue.filter((r) => !r.voided && !r.deleted && r.eventDate < firstDay);

  const prevCollected = prevPayments.reduce((sum, p) => sum + Number(p.amountReceived), 0);
  const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const prevInvested = prevInvestments.reduce((sum, i) => sum + Number(i.principal), 0);
  const prevIncome = prevRevenue.filter((r) => r.sourceType !== "loss").reduce((sum, r) => sum + Number(r.amount), 0);
  const prevLosses = prevRevenue.filter((r) => r.sourceType === "loss").reduce((sum, r) => sum + Number(r.amount), 0);

  const startingBalance = prevCollected - prevTotalExpenses - prevInvested + (prevIncome - prevLosses);

  // This month's data
  const thisPayments = allPayments.filter((p) => !p.voided && p.paymentDate >= firstDay && p.paymentDate <= lastDay);
  const thisExpenses = allExpenses.filter((e) => !e.voided && !e.deleted && e.expenseDate >= firstDay && e.expenseDate <= lastDay);
  const thisInvestments = allInvestments.filter((i) => !i.deleted && i.investDate >= firstDay && i.investDate <= lastDay);
  const thisRevenue = allRevenue.filter((r) => !r.voided && !r.deleted && r.eventDate >= firstDay && r.eventDate <= lastDay);

  const thisCollected = thisPayments.reduce((sum, p) => sum + Number(p.amountReceived), 0);
  const thisExpensesAmount = thisExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const thisIncome = thisRevenue.filter((r) => r.sourceType !== "loss").reduce((sum, r) => sum + Number(r.amount), 0);
  const thisLosses = thisRevenue.filter((r) => r.sourceType === "loss").reduce((sum, r) => sum + Number(r.amount), 0);

  // Balanced summary
  const balance = startingBalance + thisCollected - thisExpensesAmount + (thisIncome - thisLosses);

  // Active investments this month
  const activeInvestments = allInvestments.filter(
    (i) =>
      !i.deleted &&
      i.investDate <= lastDay &&
      (i.actualReturnDate === null || i.actualReturnDate >= firstDay)
  );

  // Matured returns this month
  const returnedInvestments = allInvestments.filter(
    (i) => !i.deleted && i.actualReturnDate && i.actualReturnDate >= firstDay && i.actualReturnDate <= lastDay
  );

  // Due List of this month
  // Find which months this member is pending for up to the selected month
  const settingsSorted = [...allSettings].sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
  const globalStart = settingsSorted.length > 0 ? settingsSorted[0].effectiveMonth : "2024-01";
  const allMonths = generateMonthRange(globalStart, monthStr);

  let totalDueForThisMonth = 0;
  let allTotalDue = 0;

  const dueList = allMembers.map((member) => {
    // Filter allocations to only those for months up to monthStr AND paid on or before lastDay
    const memAllocs = allAllocations.filter((a) => {
      if (a.memberId !== member.userId || a.forMonth > monthStr) return false;
      const p = allPayments.find((p) => p.paymentId === a.paymentId);
      if (!p) return false;
      return p.paymentDate <= lastDay;
    });

    const paidByMonth = memAllocs.reduce((acc, a) => {
      acc[a.forMonth] = (acc[a.forMonth] || 0) + Number(a.amountAllocated);
      return acc;
    }, {} as Record<string, number>);

    let totalDueForMember = 0;
    let dueForThisMonthForMember = 0;
    for (const m of allMonths) {
      if (m < member.depositStartDate) continue;
      const exp = getExpectedForMonth(settingsSorted, m);
      const paid = paidByMonth[m] || 0;
      const due = Math.max(0, exp - paid);
      totalDueForMember += due;
      if (m === monthStr) {
        dueForThisMonthForMember = due;
      }
    }

    totalDueForThisMonth += dueForThisMonthForMember;
    allTotalDue += totalDueForMember;

    return {
      name: member.name,
      userId: member.userId,
      due: totalDueForMember,
      dueForThisMonth: dueForThisMonthForMember,
    };
  });

  const activeInvestmentsAmount = activeInvestments.reduce((sum, i) => sum + Number(i.principal), 0);
  const returnedInvestmentsAmount = returnedInvestments.reduce((sum, i) => sum + Number(i.principal), 0);

  const reportPayload = {
    month: monthStr,
    summary: {
      startingBalance,
      thisCollected,
      thisExpensesAmount,
      prevTotalExpenses,
      balance,
      activeInvestmentsCount: activeInvestments.length,
      activeInvestmentsAmount,
      returnedInvestmentsCount: returnedInvestments.length,
      returnedInvestmentsAmount,
      netRevenueThisMonth: thisIncome - thisLosses,
      totalDueForThisMonth,
      allTotalDue,
    },
    details: {
      payments: thisPayments.map((p) => ({
        paymentId: p.paymentId,
        memberId: p.memberId,
        memberName: allMembers.find((m) => m.userId === p.memberId)?.name || "Unknown",
        amountReceived: Number(p.amountReceived),
        paymentDate: p.paymentDate,
        note: p.note,
      })),
      expenses: thisExpenses.map((e) => ({
        entryId: e.entryId,
        expenseDate: e.expenseDate,
        description: e.description,
        amount: Number(e.amount),
      })),
      investments: thisInvestments.map((i) => ({
        entryId: i.entryId,
        investDate: i.investDate,
        recipient: i.recipient,
        principal: Number(i.principal),
        status: i.status,
      })),
      revenue: thisRevenue.map((r) => ({
        entryId: r.entryId,
        eventDate: r.eventDate,
        sourceType: r.sourceType,
        description: r.description,
        amount: Number(r.amount),
      })),
      dueList: dueList.sort((a, b) => b.due - a.due),
    },
  };

  // Save via syncLogs
  await db.insert(syncLogs).values({
    direction: "monthly_report",
    sheetName: monthStr,
    status: "success",
    payload: reportPayload,
  });

  revalidatePath("/settings/reports");
  revalidatePath("/monthly-reports");
  return { success: true };
}

export async function clearOldReports() {
  await requireManager();
  await db.delete(syncLogs).where(eq(syncLogs.direction, "monthly_report"));
  revalidatePath("/settings/reports");
  revalidatePath("/monthly-reports");
  return { success: true };
}
