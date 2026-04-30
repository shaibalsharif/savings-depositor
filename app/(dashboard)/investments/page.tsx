import { db } from "@/db/client";
import { investments } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import Link from "next/link";
import { format, differenceInDays, isPast } from "date-fns";
import { formatLocalDate } from "@/lib/format-date";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";

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
        <div className="flex items-center gap-3">
          <ColumnConfigurator 
            tableId="investments-table" 
            columns={[
              { id: "id", label: "ID", defaultHidden: true },
              { id: "recipient", label: "Recipient" },
              { id: "principal", label: "Principal" },
              { id: "invest-date", label: "Invest Date" },
              { id: "expected-return", label: "Expected Return" },
              { id: "actual-return", label: "Actual Return" },
              { id: "days", label: "Days" },
              { id: "status", label: "Status" },
              { id: "actions", label: "Actions" }
            ]} 
          />
          <Link
            href="/investments/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
          >
            + New Investment
          </Link>
        </div>
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
              <th className="col-actions text-right">Actions</th>
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
                  <td className="col-actions text-right">
                    <Link
                      href={`/investments/${inv.entryId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-teal/20 hover:bg-teal/10"
                      style={{ color: "var(--teal)" }}
                    >
                      View Analysis
                    </Link>
                  </td>
                </tr>
              );
            })}
            {allInvestments.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground">
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
