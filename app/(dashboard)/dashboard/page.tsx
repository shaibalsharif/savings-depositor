import { requireMember, isManager } from "@/lib/auth";
import { getManagerDashboardStats, getMemberDashboardStats } from "@/lib/queries/dashboard";
import { MonthlyCollectionChart, MemberCollectionChart } from "@/components/charts/CollectionCharts";
import { BalanceTrendChart } from "@/components/charts/TrendChart";
import { PaymentHeatmap } from "@/components/charts/PaymentHeatmap";
import { format } from "date-fns";
import { formatLocalDate } from "@/lib/format-date";
import Link from "next/link";
import { ProjectionTrigger } from "../projection/ProjectionTrigger";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent, href,
}: {
  label: string; value: string; sub?: string; accent?: string; href?: string;
}) {
  const card = (
    <div className="stat-card glass p-5 flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: accent ?? "hsl(var(--foreground))" }}>
        {value}
      </div>
      {sub && <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function ProgressBar({ pct, color = "var(--teal)" }: { pct: number; color?: string }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function SectionBox({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
async function ManagerDash() {
  const stats = await getManagerDashboardStats();
  const collectionPct = stats.currentMonthExpected > 0
    ? (stats.currentMonthAllocated / stats.currentMonthExpected) * 100
    : 0;
  const last12Months = stats.monthlyChart.map((d) => d.month.slice(-5));

  return (
    <div className="space-y-6">

      {/* ── Row 1: KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Fund Balance" value={`৳${stats.balance.toLocaleString()}`} accent="var(--teal)" sub="Liquid cash available" />
        <StatCard label="Total Collected" value={`৳${stats.totalCollected.toLocaleString()}`} sub={`From ${stats.membersCount} members`} />
        <StatCard label="Outstanding Dues" value={`৳${stats.totalOutstanding.toLocaleString()}`} accent="var(--red)" sub={`${stats.membersWithDues} members pending`} href="/deposits" />
        <StatCard label="Capital Deployed" value={`৳${stats.totalInvested.toLocaleString()}`} accent="var(--purple)" sub={`${stats.activeInvestmentsCount} active investments`} href="/investments" />
      </div>

      {/* ── Row 2: This month progress + Rev/Exp ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* This month */}
        <div className="glass p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                {format(new Date(), "MMMM yyyy")} — Monthly Collection
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold" style={{ color: "var(--teal)" }}>
                  ৳{stats.currentMonthAllocated.toLocaleString()}
                </span>
                <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  of ৳{stats.currentMonthExpected.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: collectionPct >= 100 ? "var(--green)" : "var(--amber)" }}>
                {Math.round(collectionPct)}%
              </div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>collected</div>
            </div>
          </div>
          <ProgressBar pct={collectionPct} />
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="text-xs">
              <div className="text-muted-foreground mb-1">Members paid this month</div>
              <div className="font-semibold text-base">
                {stats.memberPendings.length > 0 ? stats.membersCount - stats.membersWithDues : stats.membersCount}
                <span className="text-muted-foreground font-normal"> / {stats.membersCount}</span>
              </div>
            </div>
            <div className="text-xs">
              <div className="text-muted-foreground mb-1">Still outstanding this month</div>
              <div className="font-semibold text-base" style={{ color: "var(--red)" }}>
                ৳{Math.max(0, stats.currentMonthExpected - stats.currentMonthAllocated).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue summary */}
        <div className="glass p-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            Revenue & Losses
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: "Total Income", value: `+৳${stats.totalIncome.toLocaleString()}`, color: "var(--green)" },
              { label: "Total Losses", value: `৳${stats.totalLoss.toLocaleString()}`, color: "var(--red)" },
              { label: "Total Expenses", value: `-৳${stats.totalExpenses.toLocaleString()}`, color: "var(--amber)" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: "hsl(var(--muted-foreground))" }}>{row.label}</span>
                <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
            <div
              className="flex justify-between pt-3 border-t font-bold text-base"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <span>Net Revenue</span>
              <span style={{ color: stats.netRevenue >= 0 ? "var(--green)" : "var(--red)" }}>
                {stats.netRevenue >= 0 ? "+" : ""}৳{stats.netRevenue.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Next Investment Return
            </div>
            <div className="font-semibold mt-1" style={{ color: "var(--amber)" }}>
              {stats.nextReturn ? formatLocalDate(stats.nextReturn) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Monthly chart ── */}
      <SectionBox
        title="Monthly Collections & Expenses (Last 12 Months)"
        action={<Link href="/deposits" className="text-xs font-medium" style={{ color: "var(--teal)" }}>View All →</Link>}
      >
        <div className="px-5 pb-5">
          <MonthlyCollectionChart data={stats.monthlyChart} />
        </div>
      </SectionBox>

      {/* ── Row 3.5: Balance Trend Chart ── */}
      <SectionBox 
        title="Total Fund Balance Trend (All Time)"
        action={
          <ProjectionTrigger 
            currentBalance={stats.balance}
            memberCount={stats.membersCount}
            monthlyPerMember={Math.round(stats.currentMonthExpected / (stats.membersCount || 1)) || 2100}
            historicalData={stats.trendChart}
          />
        }
      >
        <div className="px-5 pb-5">
          <BalanceTrendChart data={stats.trendChart} />
        </div>
      </SectionBox>

      {/* ── Row 4: Heatmap + Pending dues ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Heatmap */}
        <div className="lg:col-span-3">
          <SectionBox title="Member Payment Pattern (Last 12 Months)">
            <div className="px-5 pb-5 overflow-x-auto">
              <PaymentHeatmap
                data={stats.heatmapData}
                months={stats.monthlyChart.map((_, i) => {
                  const d = new Date();
                  d.setDate(1);
                  d.setMonth(d.getMonth() - 11 + i);
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                })}
              />
            </div>
          </SectionBox>
        </div>

        {/* Outstanding Pendings */}
        <div className="lg:col-span-2">
          <SectionBox
            title="Outstanding Pendings"
            action={<Link href="/deposits/new" className="text-xs font-medium" style={{ color: "var(--teal)" }}>Record Deposit →</Link>}
          >
            <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
              {stats.memberPendings.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  🎉 All members are fully paid!
                </div>
              ) : (
                stats.memberPendings.slice(0, 8).map((m, idx) => (
                  <div key={m.memberId} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "hsl(var(--accent))", color: "hsl(var(--foreground))" }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--red)" }}>
                      ৳{m.due.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
            {stats.memberPendings.length > 8 && (
              <div className="px-5 py-3 border-t text-xs text-center" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                +{stats.memberPendings.length - 8} more with dues
              </div>
            )}
          </SectionBox>
        </div>
      </div>

    </div>
  );
}

// ─── Member Dashboard ─────────────────────────────────────────────────────────
async function MemberDash({ userId }: { userId: string }) {
  const stats = await getMemberDashboardStats(userId);
  const currentPct = stats.currentMonth.expected > 0
    ? (stats.currentMonth.paid / stats.currentMonth.expected) * 100
    : 0;

  // Month breakdown — show last 6 months
  const last6 = stats.monthBreakdown.slice(-6);

  return (
    <div className="space-y-6">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="My Balance Paid"
          value={`৳${stats.totalPaid.toLocaleString()}`}
          accent="var(--teal)"
          sub={`of ৳${stats.totalExpected.toLocaleString()} total required`}
        />
        <StatCard
          label="Outstanding Balance"
          value={`৳${stats.totalDue.toLocaleString()}`}
          accent={stats.totalDue > 0 ? "var(--red)" : "var(--green)"}
          sub={stats.totalDue > 0 ? "Please clear your dues" : "Fully paid up ✓"}
        />
        <StatCard
          label={`${format(new Date(), "MMMM")} Status`}
          value={stats.currentMonth.due === 0 ? "Cleared ✓" : `৳${stats.currentMonth.due.toLocaleString()} Due`}
          accent={stats.currentMonth.due === 0 ? "var(--green)" : "var(--amber)"}
          sub={`Paid ৳${stats.currentMonth.paid.toLocaleString()} of ৳${stats.currentMonth.expected.toLocaleString()}`}
        />
      </div>

      {/* ── This Month Progress ── */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            {format(new Date(), "MMMM yyyy")} — My Deposit Progress
          </div>
          <span className="text-xs font-medium" style={{ color: currentPct >= 100 ? "var(--green)" : "var(--amber)" }}>
            {Math.round(currentPct)}% complete
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" style={{ color: currentPct >= 100 ? "var(--green)" : "var(--teal)" }}>
            ৳{stats.currentMonth.paid.toLocaleString()}
          </span>
          <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            of ৳{stats.currentMonth.expected.toLocaleString()} required this month
          </span>
        </div>
        <ProgressBar pct={currentPct} color={currentPct >= 100 ? "var(--green)" : "var(--teal)"} />
      </div>

      {/* ── My Payment Chart ── */}
      <SectionBox title="My Payments — Last 12 Months">
        <div className="px-5 pb-5">
          <MemberCollectionChart data={stats.memberChart} />
        </div>
      </SectionBox>

      {/* ── Month Breakdown + Recent Payments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Month breakdown */}
        <SectionBox title="Monthly Deposit Status">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Required</th>
                <th>Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {last6.map((m) => (
                <tr key={m.month}>
                  <td className="font-mono text-xs">{m.month}</td>
                  <td>৳{m.expected.toLocaleString()}</td>
                  <td className="font-semibold" style={{ color: m.paid >= m.expected ? "var(--green)" : "var(--teal)" }}>
                    ৳{m.paid.toLocaleString()}
                  </td>
                  <td
                    className="font-semibold"
                    style={{ color: m.due > 0 ? "var(--red)" : "var(--green)" }}
                  >
                    {m.due > 0 ? `৳${m.due.toLocaleString()}` : "✓ Paid"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionBox>

        {/* Recent Payments */}
        <SectionBox
          title="Recent Payments"
          action={<Link href="/my-deposits" className="text-xs font-medium" style={{ color: "var(--teal)" }}>View All →</Link>}
        >
          {stats.recentPayments.length === 0 ? (
            <div className="px-5 pb-5 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No payments yet.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted-foreground">{formatLocalDate(p.paymentDate)}</td>
                    <td className="font-semibold" style={{ color: "var(--teal)" }}>
                      +৳{Number(p.amountReceived).toLocaleString()}
                    </td>
                    <td className="text-muted-foreground truncate max-w-[120px]">{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionBox>
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const user = await requireMember();
  const manager = await isManager();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {manager ? "Manager Dashboard" : "My Dashboard"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {manager
              ? "Full fund overview • member tracking • financial analytics"
              : `Welcome back, ${user.given_name ?? "Member"} — your deposit summary`}
          </p>
        </div>
        {manager && (
          <div className="flex gap-3">
            <Link
              href="/deposits/new"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--teal)", color: "hsl(222 47% 7%)" }}
            >
              + Record Deposit
            </Link>
          </div>
        )}
      </div>

      {manager ? <ManagerDash /> : <MemberDash userId={user.id} />}
    </div>
  );
}
