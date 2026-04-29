import { db } from "@/db/client";
import { payments, depositAllocations } from "@/db/schema";
import { requireMember } from "@/lib/auth";
import { format } from "date-fns";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";

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
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Deposits" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Deposits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {myPayments.filter((p) => !p.voided).length} valid payments — ৳{totalPaid.toLocaleString()} total contributed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ColumnConfigurator 
            tableId="my-deposits-table" 
            columns={[
              { id: "id", label: "Payment ID", defaultHidden: true },
              { id: "date", label: "Date" },
              { id: "amount", label: "Amount" },
              { id: "months", label: "Months Covered" },
              { id: "note", label: "Note" },
              { id: "status", label: "Status" }
            ]} 
          />
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
        <table id="my-deposits-table" className="data-table">
          <thead>
            <tr>
              <th className="col-id">Payment ID</th>
              <th className="col-date">Date</th>
              <th className="col-amount">Amount</th>
              <th className="col-months">Months Covered</th>
              <th className="col-note">Note</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {myPayments.map((p) => {
              const allocs = allocationsByPayment[p.paymentId] ?? [];
              return (
                <tr key={p.id} style={{ opacity: p.voided ? 0.5 : 1 }}>
                  <td className="col-id font-mono text-xs text-muted-foreground">{p.paymentId}</td>
                  <td className="col-date text-muted-foreground">{format(new Date(p.paymentDate), "dd MMM yyyy")}</td>
                  <td className="col-amount font-semibold" style={{ color: p.voided ? "hsl(var(--muted-foreground))" : "var(--teal)" }}>
                    ৳{Number(p.amountReceived).toLocaleString()}
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
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </td>
                  <td className="col-note text-muted-foreground">{p.note || "—"}</td>
                  <td className="col-status">
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
