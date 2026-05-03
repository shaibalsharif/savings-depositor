import { db } from "@/db/client";
import { expenses, investments } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { ExpensesFilter } from "./expenses-filter";
import { ExpensesTable } from "./ExpensesTable";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string; status?: string; from?: string; to?: string }>;

export default async function ExpensesPage(props: { searchParams: SearchParams }) {
  await requireMember();
  const manager = await isManager();
  const sp = await props.searchParams;

  const categoryFilter = sp.category ?? "";
  const statusFilter = sp.status ?? "";
  const fromFilter = sp.from ?? "";
  const toFilter = sp.to ?? "";

  const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  const allInvestments = await db.select().from(investments).orderBy(desc(investments.investDate));

  // Apply filters
  const filtered = allExpenses.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (statusFilter === "active" && e.voided) return false;
    if (statusFilter === "voided" && !e.voided) return false;
    if (fromFilter && e.expenseDate < fromFilter + "-01") return false;
    if (toFilter) {
      // "to" is YYYY-MM, include all days of that month
      const toEnd = toFilter + "-31";
      if (e.expenseDate > toEnd) return false;
    }
    return true;
  });

  const totalValid = filtered
    .filter((e) => !e.voided)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const categoryColors: Record<string, string> = {
    Food: "badge-teal",
    Event: "badge-purple",
    Materials: "badge-amber",
    "Bank Charge": "badge-red",
    Conveyance: "badge-green",
    Other: "",
  };

  const tableCols = [
    { id: "id", label: "ID", defaultHidden: true },
    { id: "date", label: "Date" },
    { id: "category", label: "Category" },
    { id: "description", label: "Description" },
    { id: "linked-inv", label: "Linked Investment" },
    { id: "amount", label: "Amount" },
    { id: "status", label: "Status" },
  ];

  const isFiltered = categoryFilter || statusFilter || fromFilter || toFilter;

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Expenses" }]} />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.filter((e) => !e.voided).length} active expenses — ৳{totalValid.toLocaleString()} total
            {isFiltered && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ColumnConfigurator tableId="expenses-table" columns={tableCols} />
          {manager && (
            <Link
              href="/expenses/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
            >
              + Record Expense
            </Link>
          )}
        </div>
      </div>

      {!manager && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
          style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "var(--purple)" }}
        >
          <span>👁</span>
          <span>Read-only view — contact the manager to record or modify entries.</span>
        </div>
      )}

      {/* Filters */}
      <Suspense>
        <ExpensesFilter
          currentCategory={categoryFilter}
          currentStatus={statusFilter}
          currentFrom={fromFilter}
          currentTo={toFilter}
        />
      </Suspense>

      <ExpensesTable
        filtered={filtered}
        isFiltered={isFiltered}
        manager={manager}
        totalValid={totalValid}
        availableInvestments={allInvestments}
      />
    </div>
  );
}
