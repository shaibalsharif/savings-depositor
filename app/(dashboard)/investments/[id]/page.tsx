import { requireManager } from "@/lib/auth";
import { getInvestmentWithShares } from "@/lib/queries/investment";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays, isPast } from "date-fns";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InvestmentShareDonut } from "@/components/charts/investment-share-donut";

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireManager();
  const { id } = await params;
  const data = await getInvestmentWithShares(id);

  if (!data) notFound();

  const { investment: inv, shares, linkedRevenue, summary } = data;

  const isOverdue = isPast(new Date(inv.expectedReturnDate)) && inv.status === "active";
  const daysActive = differenceInDays(
    inv.actualReturnDate ? new Date(inv.actualReturnDate) : new Date(),
    new Date(inv.investDate)
  );

  const statusColor =
    inv.status === "active"
      ? "var(--teal)"
      : inv.status === "matured"
      ? "var(--green)"
      : "var(--red)";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Investments", href: "/investments" },
          { label: inv.entryId },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{inv.recipient}</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{inv.entryId}</p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
        >
          {isOverdue ? "⚠ Overdue" : inv.status}
        </span>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Principal", value: `৳${Number(inv.principal).toLocaleString()}`, color: "var(--purple)" },
          { label: "Net Profit", value: `৳${summary.netRevenue.toLocaleString()}`, color: summary.netRevenue >= 0 ? "var(--green)" : "var(--red)" },
          { label: "Principal Returned", value: `৳${summary.principalReturned.toLocaleString()}`, color: summary.principalReturnedFully ? "var(--green)" : "var(--amber)" },
          { label: "Days Active", value: `${daysActive}d`, color: "var(--teal)" },
        ].map((s) => (
          <div key={s.label} className="glass p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Investment details */}
      <div className="glass p-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Invest Date:</span>{" "}
          <span className="font-medium">{format(new Date(inv.investDate), "dd MMM yyyy")}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Expected Return:</span>{" "}
          <span className="font-medium" style={isOverdue ? { color: "var(--red)" } : {}}>
            {format(new Date(inv.expectedReturnDate), "dd MMM yyyy")}
            {isOverdue && <span className="ml-2 text-xs font-bold">OVERDUE</span>}
          </span>
        </div>
        {inv.actualReturnDate && (
          <div>
            <span className="text-muted-foreground">Actual Return:</span>{" "}
            <span className="font-medium">{format(new Date(inv.actualReturnDate), "dd MMM yyyy")}</span>
          </div>
        )}
        {inv.note && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Note:</span>{" "}
            <span className="font-medium">{inv.note}</span>
          </div>
        )}
      </div>

      {/* Member Share Breakdown */}
      {shares.length > 0 && (
        <div className="glass p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Member Share Breakdown</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Based on each member&apos;s available balance at the time of investment ({format(new Date(inv.investDate), "dd MMM yyyy")})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Donut chart */}
            <InvestmentShareDonut shares={shares} />

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Member</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Balance at T</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Share</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Proj. Profit Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {shares.map((s, i) => (
                    <tr key={s.memberId} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.memberName}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ৳{s.balanceAtInvestment.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--teal)" }}>
                        {s.sharePercentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: summary.netRevenue >= 0 ? "var(--green)" : "var(--red)" }}>
                        ৳{((summary.netRevenue * s.sharePercentage) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue / Return events */}
      {linkedRevenue.length > 0 && (
        <div className="glass overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h2 className="text-lg font-bold">Revenue & Return Events</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {linkedRevenue.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-muted-foreground">{r.entryId}</td>
                  <td>{format(new Date(r.eventDate), "dd MMM yyyy")}</td>
                  <td>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          r.sourceType === "loss"
                            ? "rgba(239,68,68,0.15)"
                            : r.sourceType === "principal_return"
                            ? "rgba(59,130,246,0.15)"
                            : "rgba(34,197,94,0.15)",
                        color:
                          r.sourceType === "loss"
                            ? "var(--red)"
                            : r.sourceType === "principal_return"
                            ? "#3b82f6"
                            : "var(--green)",
                      }}
                    >
                      {r.sourceType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{r.description}</td>
                  <td
                    className="font-semibold"
                    style={{
                      color:
                        r.sourceType === "loss" ? "var(--red)" : "var(--green)",
                    }}
                  >
                    {r.sourceType === "loss" ? "−" : "+"}৳{Number(r.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex">
        <Link href="/investments" style={{ color: "var(--teal)", fontSize: 14 }}>
          ← Back to Investments
        </Link>
      </div>
    </div>
  );
}
