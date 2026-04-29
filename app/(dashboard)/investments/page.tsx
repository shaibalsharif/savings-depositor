import { db } from "@/db/client";
import { investments } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import Link from "next/link";
import { format, differenceInDays, isPast } from "date-fns";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function InvestmentsPage() {
  await requireManager();

  const allInvestments = await db.select().from(investments).orderBy(desc(investments.investDate));

  const totalDeployed = allInvestments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + Number(i.principal), 0);
  const maturedCount = allInvestments.filter((i) => i.status === "matured").length;
  const activeCount = allInvestments.filter((i) => i.status === "active").length;

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Investments" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeCount} active · {maturedCount} matured · ৳{totalDeployed.toLocaleString()} deployed
          </p>
        </div>
        <Link
          href="/investments/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
        >
          + New Investment
        </Link>
      </div>

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
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Recipient</th>
              <th>Principal</th>
              <th>Invest Date</th>
              <th>Expected Return</th>
              <th>Actual Return</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allInvestments.map((inv) => {
              const isOverdue = isPast(new Date(inv.expectedReturnDate)) && inv.status === "active";
              const daysActive = differenceInDays(
                inv.actualReturnDate ? new Date(inv.actualReturnDate) : new Date(),
                new Date(inv.investDate)
              );
              return (
                <tr key={inv.id}>
                  <td className="font-mono text-xs text-muted-foreground">{inv.entryId}</td>
                  <td className="font-medium">{inv.recipient}</td>
                  <td className="font-semibold" style={{ color: "var(--purple)" }}>
                    ৳{Number(inv.principal).toLocaleString()}
                  </td>
                  <td className="text-muted-foreground">{format(new Date(inv.investDate), "dd MMM yyyy")}</td>
                  <td className={isOverdue ? "" : "text-muted-foreground"} style={isOverdue ? { color: "var(--red)" } : {}}>
                    {format(new Date(inv.expectedReturnDate), "dd MMM yyyy")}
                    {isOverdue && <span className="ml-2 text-xs font-medium" style={{ color: "var(--red)" }}>OVERDUE</span>}
                  </td>
                  <td className="text-muted-foreground">
                    {inv.actualReturnDate ? format(new Date(inv.actualReturnDate), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="text-muted-foreground">{daysActive}d</td>
                  <td>
                    <span
                      className={
                        inv.status === "active"
                          ? "badge-teal"
                          : inv.status === "matured"
                          ? "badge-green"
                          : "badge-red"
                      }
                      style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "999px", fontSize: 11, fontWeight: 600 }}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {allInvestments.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No investments recorded yet.{" "}
                  <Link href="/investments/new" style={{ color: "var(--teal)" }}>Add the first one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
