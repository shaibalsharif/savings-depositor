import { db } from "@/db/client";
import { investments } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { InvestmentsFilter } from "./investments-filter";
import { InvestmentsTable } from "./InvestmentsTable";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; from?: string; to?: string }>;

export default async function InvestmentsPage(props: { searchParams: SearchParams }) {
  await requireMember();
  const manager = await isManager();
  const sp = await props.searchParams;

  const statusFilter = sp.status ?? "";
  const fromFilter = sp.from ?? "";
  const toFilter = sp.to ?? "";

  const allInvestments = await db.select().from(investments).orderBy(desc(investments.investDate));

  // Apply filters
  const filtered = allInvestments.filter((i) => {
    if (i.deleted) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    if (fromFilter && i.investDate < fromFilter) return false;
    if (toFilter && i.investDate > toFilter) return false;
    return true;
  });

  const totalDeployed = filtered
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + Number(i.principal), 0);
  const maturedCount = filtered.filter((i) => i.status === "matured").length;
  const activeCount = filtered.filter((i) => i.status === "active").length;

  const isFiltered = statusFilter || fromFilter || toFilter;

  const colDefs = [
    { id: "id", label: "ID", defaultHidden: true },
    { id: "recipient", label: "Recipient" },
    { id: "principal", label: "Principal" },
    { id: "invest-date", label: "Invest Date" },
    { id: "expected-return", label: "Expected Return" },
    { id: "actual-return", label: "Actual Return" },
    { id: "days", label: "Days" },
    { id: "status", label: "Status" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Investments" }]} />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} active · {maturedCount} matured · ৳{totalDeployed.toLocaleString()} deployed
            {isFiltered && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ColumnConfigurator tableId="investments-table" columns={colDefs} />
          {manager && (
            <Link
              href="/investments/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
            >
              + New Investment
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
        <InvestmentsFilter
          currentStatus={statusFilter}
          currentFrom={fromFilter}
          currentTo={toFilter}
        />
      </Suspense>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Capital Deployed", value: `৳${totalDeployed.toLocaleString()}`, color: "var(--purple)" },
          { label: "Active", value: activeCount.toString(), color: "var(--teal)" },
          { label: "Matured", value: maturedCount.toString(), color: "var(--green)" },
        ].map((s) => (
          <div key={s.label} className="glass p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table Component */}
      <InvestmentsTable filtered={filtered} isFiltered={isFiltered} manager={manager} />
    </div>
  );
}
