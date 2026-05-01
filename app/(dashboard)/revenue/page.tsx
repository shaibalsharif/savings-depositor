import { db } from "@/db/client";
import { revenueLosses } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { RevenueFilter } from "./revenue-filter";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ source?: string; type?: string; from?: string; to?: string }>;

const sourceTypeLabels: Record<string, string> = {
  bank_profit: "Bank Profit",
  investment_return: "Investment Return",
  business: "Business",
  loss: "Loss",
  other: "Other",
};

export default async function RevenuePage(props: { searchParams: SearchParams }) {
  await requireMember();
  const manager = await isManager();
  const sp = await props.searchParams;

  const sourceFilter = sp.source ?? "";
  const typeFilter = sp.type ?? ""; // "income" | "loss" | ""
  const fromFilter = sp.from ?? "";
  const toFilter = sp.to ?? "";

  const allRevenue = await db.select().from(revenueLosses).orderBy(desc(revenueLosses.eventDate));

  // Apply filters
  const filtered = allRevenue.filter((r) => {
    if (sourceFilter && r.sourceType !== sourceFilter) return false;
    if (typeFilter === "income" && Number(r.amount) < 0) return false;
    if (typeFilter === "loss" && Number(r.amount) >= 0) return false;
    if (fromFilter && r.eventDate < fromFilter + "-01") return false;
    if (toFilter && r.eventDate > toFilter + "-31") return false;
    return true;
  });

  const valid = filtered.filter((r) => !r.voided);
  const totalIncome = valid.filter((r) => Number(r.amount) > 0).reduce((sum, r) => sum + Number(r.amount), 0);
  const totalLoss = valid.filter((r) => Number(r.amount) < 0).reduce((sum, r) => sum + Number(r.amount), 0);
  const net = totalIncome + totalLoss;

  const isFiltered = sourceFilter || typeFilter || fromFilter || toFilter;

  const colDefs = [
    { id: "id", label: "ID", defaultHidden: true },
    { id: "date", label: "Date" },
    { id: "source", label: "Source" },
    { id: "description", label: "Description" },
    { id: "linked-inv", label: "Linked Inv." },
    { id: "amount", label: "Amount" },
    { id: "status", label: "Status" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Revenue & Losses" }]} />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue & Losses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Net: <span style={{ color: net >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
              {net >= 0 ? "+" : ""}৳{net.toLocaleString()}
            </span>
            {isFiltered && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ColumnConfigurator tableId="revenue-table" columns={colDefs} />
          {manager && (
            <Link
              href="/revenue/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
            >
              + Record Entry
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
        <RevenueFilter
          currentSource={sourceFilter}
          currentType={typeFilter}
          currentFrom={fromFilter}
          currentTo={toFilter}
        />
      </Suspense>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Net</div>
          <div className="text-2xl font-bold mt-1" style={{ color: net >= 0 ? "var(--green)" : "var(--red)" }}>
            {net >= 0 ? "+" : ""}৳{net.toLocaleString()}
          </div>
        </div>
        <div className="glass p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Income</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--green)" }}>+৳{totalIncome.toLocaleString()}</div>
        </div>
        <div className="glass p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Losses</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--red)" }}>৳{totalLoss.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="revenue-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-date">Date</th>
                <th className="col-source">Source</th>
                <th className="col-description">Description</th>
                <th className="col-linked-inv">Linked Inv.</th>
                <th className="col-amount">Amount</th>
                <th className="col-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const amount = Number(row.amount);
                return (
                  <tr key={row.id} style={{ opacity: row.voided ? 0.5 : 1 }}>
                    <td className="col-id font-mono text-xs text-muted-foreground">{row.entryId}</td>
                    <td className="col-date text-muted-foreground">{formatLocalDate(row.eventDate)}</td>
                    <td className="col-source">
                      <span className={`${amount >= 0 ? "badge-green" : "badge-red"} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                        {sourceTypeLabels[row.sourceType] ?? row.sourceType}
                      </span>
                    </td>
                    <td className="col-description font-medium max-w-[180px] truncate">{row.description}</td>
                    <td className="col-linked-inv text-muted-foreground font-mono text-xs">{row.linkedInvestmentId || "—"}</td>
                    <td className="col-amount font-semibold" style={{ color: amount >= 0 ? "var(--green)" : "var(--red)" }}>
                      {amount >= 0 ? "+" : ""}৳{amount.toLocaleString()}
                    </td>
                    <td className="col-status">
                      {row.voided ? (
                        <span className="badge-red inline-flex items-center px-2 py-0.5 rounded-full text-xs">Voided</span>
                      ) : (
                        <span className="badge-teal inline-flex items-center px-2 py-0.5 rounded-full text-xs">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {isFiltered ? "No entries match the current filters." : "No entries found."}{" "}
                    {manager && !isFiltered && <Link href="/revenue/new" style={{ color: "var(--teal)" }}>Record the first one →</Link>}
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
