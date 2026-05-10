import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { DepositsFilter } from "./deposits-filter";
import { DepositsViewTabs } from "./deposits-view-tabs";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { DepositsTable, DepositsTableSkeleton } from "./DepositsTable";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  member?: string;
  month?: string;
  status?: string;
  view?: string;
}>;

export default async function DepositsPage(props: { searchParams: SearchParams }) {
  const user = await requireMember();
  const manager = await isManager();
  const sp = await props.searchParams;

  // Default view: manager gets "month", member gets "mine"
  const view = (sp.view as "month" | "mine" | "all") ?? (manager ? "month" : "mine");

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthFilter = sp.month ?? (view === "month" ? currentMonthStr : "");
  const memberFilter = sp.member ?? "";
  const statusFilter = sp.status ?? "";

  const allMembers = manager
    ? await db.select({ userId: personalInfo.userId, name: personalInfo.name }).from(personalInfo)
    : [];

  const viewTitle =
    view === "mine" ? "My Deposits" :
    view === "all" ? "All Deposits" :
    `This Month — ${now.toLocaleString("default", { month: "long", year: "numeric" })}`;

  const showMemberCol = view !== "mine";
  const colDefs = [
    { id: "id", label: "Payment ID", defaultHidden: true },
    ...(showMemberCol ? [{ id: "member", label: "Member" }] : []),
    { id: "amount", label: "Amount" },
    { id: "date", label: "Date" },
    { id: "months", label: "Months Covered" },
    { id: "note", label: "Note" },
    { id: "status", label: "Status" },
    ...(manager ? [{ id: "actions", label: "Actions" }] : []),
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Deposits" }]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposits</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Manage and track all fund deposits
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ColumnConfigurator
            tableId="deposits-table"
            columns={colDefs}
          />
          {manager && (
            <Link
              href="/deposits/new"
              className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{ background: "var(--teal)", color: "hsl(222 47% 7%)" }}
            >
              + Record Deposit
            </Link>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <Suspense fallback={<div className="h-10 bg-muted/20 animate-pulse rounded-xl" />}>
        <DepositsViewTabs currentView={view} isManager={manager} />
      </Suspense>

      {/* Section heading for current view */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {viewTitle}
          </p>
          {view === "month" && !manager && (
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Showing all members&apos; deposits for this month
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      {(view === "all" || view === "month") && (
        <Suspense fallback={<div className="h-12 bg-muted/10 animate-pulse rounded-lg" />}>
          <DepositsFilter
            members={allMembers}
            currentMember={memberFilter}
            currentMonth={monthFilter}
            currentStatus={statusFilter}
            showMemberFilter={view === "all" && manager}
          />
        </Suspense>
      )}

      {/* Table with Suspense */}
      <Suspense key={`${view}-${monthFilter}-${memberFilter}-${statusFilter}`} fallback={<DepositsTableSkeleton />}>
        <DepositsTable
          view={view}
          manager={manager}
          userId={user.id}
          monthFilter={monthFilter}
          memberFilter={memberFilter}
          statusFilter={statusFilter}
        />
      </Suspense>
    </div>
  );
}
