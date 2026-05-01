import { db } from "@/db/client";
import { payments, personalInfo, depositAllocations } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { eq, desc } from "drizzle-orm";
import { DepositsFilter } from "./deposits-filter";
import { DepositsViewTabs } from "./deposits-view-tabs";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";

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

  // Determine view mode: default to "month"
  // manager gets all 3 tabs; member gets "month" and "mine"
  const view = (sp.view as "month" | "mine" | "all") ?? "month";

  // Default month to current month when in "month" view and no month param
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthFilter = sp.month ?? (view === "month" ? currentMonthStr : "");
  const memberFilter = sp.member ?? "";
  const statusFilter = sp.status ?? "";

  // Fetch all members for filter dropdown (manager only, all-members view)
  const allMembers = manager
    ? await db.select({ userId: personalInfo.userId, name: personalInfo.name }).from(personalInfo)
    : [];

  // Fetch payments based on view mode
  const raw = await db
    .select({ payment: payments, member: personalInfo })
    .from(payments)
    .leftJoin(personalInfo, eq(payments.memberId, personalInfo.userId))
    .orderBy(desc(payments.paymentDate));

  // Apply view mode + filters
  let filtered = raw.filter((r) => {
    // "mine" view: only current user
    if (view === "mine") return r.payment.memberId === user.id;
    // non-manager: always scoped to own data unless "month" view
    if (!manager && view === "month") {
      // members see all members in current month (transparent view)
      // nothing to filter here — all members are visible
    }
    if (!manager && view === "all") return r.payment.memberId === user.id;
    // manager "all" view: apply optional member filter
    if (view === "all" && memberFilter) return r.payment.memberId === memberFilter;
    return true;
  });

  // Status filter
  if (statusFilter === "valid") filtered = filtered.filter((r) => !r.payment.voided);
  if (statusFilter === "voided") filtered = filtered.filter((r) => r.payment.voided);

  // Month filter (applied to allocations)
  let displayRows = filtered;
  if (monthFilter) {
    const monthAllocs = await db
      .select()
      .from(depositAllocations)
      .where(eq(depositAllocations.forMonth, monthFilter));
    const paymentIdsForMonth = new Set(monthAllocs.map((a) => a.paymentId));
    displayRows = filtered.filter((r) => paymentIdsForMonth.has(r.payment.paymentId));
  }

  const totalValid = displayRows
    .filter((r) => !r.payment.voided)
    .reduce((s, r) => s + Number(r.payment.amountReceived), 0);

  // Columns based on view
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

  const viewTitle =
    view === "mine" ? "My Deposits" :
    view === "all" ? "All Deposits" :
    `This Month — ${now.toLocaleString("default", { month: "long", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Deposits" }]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposits</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {displayRows.length} records · ৳{totalValid.toLocaleString()} collected
            {(memberFilter || monthFilter || statusFilter) && " (filtered)"}
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
      <Suspense>
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

      {/* Filters — show based on view */}
      {(view === "all" || view === "month") && (
        <Suspense>
          <DepositsFilter
            members={allMembers}
            currentMember={memberFilter}
            currentMonth={monthFilter}
            currentStatus={statusFilter}
            showMemberFilter={view === "all" && manager}
          />
        </Suspense>
      )}

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="deposits-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">Payment ID</th>
                {showMemberCol && <th className="col-member">Member</th>}
                <th className="col-amount">Amount</th>
                <th className="col-date">Date</th>
                <th className="col-months">Months Covered</th>
                <th className="col-note">Note</th>
                <th className="col-status">Status</th>
                {manager && <th className="col-actions text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(async (row) => {
                const allocs = await db
                  .select()
                  .from(depositAllocations)
                  .where(eq(depositAllocations.paymentId, row.payment.paymentId));

                return (
                  <tr key={row.payment.id} style={{ opacity: row.payment.voided ? 0.55 : 1 }}>
                    <td className="col-id font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {row.payment.paymentId}
                    </td>
                    {showMemberCol && (
                      <td className="col-member font-medium">
                        {row.member?.name ?? <span className="italic" style={{ color: "hsl(var(--muted-foreground))" }}>Unknown</span>}
                      </td>
                    )}
                    <td className="col-amount">
                      <span className="font-semibold" style={{ color: row.payment.voided ? "hsl(var(--muted-foreground))" : "var(--teal)" }}>
                        ৳{Number(row.payment.amountReceived).toLocaleString()}
                      </span>
                    </td>
                    <td className="col-date" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {formatLocalDate(row.payment.paymentDate)}
                    </td>
                    <td className="col-months">
                      <div className="flex flex-wrap gap-1">
                        {allocs.length > 0
                          ? allocs.map((a) => (
                              <span
                                key={a.id}
                                className="badge-purple inline-flex items-center px-2 py-0.5 rounded text-xs font-mono"
                              >
                                {a.forMonth}
                              </span>
                            ))
                          : <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td className="col-note truncate" style={{ color: "hsl(var(--muted-foreground))", maxWidth: 140 }}>
                      {row.payment.note || "—"}
                    </td>
                    <td className="col-status">
                      {row.payment.voided ? (
                        <span className="badge-red inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">Voided</span>
                      ) : (
                        <span className="badge-teal inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">Valid</span>
                      )}
                    </td>
                    {manager && (
                      <td className="col-actions text-right">
                        {!row.payment.voided && (
                          <Link
                            href={`/deposits/${row.payment.paymentId}/edit`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: "var(--teal)" }}
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {displayRows.length === 0 && (
                <tr>
                  <td colSpan={manager ? (showMemberCol ? 8 : 7) : (showMemberCol ? 7 : 6)} className="py-12 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {memberFilter || monthFilter || statusFilter
                      ? "No deposits match the current filters."
                      : view === "mine"
                      ? "You haven't made any deposits yet."
                      : "No deposits recorded yet."}{" "}
                    {manager && !memberFilter && !monthFilter && !statusFilter && (
                      <Link href="/deposits/new" style={{ color: "var(--teal)" }}>Record the first one →</Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals footer */}
      {displayRows.length > 0 && (
        <div className="glass px-6 py-4 flex justify-between text-sm">
          <span style={{ color: "hsl(var(--muted-foreground))" }}>
            Showing {displayRows.length} records
          </span>
          <span className="font-semibold">
            Total Valid: <span style={{ color: "var(--teal)" }}>৳{totalValid.toLocaleString()}</span>
          </span>
        </div>
      )}
    </div>
  );
}
