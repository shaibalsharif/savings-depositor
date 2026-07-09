/**
 * PAI2 Tool Layer
 *
 * Defines the function/tool set the model can call, and the executors that run
 * REAL queries against the database using the app's own business logic. The
 * model never computes financial figures itself — it calls a tool, we run the
 * query, and it composes an answer from the exact returned numbers.
 *
 * Every executor returns a plain JSON-serialisable object.
 */

import { db } from "@/db/client";
import {
  personalInfo,
  payments,
  depositAllocations,
  depositSettings,
  expenses,
  investments,
  revenueLosses,
} from "@/db/schema";
import { format } from "date-fns";
import { generateMonthRange } from "@/lib/allocation";

// ─── Tool definitions (OpenAI / Groq function-calling format) ───────────

export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "list_members",
      description:
        "List all members with their position, deposit start date, mobile and all-time total paid. Optionally filter by a name substring.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Optional name substring to filter members (English or Bangla).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_overview",
      description:
        "Get the group's overall financial totals: total deposits collected, total expenses, active investments and principal deployed, revenue income/loss/net, available balance, member count, and current monthly deposit amount.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_deposit_status_for_month",
      description:
        "For a specific month, who has paid in full, partially, or not at all. Returns per-member expected/paid/remaining plus summary counts and totals. Use for 'who did/didn't deposit this month'.",
      parameters: {
        type: "object",
        properties: {
          month: {
            type: "string",
            description: "Month in YYYY-MM format. Defaults to the current month if omitted.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_member_deposit_detail",
      description:
        "Full month-by-month deposit history and payment behaviour for a single member: expected/paid/remaining each month, months paid/partial/missed, first & last payment dates, payment count and frequency. Use for questions about a specific person's dues, tendency, or partial payments.",
      parameters: {
        type: "object",
        properties: {
          member: {
            type: "string",
            description: "Member name (or part of it) or member ID.",
          },
        },
        required: ["member"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_trends",
      description:
        "Group-wide month-by-month series from the program start to now: collected, expected, new dues that month, cumulative outstanding, and active members. Use for any trend / growth-over-time / line chart question.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Optional start month YYYY-MM." },
          to: { type: "string", description: "Optional end month YYYY-MM." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_outstanding_by_member",
      description:
        "How much each member currently owes. If 'month' is given, returns that month's remaining per member; otherwise returns total cumulative arrears per member across all months. Sorted highest first, with a grand total.",
      parameters: {
        type: "object",
        properties: {
          month: {
            type: "string",
            description: "Optional month YYYY-MM. Omit for cumulative-to-date arrears.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_payments",
      description:
        "Raw payment records (deposit transactions). Filter by member and/or date range. Use for payment frequency, recent deposits, or auditing who paid when.",
      parameters: {
        type: "object",
        properties: {
          member: { type: "string", description: "Optional member name or ID." },
          from: { type: "string", description: "Optional start date YYYY-MM-DD." },
          to: { type: "string", description: "Optional end date YYYY-MM-DD." },
          limit: { type: "number", description: "Max records (default 50)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_investments",
      description:
        "Investments / deployed capital: recipient, principal, invest & expected-return dates, status, and any realised profit/loss/principal-return linked to each. Includes totals of active principal and realised returns. Filter by status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "matured", "defaulted", "all"],
            description: "Filter by status. Default 'all'.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_expenses",
      description:
        "Expenses / costs / withdrawals. Filter by date range and/or category. Returns a total, a per-category breakdown, and the matching records.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Optional start date YYYY-MM-DD." },
          to: { type: "string", description: "Optional end date YYYY-MM-DD." },
          category: { type: "string", description: "Optional category filter." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue",
      description:
        "Revenue and losses: income, loss, principal returns and net, with a breakdown by source type and the matching records. Filter by date range.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Optional start date YYYY-MM-DD." },
          to: { type: "string", description: "Optional end date YYYY-MM-DD." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_deposit_settings",
      description:
        "The deposit rules over time: monthly amount, due day, reminder day and the month each rule became effective (and when terminated). Use for questions about limits/amounts and how they changed.",
      parameters: { type: "object", properties: {} },
    },
  },
] as const;

// ─── Shared helpers ─────────────────────────────────────────────────────

type SettingRow = {
  monthlyAmount: string;
  effectiveMonth: string;
  terminatedAt: string | null;
  dueDay: string;
  reminderDay: string;
};

const num = (v: unknown) => Number(v ?? 0);
const currentMonthStr = () => format(new Date(), "yyyy-MM");

function expectedForMonth(monthStr: string, sortedSettings: SettingRow[]): number {
  let exp = 0;
  for (const s of sortedSettings) {
    if (s.effectiveMonth <= monthStr && (!s.terminatedAt || s.terminatedAt > monthStr)) {
      exp = num(s.monthlyAmount);
    }
  }
  return exp;
}

function memberStartMonth(depositStartDate: string | null, globalStart: string): string {
  const raw = depositStartDate || globalStart;
  const s = raw > globalStart ? raw : globalStart;
  return s.slice(0, 7);
}

async function loadSettingsAsc(): Promise<SettingRow[]> {
  const rows = await db.select().from(depositSettings);
  return rows
    .map((r) => ({
      monthlyAmount: r.monthlyAmount,
      effectiveMonth: r.effectiveMonth,
      terminatedAt: r.terminatedAt,
      dueDay: r.dueDay,
      reminderDay: r.reminderDay,
    }))
    .sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
}

/** Resolve a member by ID or (fuzzy) name. Returns the row or a suggestion list. */
async function resolveMember(query: string) {
  const members = await db.select().from(personalInfo);
  const q = query.trim().toLowerCase();
  const byId = members.find((m) => m.userId.toLowerCase() === q);
  if (byId) return { member: byId, members };
  const exact = members.find((m) => m.name.toLowerCase() === q);
  if (exact) return { member: exact, members };
  const partial = members.filter(
    (m) => m.name.toLowerCase().includes(q) || (m.nameBn || "").includes(query.trim())
  );
  if (partial.length === 1) return { member: partial[0], members };
  return { member: null, members, candidates: partial.map((m) => m.name) };
}

// ─── Executors ──────────────────────────────────────────────────────────

async function listMembers(args: { search?: string }) {
  const [members, allocs] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(depositAllocations),
  ]);
  const paidByMember: Record<string, number> = {};
  for (const a of allocs)
    paidByMember[a.memberId] = (paidByMember[a.memberId] || 0) + num(a.amountAllocated);

  let list = members.map((m) => ({
    name: m.name,
    nameBn: m.nameBn,
    position: m.position,
    depositStartDate: m.depositStartDate,
    mobile: m.mobile,
    totalPaid: paidByMember[m.userId] || 0,
  }));

  if (args.search) {
    const s = args.search.toLowerCase();
    list = list.filter(
      (m) => m.name.toLowerCase().includes(s) || (m.nameBn || "").includes(args.search!)
    );
  }
  return { count: list.length, members: list };
}

async function getFinancialOverview() {
  const [members, pays, exps, invs, revs, settingsAsc] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(payments),
    db.select().from(expenses),
    db.select().from(investments),
    db.select().from(revenueLosses),
    loadSettingsAsc(),
  ]);

  const totalCollected = pays
    .filter((p) => !p.voided)
    .reduce((s, p) => s + num(p.amountReceived), 0);
  const totalExpenses = exps
    .filter((e) => !e.voided && !e.deleted)
    .reduce((s, e) => s + num(e.amount), 0);
  const activeInv = invs.filter((i) => i.status === "active" && !i.deleted);
  const totalInvested = activeInv.reduce((s, i) => s + num(i.principal), 0);

  const validRev = revs.filter((r) => !r.voided && !r.deleted);
  const income = validRev
    .filter((r) => r.sourceType !== "loss")
    .reduce((s, r) => s + num(r.amount), 0);
  const loss = validRev
    .filter((r) => r.sourceType === "loss")
    .reduce((s, r) => s + num(r.amount), 0);
  const net = income - loss;
  const balance = totalCollected - totalExpenses - totalInvested + net;
  const current = settingsAsc[settingsAsc.length - 1];

  return {
    totalDepositsCollected: totalCollected,
    totalExpenses,
    activeInvestmentCount: activeInv.length,
    totalActivePrincipalDeployed: totalInvested,
    revenueIncome: income,
    revenueLoss: loss,
    netRevenue: net,
    availableBalance: balance,
    memberCount: members.length,
    currentMonthlyAmount: current ? num(current.monthlyAmount) : null,
    note: "All amounts in BDT (৳). availableBalance = collected - expenses - activePrincipal + netRevenue.",
  };
}

async function getDepositStatusForMonth(args: { month?: string }) {
  const month = args.month || currentMonthStr();
  const [members, allocs, settingsAsc] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(depositAllocations),
    loadSettingsAsc(),
  ]);
  if (settingsAsc.length === 0) return { error: "No deposit settings configured." };

  const globalStart = settingsAsc[0].effectiveMonth;
  const expected = expectedForMonth(month, settingsAsc);

  const paidByMember: Record<string, number> = {};
  for (const a of allocs)
    if (a.forMonth === month)
      paidByMember[a.memberId] = (paidByMember[a.memberId] || 0) + num(a.amountAllocated);

  const rows = members
    .filter((m) => memberStartMonth(m.depositStartDate, globalStart) <= month)
    .map((m) => {
      const paid = paidByMember[m.userId] || 0;
      const remaining = Math.max(0, expected - paid);
      const status = paid <= 0 ? "unpaid" : remaining > 0 ? "partial" : "paid";
      return { member: m.name, expected, paid, remaining, status };
    });

  return {
    summary: {
      month,
      expectedPerMember: expected,
      activeMembers: rows.length,
      paidCount: rows.filter((r) => r.status === "paid").length,
      partialCount: rows.filter((r) => r.status === "partial").length,
      unpaidCount: rows.filter((r) => r.status === "unpaid").length,
      totalCollected: rows.reduce((s, r) => s + r.paid, 0),
      totalExpected: rows.reduce((s, r) => s + r.expected, 0),
      totalDue: rows.reduce((s, r) => s + r.remaining, 0),
    },
    members: rows,
  };
}

async function getMemberDepositDetail(args: { member: string }) {
  const { member, candidates } = await resolveMember(args.member);
  if (!member)
    return {
      error: `No unique member matched "${args.member}".`,
      suggestions: candidates,
    };

  const settingsAsc = await loadSettingsAsc();
  if (settingsAsc.length === 0) return { error: "No deposit settings configured." };
  const globalStart = settingsAsc[0].effectiveMonth;

  const [allocs, memberPays] = await Promise.all([
    db.select().from(depositAllocations),
    db.select().from(payments),
  ]);

  const paidByMonth: Record<string, number> = {};
  for (const a of allocs)
    if (a.memberId === member.userId)
      paidByMonth[a.forMonth] = (paidByMonth[a.forMonth] || 0) + num(a.amountAllocated);

  const startM = memberStartMonth(member.depositStartDate, globalStart);
  const months = generateMonthRange(startM, currentMonthStr());

  let monthsPaidFull = 0;
  let monthsPartial = 0;
  let monthsUnpaid = 0;
  let totalExpected = 0;
  let totalPaid = 0;
  const history = months.map((month) => {
    const expected = expectedForMonth(month, settingsAsc);
    const paid = paidByMonth[month] || 0;
    const remaining = Math.max(0, expected - paid);
    const status = paid <= 0 ? "unpaid" : remaining > 0 ? "partial" : "paid";
    if (status === "paid") monthsPaidFull++;
    else if (status === "partial") monthsPartial++;
    else monthsUnpaid++;
    totalExpected += expected;
    totalPaid += paid;
    return { month, expected, paid, remaining, status };
  });

  const myPays = memberPays
    .filter((p) => p.memberId === member.userId && !p.voided)
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

  return {
    member: member.name,
    memberBn: member.nameBn,
    depositStartMonth: startM,
    totals: {
      totalExpected,
      totalPaid,
      totalRemaining: Math.max(0, totalExpected - totalPaid),
      monthsTracked: months.length,
      monthsPaidFull,
      monthsPartial,
      monthsUnpaid,
    },
    paymentActivity: {
      paymentCount: myPays.length,
      firstPaymentDate: myPays[0]?.paymentDate ?? null,
      lastPaymentDate: myPays[myPays.length - 1]?.paymentDate ?? null,
    },
    monthlyHistory: history,
  };
}

function buildTrendSeries(
  members: { userId: string; depositStartDate: string | null }[],
  allocs: { memberId: string; forMonth: string; amountAllocated: string }[],
  settingsAsc: SettingRow[],
  from?: string,
  to?: string
) {
  const globalStart = settingsAsc[0].effectiveMonth;
  const start = from && from > globalStart ? from : globalStart;
  const end = to || currentMonthStr();
  const months = generateMonthRange(start, end);

  const paidByMemberMonth = new Map<string, Record<string, number>>();
  for (const a of allocs) {
    const rec = paidByMemberMonth.get(a.memberId) || {};
    rec[a.forMonth] = (rec[a.forMonth] || 0) + num(a.amountAllocated);
    paidByMemberMonth.set(a.memberId, rec);
  }
  const startOf = new Map<string, string>();
  for (const m of members)
    startOf.set(m.userId, memberStartMonth(m.depositStartDate, globalStart));

  // cumulative must count arrears from globalStart even if 'from' is later
  const fullMonths = generateMonthRange(globalStart, end);
  let cumulative = 0;
  const perMonth = new Map<string, { collected: number; expected: number; newDues: number; active: number }>();
  for (const month of fullMonths) {
    const exp = expectedForMonth(month, settingsAsc);
    let collected = 0;
    let expected = 0;
    let newDues = 0;
    let active = 0;
    for (const m of members) {
      const sm = startOf.get(m.userId)!;
      if (sm > month) continue;
      active++;
      const paid = paidByMemberMonth.get(m.userId)?.[month] || 0;
      collected += paid;
      expected += exp;
      newDues += Math.max(0, exp - paid);
    }
    cumulative += newDues;
    perMonth.set(month, { collected, expected, newDues, active });
  }

  let running = 0;
  return months.map((month) => {
    // recompute cumulative up to this month
    running = 0;
    for (const fm of fullMonths) {
      running += perMonth.get(fm)!.newDues;
      if (fm === month) break;
    }
    const d = perMonth.get(month)!;
    return {
      month,
      collected: d.collected,
      expected: d.expected,
      newDues: d.newDues,
      cumulativeOutstanding: running,
      activeMembers: d.active,
    };
  });
}

async function getMonthlyTrends(args: { from?: string; to?: string }) {
  const [members, allocs, settingsAsc] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(depositAllocations),
    loadSettingsAsc(),
  ]);
  if (settingsAsc.length === 0) return { error: "No deposit settings configured." };
  const series = buildTrendSeries(members, allocs, settingsAsc, args.from, args.to);
  return {
    programStartMonth: settingsAsc[0].effectiveMonth,
    columns: ["month", "collected", "expected", "newDues", "cumulativeOutstanding", "activeMembers"],
    series,
  };
}

async function getOutstandingByMember(args: { month?: string }) {
  const [members, allocs, settingsAsc] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(depositAllocations),
    loadSettingsAsc(),
  ]);
  if (settingsAsc.length === 0) return { error: "No deposit settings configured." };
  const globalStart = settingsAsc[0].effectiveMonth;

  const paidByMemberMonth = new Map<string, Record<string, number>>();
  for (const a of allocs) {
    const rec = paidByMemberMonth.get(a.memberId) || {};
    rec[a.forMonth] = (rec[a.forMonth] || 0) + num(a.amountAllocated);
    paidByMemberMonth.set(a.memberId, rec);
  }

  const rows = members.map((m) => {
    const startM = memberStartMonth(m.depositStartDate, globalStart);
    const months = args.month ? [args.month] : generateMonthRange(startM, currentMonthStr());
    let remaining = 0;
    for (const month of months) {
      if (month < startM) continue;
      const exp = expectedForMonth(month, settingsAsc);
      const paid = paidByMemberMonth.get(m.userId)?.[month] || 0;
      remaining += Math.max(0, exp - paid);
    }
    return { member: m.name, outstanding: remaining };
  });

  rows.sort((a, b) => b.outstanding - a.outstanding);
  return {
    scope: args.month ? `month ${args.month}` : "cumulative to date",
    totalOutstanding: rows.reduce((s, r) => s + r.outstanding, 0),
    membersOwing: rows.filter((r) => r.outstanding > 0).length,
    members: rows,
  };
}

async function listPayments(args: {
  member?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const [members, pays] = await Promise.all([
    db.select().from(personalInfo),
    db.select().from(payments),
  ]);
  const nameById: Record<string, string> = {};
  for (const m of members) nameById[m.userId] = m.name;

  let memberId: string | null = null;
  if (args.member) {
    const { member, candidates } = await resolveMember(args.member);
    if (!member) return { error: `No unique member matched "${args.member}".`, suggestions: candidates };
    memberId = member.userId;
  }

  const rows = pays
    .filter((p) => !p.voided)
    .filter((p) => (memberId ? p.memberId === memberId : true))
    .filter((p) => (args.from ? p.paymentDate >= args.from! : true))
    .filter((p) => (args.to ? p.paymentDate <= args.to! : true))
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, Math.min(args.limit || 50, 200))
    .map((p) => ({
      paymentId: p.paymentId,
      member: nameById[p.memberId] || p.memberId,
      date: p.paymentDate,
      amountReceived: num(p.amountReceived),
      forMonth: p.forMonth,
      note: p.note,
    }));

  return {
    count: rows.length,
    totalAmount: rows.reduce((s, r) => s + r.amountReceived, 0),
    payments: rows,
  };
}

async function getInvestments(args: { status?: string }) {
  const [invs, revs] = await Promise.all([
    db.select().from(investments),
    db.select().from(revenueLosses),
  ]);
  const status = args.status && args.status !== "all" ? args.status : null;

  const realizedByInv: Record<string, { profit: number; loss: number; principalReturn: number }> = {};
  for (const r of revs) {
    if (r.voided || r.deleted || !r.linkedInvestmentId) continue;
    const rec = (realizedByInv[r.linkedInvestmentId] ||= { profit: 0, loss: 0, principalReturn: 0 });
    if (r.sourceType === "loss") rec.loss += num(r.amount);
    else if (r.sourceType === "principal_return") rec.principalReturn += num(r.amount);
    else rec.profit += num(r.amount);
  }

  const list = invs
    .filter((i) => !i.deleted)
    .filter((i) => (status ? i.status === status : true))
    .map((i) => ({
      recipient: i.recipient,
      principal: num(i.principal),
      investDate: i.investDate,
      expectedReturnDate: i.expectedReturnDate,
      actualReturnDate: i.actualReturnDate,
      status: i.status,
      note: i.note,
      realized: realizedByInv[i.entryId] || { profit: 0, loss: 0, principalReturn: 0 },
    }));

  const active = list.filter((i) => i.status === "active");
  return {
    count: list.length,
    totalActivePrincipalDeployed: active.reduce((s, i) => s + i.principal, 0),
    totalPrincipalAllListed: list.reduce((s, i) => s + i.principal, 0),
    totalRealizedProfit: list.reduce((s, i) => s + i.realized.profit, 0),
    totalRealizedLoss: list.reduce((s, i) => s + i.realized.loss, 0),
    totalPrincipalReturned: list.reduce((s, i) => s + i.realized.principalReturn, 0),
    byStatus: {
      active: list.filter((i) => i.status === "active").length,
      matured: list.filter((i) => i.status === "matured").length,
      defaulted: list.filter((i) => i.status === "defaulted").length,
    },
    investments: list,
  };
}

async function getExpenses(args: { from?: string; to?: string; category?: string }) {
  const rows = (await db.select().from(expenses))
    .filter((e) => !e.voided && !e.deleted)
    .filter((e) => (args.from ? e.expenseDate >= args.from! : true))
    .filter((e) => (args.to ? e.expenseDate <= args.to! : true))
    .filter((e) => (args.category ? e.category === args.category : true));

  const byCategory: Record<string, number> = {};
  for (const e of rows) byCategory[e.category] = (byCategory[e.category] || 0) + num(e.amount);

  return {
    count: rows.length,
    total: rows.reduce((s, e) => s + num(e.amount), 0),
    byCategory,
    expenses: rows
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 100)
      .map((e) => ({
        date: e.expenseDate,
        category: e.category,
        description: e.description,
        amount: num(e.amount),
      })),
  };
}

async function getRevenue(args: { from?: string; to?: string }) {
  const rows = (await db.select().from(revenueLosses))
    .filter((r) => !r.voided && !r.deleted)
    .filter((r) => (args.from ? r.eventDate >= args.from! : true))
    .filter((r) => (args.to ? r.eventDate <= args.to! : true));

  const bySource: Record<string, number> = {};
  for (const r of rows) bySource[r.sourceType] = (bySource[r.sourceType] || 0) + num(r.amount);

  const income = rows
    .filter((r) => r.sourceType !== "loss")
    .reduce((s, r) => s + num(r.amount), 0);
  const loss = rows
    .filter((r) => r.sourceType === "loss")
    .reduce((s, r) => s + num(r.amount), 0);

  return {
    income,
    loss,
    net: income - loss,
    bySourceType: bySource,
    records: rows
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
      .slice(0, 100)
      .map((r) => ({
        date: r.eventDate,
        sourceType: r.sourceType,
        description: r.description,
        amount: num(r.amount),
      })),
  };
}

async function getDepositSettingsTool() {
  const settingsAsc = await loadSettingsAsc();
  const current = settingsAsc[settingsAsc.length - 1];
  return {
    current: current
      ? {
          monthlyAmount: num(current.monthlyAmount),
          dueDay: current.dueDay,
          reminderDay: current.reminderDay,
          effectiveMonth: current.effectiveMonth,
        }
      : null,
    history: settingsAsc.map((s) => ({
      monthlyAmount: num(s.monthlyAmount),
      dueDay: s.dueDay,
      reminderDay: s.reminderDay,
      effectiveMonth: s.effectiveMonth,
      terminatedAt: s.terminatedAt,
    })),
  };
}

// ─── Dispatch ───────────────────────────────────────────────────────────

type Executor = (args: Record<string, unknown>) => Promise<unknown>;

const EXECUTORS: Record<string, Executor> = {
  list_members: (a) => listMembers(a as { search?: string }),
  get_financial_overview: () => getFinancialOverview(),
  get_deposit_status_for_month: (a) => getDepositStatusForMonth(a as { month?: string }),
  get_member_deposit_detail: (a) => getMemberDepositDetail(a as { member: string }),
  get_monthly_trends: (a) => getMonthlyTrends(a as { from?: string; to?: string }),
  get_outstanding_by_member: (a) => getOutstandingByMember(a as { month?: string }),
  list_payments: (a) => listPayments(a as { member?: string; from?: string; to?: string; limit?: number }),
  get_investments: (a) => getInvestments(a as { status?: string }),
  get_expenses: (a) => getExpenses(a as { from?: string; to?: string; category?: string }),
  get_revenue: (a) => getRevenue(a as { from?: string; to?: string }),
  get_deposit_settings: () => getDepositSettingsTool(),
};

/** Run a tool by name. Always resolves (errors are returned, not thrown). */
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const fn = EXECUTORS[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  try {
    return await fn(args || {});
  } catch (err) {
    console.error(`[PAI2 tool ${name}] failed:`, err);
    return { error: `Tool ${name} failed to run.` };
  }
}
