import { db } from "@/db/client";
import { revenueLosses, investments } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { RevenueFilter } from "./revenue-filter";
import { RevenueTable } from "./RevenueTable";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ source?: string; type?: string; from?: string; to?: string }>;

export default async function RevenuePage(props: { searchParams: SearchParams }) {
  await requireMember();
  const manager = await isManager();
  const sp = await props.searchParams;

  const sourceFilter = sp.source ?? "";
  const typeFilter = sp.type ?? ""; // "income" | "loss" | ""
  const fromFilter = sp.from ?? "";
  const toFilter = sp.to ?? "";

  const allRevenue = await db.select().from(revenueLosses).orderBy(desc(revenueLosses.eventDate));
  const activeInvestments = await db.select().from(investments).where(eq(investments.deleted, false));

  // Apply filters
  const filtered = allRevenue.filter((r) => {
    if (r.deleted) return false;
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
    ...(manager ? [{ id: "actions", label: "Actions" }] : []),
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

      {/* Table component */}
      <RevenueTable
        filtered={filtered}
        isFiltered={isFiltered}
        manager={manager}
        availableInvestments={activeInvestments}
      />
    </div>
  );
}
