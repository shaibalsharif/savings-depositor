/**
 * PAI2 Data Context Builder
 *
 * Fetches app data (members, deposits, investments, etc.) and formats it
 * as structured text for the AI system prompt. This gives the LLM
 * knowledge of the app's current state to answer user questions.
 */

import { db } from "@/db/client";
import {
  personalInfo,
  payments,
  depositAllocations,
  expenses,
  investments,
  revenueLosses,
  depositSettings,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { format } from "date-fns";

export interface DataContext {
  membersContext: string;
  financialSummary: string;
  depositSettingsContext: string;
  recentActivity: string;
}

// ── In-memory cache ────────────────────────────────────────────────────
// The context is identical for every manager and identical for every
// member (it only branches on `isManager`), so we cache by that key and
// skip the ~7 DB queries on every chat message. A short TTL keeps it fresh
// enough for a finance dashboard; call `invalidateDataContextCache()` after
// a write to force an immediate refresh.
interface CacheEntry {
  data: DataContext;
  expires: number;
}
const CONTEXT_TTL_MS = 60_000; // 1 minute
const contextCache = new Map<string, CacheEntry>();

/** Clear the cached data context (e.g. after a data-changing write). */
export function invalidateDataContextCache(): void {
  contextCache.clear();
}

/**
 * Build the full data context for the AI system prompt.
 * This queries the database and formats all relevant data.
 */
export async function getDataContextForChat(
  currentUserId: string,
  isManager: boolean
): Promise<DataContext> {
  const cacheKey = isManager ? "manager" : "member";
  const cached = contextCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const [
    allMembers,
    allPayments,
    allAllocations,
    allExpenses,
    allInvestments,
    allRevenue,
    allSettings,
  ] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(payments),
    db.select().from(depositAllocations),
    db.select().from(expenses),
    db.select().from(investments),
    db.select().from(revenueLosses),
    db
      .select()
      .from(depositSettings)
      .orderBy(desc(depositSettings.effectiveMonth)),
  ]);

  // ── Members Context ──────────────────────────────────────────────────
  const memberLines = allMembers.map((m) => {
    const memAllocs = allAllocations.filter((a) => a.memberId === m.userId);
    const totalPaid = memAllocs.reduce(
      (s, a) => s + Number(a.amountAllocated),
      0
    );
    return `- ${m.name} (${m.nameBn || "N/A"}) | ID: ${m.userId.slice(0, 12)}... | Position: ${m.position} | Joined: ${m.depositStartDate} | Total Paid: ৳${totalPaid.toLocaleString()} | Mobile: ${m.mobile}`;
  });

  const membersContext = `## Members (${allMembers.length} total)\n${memberLines.join("\n")}`;

  // ── Financial Summary ────────────────────────────────────────────────
  const validPayments = allPayments.filter((p) => !p.voided);
  const totalCollected = validPayments.reduce(
    (s, p) => s + Number(p.amountReceived),
    0
  );

  const validExpenses = allExpenses.filter((e) => !e.voided && !e.deleted);
  const totalExpenses = validExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0
  );

  const activeInvestments = allInvestments.filter(
    (i) => i.status === "active" && !i.deleted
  );
  const totalInvested = activeInvestments.reduce(
    (s, i) => s + Number(i.principal),
    0
  );

  const validRevenue = allRevenue.filter((r) => !r.voided && !r.deleted);
  const totalIncome = validRevenue
    .filter((r) => r.sourceType !== "loss")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalLoss = validRevenue
    .filter((r) => r.sourceType === "loss")
    .reduce((s, r) => s + Number(r.amount), 0);
  const netRevenue = totalIncome - totalLoss;
  const balance = totalCollected - totalExpenses - totalInvested + netRevenue;

  // ── Derived, commonly-asked figures (pre-computed so the model never
  //    has to do arithmetic itself) ─────────────────────────────────────
  const nowDate = new Date();
  const yearStr = format(nowDate, "yyyy");
  const monthStr = format(nowDate, "yyyy-MM");

  const collectedThisYear = validPayments
    .filter((p) => p.paymentDate.startsWith(yearStr))
    .reduce((s, p) => s + Number(p.amountReceived), 0);
  const collectedThisMonth = validPayments
    .filter((p) => p.paymentDate.startsWith(monthStr))
    .reduce((s, p) => s + Number(p.amountReceived), 0);
  const avgPaidPerMember =
    allMembers.length > 0 ? Math.round(totalCollected / allMembers.length) : 0;

  const financialSummary = `## Financial Summary
- Total Deposits Collected (all time): ৳${totalCollected.toLocaleString()}
- Deposits Collected This Year (${yearStr}): ৳${collectedThisYear.toLocaleString()}
- Deposits Collected This Month (${monthStr}): ৳${collectedThisMonth.toLocaleString()}
- Average Collected Per Member: ৳${avgPaidPerMember.toLocaleString()}
- Total Expenses: ৳${totalExpenses.toLocaleString()}
- Active Investments: ${activeInvestments.length} (Total: ৳${totalInvested.toLocaleString()})
- Net Revenue (Income - Loss): ৳${netRevenue.toLocaleString()} (Income: ৳${totalIncome.toLocaleString()}, Loss: ৳${totalLoss.toLocaleString()})
- Available Balance: ৳${balance.toLocaleString()}
- Total Members: ${allMembers.length}`;

  // ── Deposit Settings ─────────────────────────────────────────────────
  const settingsSorted = [...allSettings].sort((a, b) =>
    a.effectiveMonth.localeCompare(b.effectiveMonth)
  );
  const currentSetting = settingsSorted[settingsSorted.length - 1];
  const depositSettingsContext = currentSetting
    ? `## Deposit Settings
- Monthly Amount: ৳${currentSetting.monthlyAmount}
- Due Day: ${currentSetting.dueDay}th of each month
- Reminder Day: ${currentSetting.reminderDay}th of each month
- Effective Since: ${currentSetting.effectiveMonth}`
    : "## Deposit Settings\nNo settings configured.";

  // ── Recent Activity (last 30 days) ───────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentDateStr = format(thirtyDaysAgo, "yyyy-MM-dd");

  const recentPayments = validPayments
    .filter((p) => p.paymentDate >= recentDateStr)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 20);

  const recentPaymentLines = recentPayments.map((p) => {
    const member = allMembers.find((m) => m.userId === p.memberId);
    return `  - ${p.paymentDate}: ${member?.name || "Unknown"} paid ৳${Number(p.amountReceived).toLocaleString()} for ${p.forMonth || "N/A"}`;
  });

  const recentExpenseEntries = validExpenses
    .filter((e) => e.expenseDate >= recentDateStr)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 10);

  const recentExpenseLines = recentExpenseEntries.map(
    (e) =>
      `  - ${e.expenseDate}: ${e.description} — ৳${Number(e.amount).toLocaleString()}`
  );

  const recentActivity = `## Recent Activity (Last 30 Days)
### Recent Payments (${recentPayments.length})
${recentPaymentLines.length > 0 ? recentPaymentLines.join("\n") : "  No recent payments."}
### Recent Expenses (${recentExpenseEntries.length})
${recentExpenseLines.length > 0 ? recentExpenseLines.join("\n") : "  No recent expenses."}
### Active Investments
${activeInvestments
  .map(
    (i) =>
      `  - ${i.recipient}: ৳${Number(i.principal).toLocaleString()} (invested ${i.investDate}, expected return ${i.expectedReturnDate}, status: ${i.status})`
  )
  .join("\n") || "  No active investments."}`;

  // ── Per-Member Dues (for manager) ────────────────────────────────────
  let finalRecentActivity = recentActivity;
  if (isManager) {
    const currentMonth = format(new Date(), "yyyy-MM");
    const latestSetting = settingsSorted[settingsSorted.length - 1];
    const monthlyAmount = latestSetting
      ? Number(latestSetting.monthlyAmount)
      : 0;

    let totalOutstanding = 0;
    const memberDueLines = allMembers
      .map((member) => {
        const memAllocs = allAllocations.filter(
          (a) => a.memberId === member.userId
        );
        const currentPaid = memAllocs
          .filter((a) => a.forMonth === currentMonth)
          .reduce((s, a) => s + Number(a.amountAllocated), 0);
        const currentDue = Math.max(0, monthlyAmount - currentPaid);

        if (currentDue > 0) {
          totalOutstanding += currentDue;
          return `  - ${member.name}: ৳${currentDue.toLocaleString()} due for ${currentMonth}`;
        }
        return null;
      })
      .filter(Boolean);

    if (memberDueLines.length > 0) {
      finalRecentActivity =
        recentActivity +
        `\n### Current Month Pending Dues (${memberDueLines.length} member(s), Total Outstanding: ৳${totalOutstanding.toLocaleString()})\n${memberDueLines.join("\n")}`;
    } else {
      finalRecentActivity =
        recentActivity +
        `\n### Current Month Pending Dues\n  All members are fully paid for ${currentMonth}.`;
    }
  }

  const result: DataContext = {
    membersContext,
    financialSummary,
    depositSettingsContext,
    recentActivity: finalRecentActivity,
  };

  contextCache.set(cacheKey, {
    data: result,
    expires: Date.now() + CONTEXT_TTL_MS,
  });

  return result;
}

/**
 * Get a specific member's detailed data for non-manager users
 */
export async function getMemberDataContext(userId: string): Promise<string> {
  const [member, memberPayments, memberAllocations] = await Promise.all([
    db.query.personalInfo.findFirst({
      where: eq(personalInfo.userId, userId),
    }),
    db.select().from(payments).where(eq(payments.memberId, userId)),
    db
      .select()
      .from(depositAllocations)
      .where(eq(depositAllocations.memberId, userId)),
  ]);

  if (!member) return "Member profile not found.";

  const validPayments = memberPayments.filter((p) => !p.voided);
  const totalPaid = memberAllocations.reduce(
    (s, a) => s + Number(a.amountAllocated),
    0
  );

  const paymentLines = validPayments
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 20)
    .map(
      (p) =>
        `  - ${p.paymentDate}: ৳${Number(p.amountReceived).toLocaleString()} for ${p.forMonth || "N/A"} ${p.note ? `(${p.note})` : ""}`
    );

  return `## Your Deposit History
- Name: ${member.name} (${member.nameBn})
- Total Paid: ৳${totalPaid.toLocaleString()}
- Last ${Math.min(validPayments.length, 20)} Payments:
${paymentLines.join("\n") || "  No payments yet."}`;
}
