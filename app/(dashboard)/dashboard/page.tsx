import { requireMember, isManager } from "@/lib/auth";
import { getManagerDashboardStats, getMemberDashboardStats } from "@/lib/queries/dashboard";
import { MonthlyCollectionChart, MemberCollectionChart } from "@/components/charts/CollectionCharts";
import { BalanceTrendChart } from "@/components/charts/TrendChart";
import { PaymentHeatmap } from "@/components/charts/PaymentHeatmap";
import { format } from "date-fns";
import { formatLocalDate } from "@/lib/format-date";
import Link from "next/link";
import { PaymentPatternSection } from "./PaymentPatternSection";
import { ProjectionTrigger } from "../projection/ProjectionTrigger";
import { OutstandingPendingsSection } from "./OutstandingPendingsSection";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent, href,
}: {
  label: string; value: string; sub?: string; accent?: string; href?: string;
}) {
  const card = (
    <div className="stat-card glass p-3 sm:p-5 flex flex-col gap-1.5 justify-between min-h-[95px] sm:min-h-[110px]">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground line-clamp-1">
        {label}
      </div>
      <div className="text-base sm:text-2xl md:text-3xl font-bold tracking-tight truncate" style={{ color: accent ?? "hsl(var(--foreground))" }}>
        {value}
      </div>
      {sub && <div className="text-[9px] sm:text-xs text-muted-foreground line-clamp-1 leading-tight">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{card}</Link> : card;
}

function SectionBox({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-4 sm:px-5 sm:pt-5 sm:pb-3 flex-wrap gap-2">
        <h2 className="text-xs sm:text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
async function ManagerDash() {
  const stats = await getManagerDashboardStats();
  const collectionPct = stats.currentMonthExpected > 0
    ? (stats.currentMonthAllocated / stats.currentMonthExpected) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* ── Row 1: KPIs (2x2 grid on all small devices, 4 cols on desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Fund Balance" value={`৳${stats.balance.toLocaleString()}`} accent="var(--teal)" sub="Liquid cash available" />
        <StatCard label="Total Collected" value={`৳${stats.totalCollected.toLocaleString()}`} sub={`From ${stats.membersCount} members`} />
        <StatCard label="Outstanding Dues" value={`৳${stats.totalOutstanding.toLocaleString()}`} accent="var(--red)" sub={`${stats.membersWithDues} members pending`} href="/deposits" />
        <StatCard label="Capital Deployed" value={`৳${stats.totalInvested.toLocaleString()}`} accent="var(--purple)" sub={`${stats.activeInvestmentsCount} active investments`} href="/investments" />
      </div>

      {/* ── Row 2: This month progress + Rev/Exp (Flex row side-by-side on all screens) ── */}
      <div className="flex flex-row gap-3 sm:gap-4 w-full justify-between items-stretch">
        {/* Monthly Collection with vertical progress bar */}
        <div className="glass p-3 sm:p-5 flex-1 flex flex-col justify-between gap-3 min-w-[130px] sm:min-w-[200px]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {format(new Date(), "MMMM yyyy")}
              </div>
              <div className="text-[9px] sm:text-xs text-muted-foreground font-normal leading-tight">Monthly Collection</div>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-extrabold" style={{ color: collectionPct >= 100 ? "var(--green)" : "var(--amber)" }}>
                {Math.round(collectionPct)}%
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 h-full">
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-1 sm:gap-2 justify-between sm:justify-start">
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-base sm:text-3xl font-extrabold text-[var(--teal)]">
                    ৳{stats.currentMonthAllocated.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-sm text-muted-foreground">
                    of ৳{stats.currentMonthExpected.toLocaleString()}
                  </span>
                </div>

                {/* Mobile ONLY: Vertical progress bar next to numbers */}
                <div className="sm:hidden w-1.5 bg-muted rounded-full overflow-hidden flex flex-col justify-end h-[35px] flex-shrink-0 select-none">
                  <div
                    className="rounded-full transition-all duration-500 ease-in-out"
                    style={{ height: `${Math.min(collectionPct, 100)}%`, background: "var(--teal)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 border-t border-dashed pt-2">
                <div className="text-[10px] sm:text-xs">
                  <div className="text-muted-foreground">Paid</div>
                  <div className="font-semibold text-xs sm:text-base">
                    {stats.memberPendings.length > 0 ? stats.membersCount - stats.membersWithDues : stats.membersCount}
                    <span className="text-muted-foreground font-normal"> / {stats.membersCount}</span>
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs">
                  <div className="text-muted-foreground">Dues</div>
                  <div className="font-semibold text-xs sm:text-base text-[var(--red)]">
                    ৳{Math.max(0, stats.currentMonthExpected - stats.currentMonthAllocated).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Larger views ONLY: Horizontal progress bar */}
              <div className="hidden sm:block w-full bg-muted rounded-full overflow-hidden h-2 select-none mt-4">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${Math.min(collectionPct, 100)}%`, background: "var(--teal)" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue summary */}
        <div className="glass p-3 sm:p-5 w-[42%] sm:w-[35%] flex flex-col justify-between gap-3 flex-shrink-0 select-none">
          <div>
            <div className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Revenue
            </div>
            <div className="text-[9px] sm:text-xs text-muted-foreground font-normal leading-tight">Total Overview</div>
          </div>

          <div className="space-y-1 text-xs">
            {[
              { label: "Income", value: `+৳${stats.totalIncome.toLocaleString()}`, color: "var(--green)" },
              { label: "Losses", value: `৳${stats.totalLoss.toLocaleString()}`, color: "var(--red)" },
              { label: "Expenses", value: `-৳${stats.totalExpenses.toLocaleString()}`, color: "var(--amber)" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[10px] sm:text-sm">
                <span className="text-muted-foreground truncate max-w-[55px] sm:max-w-none">{row.label}</span>
                <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
            <div
              className="flex justify-between pt-1.5 border-t font-bold text-[10px] sm:text-base mt-1"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <span className="truncate max-w-[55px] sm:max-w-none">Net Rev</span>
              <span style={{ color: stats.netRevenue >= 0 ? "var(--green)" : "var(--red)" }}>
                {stats.netRevenue >= 0 ? "+" : ""}৳{stats.netRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Monthly chart ── */}
      <SectionBox
        title="Monthly Collections & Expenses (Last 12 Months)"
        action={<Link href="/deposits" className="text-xs font-medium text-[var(--teal)]">View All →</Link>}
      >
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
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
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <BalanceTrendChart data={stats.trendChart} />
        </div>
      </SectionBox>

      {/* ── Row 4: Heatmap + Pending dues ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Heatmap */}
        <div className="lg:col-span-3">
          <PaymentPatternSection initialData={stats.heatmapData} />
        </div>

        {/* Outstanding Pendings Section Component */}
        <div className="lg:col-span-2 select-none h-full">
          <OutstandingPendingsSection
            memberPendings={stats.memberPendings}
            totalOutstanding={stats.totalOutstanding}
          />
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

      {/* ── KPIs (2x2 Grid on mobile, 3 cols on desktop) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="My Balance Paid"
          value={`৳${stats.totalPaid.toLocaleString()}`}
          accent="var(--teal)"
          sub={`of ৳${stats.totalExpected.toLocaleString()} required`}
        />
        <StatCard
          label="Outstanding Balance"
          value={`৳${stats.totalDue.toLocaleString()}`}
          accent={stats.totalDue > 0 ? "var(--red)" : "var(--green)"}
          sub={stats.totalDue > 0 ? "Please clear your dues" : "Fully paid up ✓"}
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard
            label={`${format(new Date(), "MMMM")} Status`}
            value={stats.currentMonth.due === 0 ? "Cleared ✓" : `৳${stats.currentMonth.due.toLocaleString()} Due`}
            accent={stats.currentMonth.due === 0 ? "var(--green)" : "var(--amber)"}
            sub={`Paid ৳${stats.currentMonth.paid.toLocaleString()} of ৳${stats.currentMonth.expected.toLocaleString()}`}
          />
        </div>
      </div>

      {/* ── This Month Progress ── */}
      <div className="glass p-4 sm:p-5 space-y-4 select-none">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {format(new Date(), "MMMM yyyy")} — My Deposit Progress
          </div>
          <span className="text-xs font-medium" style={{ color: currentPct >= 100 ? "var(--green)" : "var(--amber)" }}>
            {Math.round(currentPct)}% complete
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold" style={{ color: currentPct >= 100 ? "var(--green)" : "var(--teal)" }}>
            ৳{stats.currentMonth.paid.toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">
            of ৳{stats.currentMonth.expected.toLocaleString()} required this month
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${Math.min(currentPct, 100)}%`, background: currentPct >= 100 ? "var(--green)" : "var(--teal)" }} />
        </div>
      </div>

      {/* ── My Payment Chart ── */}
      <SectionBox title="My Payments — Last 12 Months">
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <MemberCollectionChart data={stats.memberChart} />
        </div>
      </SectionBox>

      {/* ── Month Breakdown + Recent Payments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Month breakdown */}
        <SectionBox title="Monthly Deposit Status">
          <div className="overflow-x-auto">
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
          </div>
        </SectionBox>

        {/* Recent Payments */}
        <SectionBox
          title="Recent Payments"
          action={<Link href="/my-deposits" className="text-xs font-medium text-[var(--teal)]">View All →</Link>}
        >
          {stats.recentPayments.length === 0 ? (
            <div className="p-4 sm:p-5 text-center text-sm text-muted-foreground">
              No payments yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <td className="text-muted-foreground text-xs">{formatLocalDate(p.paymentDate)}</td>
                      <td className="font-semibold text-xs text-[var(--teal)]">
                        +৳{Number(p.amountReceived).toLocaleString()}
                      </td>
                      <td className="text-muted-foreground text-xs truncate max-w-[120px]">{p.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {manager ? "Manager Dashboard" : "My Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-muted-foreground">
            {manager
              ? "Full fund overview • member tracking • financial analytics"
              : `Welcome back, ${user.given_name ?? "Member"} — your deposit summary`}
          </p>
        </div>
        {manager && (
          <div className="flex gap-3">
            <Link
              href="/deposits/new"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap bg-[var(--teal)] text-[hsl(222 47% 7%)] hover:opacity-90 transition shadow flex-shrink-0 text-center"
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
