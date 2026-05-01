import { db } from "@/db/client";
import { investments } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { differenceInDays, isPast } from "date-fns";
import { formatLocalDate } from "@/lib/format-date";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { InvestmentsFilter } from "./investments-filter";
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
    ...(manager ? [{ id: "actions", label: "Actions" }] : []),
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

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="investments-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-recipient">Recipient</th>
                <th className="col-principal">Principal</th>
                <th className="col-invest-date">Invest Date</th>
                <th className="col-expected-return">Expected Return</th>
                <th className="col-actual-return">Actual Return</th>
                <th className="col-days">Days</th>
                <th className="col-status">Status</th>
                {manager && <th className="col-actions text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const isOverdue = isPast(new Date(inv.expectedReturnDate)) && inv.status === "active";
                const daysActive = differenceInDays(
                  inv.actualReturnDate ? new Date(inv.actualReturnDate) : new Date(),
                  new Date(inv.investDate)
                );
                return (
                  <tr key={inv.id}>
                    <td className="col-id font-mono text-xs">
                      <Link href={`/investments/${inv.entryId}`} style={{ color: "var(--teal)" }} className="hover:underline">
                        {inv.entryId}
                      </Link>
                    </td>
                    <td className="col-recipient font-medium">
                      <Link href={`/investments/${inv.entryId}`} className="hover:underline">{inv.recipient}</Link>
                    </td>
                    <td className="col-principal font-semibold" style={{ color: "var(--purple)" }}>
                      ৳{Number(inv.principal).toLocaleString()}
                    </td>
                    <td className="col-invest-date text-muted-foreground">{formatLocalDate(inv.investDate)}</td>
                    <td className={`col-expected-return ${isOverdue ? "" : "text-muted-foreground"}`} style={isOverdue ? { color: "var(--red)" } : {}}>
                      {formatLocalDate(inv.expectedReturnDate)}
                      {isOverdue && <span className="ml-2 text-xs font-medium" style={{ color: "var(--red)" }}>OVERDUE</span>}
                    </td>
                    <td className="col-actual-return text-muted-foreground">
                      {inv.actualReturnDate ? formatLocalDate(inv.actualReturnDate) : "—"}
                    </td>
                    <td className="col-days text-muted-foreground">{daysActive}d</td>
                    <td className="col-status">
                      <span
                        className={inv.status === "active" ? "badge-teal" : inv.status === "matured" ? "badge-green" : "badge-red"}
                        style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "999px", fontSize: 11, fontWeight: 600 }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    {manager && (
                      <td className="col-actions text-right">
                        <Link
                          href={`/investments/${inv.entryId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-teal/20 hover:bg-teal/10"
                          style={{ color: "var(--teal)" }}
                        >
                          View Analysis
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={manager ? 9 : 8} className="py-12 text-center text-muted-foreground">
                    {isFiltered ? "No investments match the current filters." : "No investments recorded yet."}{" "}
                    {manager && !isFiltered && <Link href="/investments/new" style={{ color: "var(--teal)" }}>Add the first one →</Link>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
