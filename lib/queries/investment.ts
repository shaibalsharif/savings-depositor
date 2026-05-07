import { db } from "@/db/client";
import {
  payments,
  expenses,
  investments,
  revenueLosses,
  investmentShares,
  personalInfo,
} from "@/db/schema";
import { lte, eq, and } from "drizzle-orm";

/**
 * Calculate each member's available balance at a specific point in time,
 * then snapshot their proportional share of a new investment.
 *
 * Balance formula per member at date T:
 *   = SUM(their payments up to T)
 *   - their proportional share of all global expenses up to T
 *   - SUM(their previous investment_shares.balance_at_investment)
 *   + their proportional share of all revenue/profit up to T (excl. principal_return)
 *   + their proportional share of all principal_return entries up to T
 *
 * Members with a calculated balance ≤ 0 are assigned 0 and excluded from the %.
 */
export async function calculateAndSaveShares(
  investmentEntryId: string,
  investDate: string // YYYY-MM-DD
): Promise<void> {
  const [
    allMembers,
    allPayments,
    allExpenses,
    allRevenue,
    allPriorShares,
  ] = await Promise.all([
    db.select().from(personalInfo),
    db
      .select()
      .from(payments)
      .where(and(eq(payments.voided, false), lte(payments.paymentDate, investDate))),
    db
      .select()
      .from(expenses)
      .where(and(eq(expenses.voided, false), eq(expenses.deleted, false), lte(expenses.expenseDate, investDate))),
    db
      .select()
      .from(revenueLosses)
      .where(and(eq(revenueLosses.voided, false), eq(revenueLosses.deleted, false), lte(revenueLosses.eventDate, investDate))),
    db.select().from(investmentShares),
  ]);

  // Only consider members who have joined by the time of investment
  // investDate is YYYY-MM-DD, depositStartDate is YYYY-MM
  const investMonth = investDate.substring(0, 7);
  const activeMembers = allMembers.filter((m) => m.depositStartDate <= investMonth);
  const memberCount = activeMembers.length;

  if (memberCount === 0) return;

  // Global totals (shared equally across all members)
  const totalGlobalExpenses = allExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Revenue = profit + losses + principal_return (all positive amounts, sign comes from sourceType)
  const totalRevenue = allRevenue.reduce((s, r) => {
    const amt = Number(r.amount);
    if (r.sourceType === "loss") return s - amt;
    // profit, principal_return, bank_profit, other → add
    return s + amt;
  }, 0);

  const perMemberExpenseShare = totalGlobalExpenses / memberCount;
  const perMemberRevenueShare = totalRevenue / memberCount;

  // Calculate individual member balances
  const memberBalances = allMembers.map((member) => {
    const totalDeposited = allPayments
      .filter((p) => p.memberId === member.userId)
      .reduce((s, p) => s + Number(p.amountReceived), 0);

    const priorInvestmentDeducted = allPriorShares
      .filter((s) => s.memberId === member.userId && s.investmentId !== investmentEntryId)
      .reduce((sum, s) => sum + Number(s.balanceAtInvestment), 0);

    const balance =
      totalDeposited -
      perMemberExpenseShare -
      priorInvestmentDeducted +
      perMemberRevenueShare;

    return {
      memberId: member.userId,
      name: member.name,
      balance: Math.max(0, balance), // floor at 0
    };
  });

  const totalBalance = memberBalances.reduce((s, m) => s + m.balance, 0);

  // Clear existing share records for this investment to prevent duplicates/orphans
  await db.delete(investmentShares).where(eq(investmentShares.investmentId, investmentEntryId));

  if (totalBalance <= 0) {
    // Edge case: no positive balances — assign equal shares
    const equalShare = parseFloat((100 / memberCount).toFixed(4));
    await db.insert(investmentShares).values(
      memberBalances.map((m) => ({
        investmentId: investmentEntryId,
        memberId: m.memberId,
        balanceAtInvestment: "0",
        sharePercentage: equalShare.toString(),
      }))
    );
    return;
  }

  await db.insert(investmentShares).values(
    memberBalances.map((m) => {
      const pct = (m.balance / totalBalance) * 100;
      return {
        investmentId: investmentEntryId,
        memberId: m.memberId,
        balanceAtInvestment: m.balance.toFixed(2),
        sharePercentage: pct.toFixed(4),
      };
    })
  );
}

/**
 * Fetch a single investment with all member share snapshots + member names.
 */
export async function getInvestmentWithShares(entryId: string) {
  const [investment, shares, members] = await Promise.all([
    db.query.investments.findFirst({ where: eq(investments.entryId, entryId) }),
    db.select().from(investmentShares).where(eq(investmentShares.investmentId, entryId)),
    db.select().from(personalInfo),
  ]);

  if (!investment) return null;

  const memberMap = Object.fromEntries(members.map((m) => [m.userId, m.name]));

  const sharesWithNames = shares
    .map((s) => ({
      ...s,
      memberName: memberMap[s.memberId] ?? s.memberId,
      sharePercentage: Number(s.sharePercentage),
      balanceAtInvestment: Number(s.balanceAtInvestment),
    }))
    .sort((a, b) => b.sharePercentage - a.sharePercentage);

  // Revenue linked to this investment
  const linkedRevenue = await db
    .select()
    .from(revenueLosses)
    .where(
      and(
        eq(revenueLosses.linkedInvestmentId, entryId),
        eq(revenueLosses.voided, false),
        eq(revenueLosses.deleted, false)
      )
    );

  const totalProfit = linkedRevenue
    .filter((r) => r.sourceType === "profit" || r.sourceType === "bank_profit")
    .reduce((s, r) => s + Number(r.amount), 0);

  const totalLoss = linkedRevenue
    .filter((r) => r.sourceType === "loss")
    .reduce((s, r) => s + Number(r.amount), 0);

  const principalReturned = linkedRevenue
    .filter((r) => r.sourceType === "principal_return")
    .reduce((s, r) => s + Number(r.amount), 0);

  return {
    investment,
    shares: sharesWithNames,
    linkedRevenue,
    summary: {
      totalProfit,
      totalLoss,
      netRevenue: totalProfit - totalLoss,
      principalReturned,
      principalReturnedFully: principalReturned >= Number(investment.principal),
    },
  };
}

/**
 * Get all investments a member has participated in, with their share %.
 */
export async function getMemberInvestmentHistory(memberId: string) {
  const shares = await db
    .select()
    .from(investmentShares)
    .where(eq(investmentShares.memberId, memberId));

  if (shares.length === 0) return [];

  const investmentIds = shares.map((s) => s.investmentId);
  const allInvestments = await db.select().from(investments);

  return allInvestments
    .filter((i) => investmentIds.includes(i.entryId))
    .map((inv) => {
      const share = shares.find((s) => s.investmentId === inv.entryId)!;
      return {
        ...inv,
        sharePercentage: Number(share.sharePercentage),
        balanceAtInvestment: Number(share.balanceAtInvestment),
      };
    })
    .sort((a, b) => b.investDate.localeCompare(a.investDate));
}
