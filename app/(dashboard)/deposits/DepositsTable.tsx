import { db } from "@/db/client";
import { payments, personalInfo, depositAllocations } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { formatLocalDate } from "@/lib/format-date";
import Link from "next/link";

interface DepositsTableProps {
  view: "month" | "mine" | "all";
  manager: boolean;
  userId: string;
  monthFilter: string;
  memberFilter: string;
  statusFilter: string;
}

export async function DepositsTable({
  view,
  manager,
  userId,
  monthFilter,
  memberFilter,
  statusFilter,
}: DepositsTableProps) {
  // Fetch raw data
  const raw = await db
    .select({ payment: payments, member: personalInfo })
    .from(payments)
    .leftJoin(personalInfo, eq(payments.memberId, personalInfo.userId))
    .orderBy(desc(payments.paymentDate));

  // Filter based on view mode
  let filtered = raw.filter((r) => {
    if (view === "mine") return r.payment.memberId === userId;
    if (view === "all" && memberFilter) return r.payment.memberId === memberFilter;
    return true;
  });

  if (statusFilter === "valid") filtered = filtered.filter((r) => !r.payment.voided);
  if (statusFilter === "voided") filtered = filtered.filter((r) => r.payment.voided);

  let displayRows = filtered;
  if (monthFilter) {
    const monthAllocs = await db
      .select()
      .from(depositAllocations)
      .where(eq(depositAllocations.forMonth, monthFilter));
    const paymentIdsForMonth = new Set(monthAllocs.map((a) => a.paymentId));
    displayRows = filtered.filter((r) => paymentIdsForMonth.has(r.payment.paymentId));
  }

  const showMemberCol = view !== "mine";

  return (
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
  );
}

export function DepositsTableSkeleton() {
  return (
    <div className="glass overflow-hidden animate-pulse">
      <div className="h-12 border-b border-border/40 bg-muted/10" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 border-b border-border/20 flex items-center px-4 gap-4">
          <div className="h-4 bg-muted/30 rounded w-1/6" />
          <div className="h-4 bg-muted/30 rounded w-1/4" />
          <div className="h-4 bg-muted/30 rounded w-1/6" />
          <div className="h-4 bg-muted/30 rounded w-1/5" />
          <div className="h-6 bg-muted/20 rounded-full w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
