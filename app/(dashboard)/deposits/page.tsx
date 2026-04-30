import { db } from "@/db/client";
import { payments, personalInfo, depositAllocations } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { eq, desc } from "drizzle-orm";
import { DepositsFilter } from "./deposits-filter";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";

export const dynamic = "force-dynamic"; // always fetch fresh — webhook updates must be visible immediately

type SearchParams = Promise<{ member?: string; month?: string; status?: string }>;

export default async function DepositsPage(props: { searchParams: SearchParams }) {
  const user = await requireMember();
  const manager = await isManager();
  const sp = await props.searchParams;

  const memberFilter = sp.member ?? "";
  const monthFilter = sp.month ?? "";
  const statusFilter = sp.status ?? "";

  // Fetch all members for filter dropdown (manager only)
  const allMembers = manager
    ? await db.select({ userId: personalInfo.userId, name: personalInfo.name }).from(personalInfo)
    : [];

  // Fetch payments - manager sees all, member sees own
  let query = db
    .select({ payment: payments, member: personalInfo })
    .from(payments)
    .leftJoin(personalInfo, eq(payments.memberId, personalInfo.userId))
    .orderBy(desc(payments.paymentDate))
    .$dynamic();

  // Apply filters in app layer (simpler given Drizzle dynamic query limitations)
  const raw = await query;

  const filtered = raw.filter((r) => {
    if (!manager && r.payment.memberId !== user.id) return false;
    if (memberFilter && r.payment.memberId !== memberFilter) return false;
    if (statusFilter === "valid" && r.payment.voided) return false;
    if (statusFilter === "voided" && !r.payment.voided) return false;
    // Month filter: check if payment has an allocation for this month
    return true;
  });

  // For month filter, we need to check allocations
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

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: manager ? "All Deposits" : "My Deposits" }]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {manager ? "All Deposits" : "My Deposits"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {displayRows.length} records · ৳{totalValid.toLocaleString()} collected
            {(memberFilter || monthFilter || statusFilter) && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ColumnConfigurator 
            tableId="deposits-table" 
            columns={[
              { id: "id", label: "Payment ID", defaultHidden: true },
              ...(manager ? [{ id: "member", label: "Member" }] : []),
              { id: "amount", label: "Amount" },
              { id: "date", label: "Date" },
              { id: "months", label: "Months Covered" },
              { id: "note", label: "Note" },
              { id: "status", label: "Status" },
              ...(manager ? [{ id: "actions", label: "Actions" }] : [])
            ]} 
          />
          {manager && (
            <Link
              href="/deposits/new"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--teal)", color: "hsl(222 47% 7%)" }}
            >
              + Record Deposit
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <DepositsFilter
          members={allMembers}
          currentMember={memberFilter}
          currentMonth={monthFilter}
          currentStatus={statusFilter}
        />
      </Suspense>

      {/* Table */}
      <div className="glass overflow-hidden">
        <table id="deposits-table" className="data-table">
          <thead>
            <tr>
              <th className="col-id">Payment ID</th>
              {manager && <th className="col-member">Member</th>}
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
                  {manager && (
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
                <td colSpan={manager ? 8 : 6} className="py-12 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {memberFilter || monthFilter || statusFilter
                    ? "No deposits match the current filters."
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
