import { db } from "@/db/client";
import { payments, depositAllocations } from "@/db/schema";
import { requireMember } from "@/lib/auth";
import { format } from "date-fns";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function MyDepositsPage() {
  const user = await requireMember();

  const myPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.memberId, user.id))
    .orderBy(desc(payments.paymentDate));

  const myAllocations = await db
    .select()
    .from(depositAllocations)
    .where(eq(depositAllocations.memberId, user.id));

  const allocationsByPayment = myAllocations.reduce((acc, a) => {
    if (!acc[a.paymentId]) acc[a.paymentId] = [];
    acc[a.paymentId].push(a);
    return acc;
  }, {} as Record<string, typeof myAllocations>);

  const totalPaid = myPayments
    .filter((p) => !p.voided)
    .reduce((sum, p) => sum + Number(p.amountReceived), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Deposits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {myPayments.filter((p) => !p.voided).length} valid payments — ৳{totalPaid.toLocaleString()} total contributed
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="glass p-5 flex items-center gap-6">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Contributed</div>
          <div className="text-3xl font-bold mt-1" style={{ color: "var(--teal)" }}>৳{totalPaid.toLocaleString()}</div>
        </div>
        <div className="h-10 w-px" style={{ background: "hsl(var(--border))" }} />
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Payments</div>
          <div className="text-3xl font-bold mt-1">{myPayments.filter((p) => !p.voided).length}</div>
        </div>
        <div className="h-10 w-px" style={{ background: "hsl(var(--border))" }} />
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Months Covered</div>
          <div className="text-3xl font-bold mt-1">{new Set(myAllocations.map((a) => a.forMonth)).size}</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Months Covered</th>
              <th>Note</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myPayments.map((p) => {
              const allocs = allocationsByPayment[p.paymentId] ?? [];
              return (
                <tr key={p.id} style={{ opacity: p.voided ? 0.5 : 1 }}>
                  <td className="font-mono text-xs text-muted-foreground">{p.paymentId}</td>
                  <td className="text-muted-foreground">{format(new Date(p.paymentDate), "dd MMM yyyy")}</td>
                  <td className="font-semibold" style={{ color: p.voided ? "hsl(var(--muted-foreground))" : "var(--teal)" }}>
                    ৳{Number(p.amountReceived).toLocaleString()}
                  </td>
                  <td>
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
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </td>
                  <td className="text-muted-foreground">{p.note || "—"}</td>
                  <td>
                    {p.voided ? (
                      <span className="badge-red inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        Voided
                      </span>
                    ) : (
                      <span className="badge-teal inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        Valid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {myPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No deposits found for your account yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
