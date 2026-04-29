import { db } from "@/db/client";
import { revenueLosses } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import Link from "next/link";
import { format } from "date-fns";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const sourceTypeLabels: Record<string, string> = {
  bank_profit: "Bank Profit",
  investment_return: "Investment Return",
  business: "Business",
  loss: "Loss",
  other: "Other",
};

export default async function RevenuePage() {
  await requireManager();

  const allRevenue = await db.select().from(revenueLosses).orderBy(desc(revenueLosses.eventDate));

  const valid = allRevenue.filter((r) => !r.voided);
  const totalIncome = valid.filter((r) => Number(r.amount) > 0).reduce((sum, r) => sum + Number(r.amount), 0);
  const totalLoss = valid.filter((r) => Number(r.amount) < 0).reduce((sum, r) => sum + Number(r.amount), 0);
  const net = totalIncome + totalLoss;

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Revenue & Losses" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue & Losses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Net: <span style={{ color: net >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
              {net >= 0 ? "+" : ""}৳{net.toLocaleString()}
            </span>
          </p>
        </div>
        <Link
          href="/revenue/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
        >
          + Record Entry
        </Link>
      </div>

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
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Source</th>
              <th>Description</th>
              <th>Linked Inv.</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allRevenue.map((row) => {
              const amount = Number(row.amount);
              return (
                <tr key={row.id} style={{ opacity: row.voided ? 0.5 : 1 }}>
                  <td className="font-mono text-xs text-muted-foreground">{row.entryId}</td>
                  <td className="text-muted-foreground">{format(new Date(row.eventDate), "dd MMM yyyy")}</td>
                  <td>
                    <span className={`${amount >= 0 ? "badge-green" : "badge-red"} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                      {sourceTypeLabels[row.sourceType] ?? row.sourceType}
                    </span>
                  </td>
                  <td className="font-medium max-w-[180px] truncate">{row.description}</td>
                  <td className="text-muted-foreground font-mono text-xs">{row.linkedInvestmentId || "—"}</td>
                  <td className="font-semibold" style={{ color: amount >= 0 ? "var(--green)" : "var(--red)" }}>
                    {amount >= 0 ? "+" : ""}৳{amount.toLocaleString()}
                  </td>
                  <td>
                    {row.voided ? (
                      <span className="badge-red inline-flex items-center px-2 py-0.5 rounded-full text-xs">Voided</span>
                    ) : (
                      <span className="badge-teal inline-flex items-center px-2 py-0.5 rounded-full text-xs">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {allRevenue.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No entries found.{" "}
                  <Link href="/revenue/new" style={{ color: "var(--teal)" }}>Record the first one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
