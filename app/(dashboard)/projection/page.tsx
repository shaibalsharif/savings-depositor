import { requireMember } from "@/lib/auth";
import { getManagerDashboardStats } from "@/lib/queries/dashboard";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProjectionSimulator } from "./ProjectionSimulator";
import { db } from "@/db/client";
import { depositSettings, personalInfo } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProjectionPage() {
  await requireMember();

  const [stats, settings, members] = await Promise.all([
    getManagerDashboardStats(),
    db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth)),
    db.select().from(personalInfo),
  ]);

  // Get current monthly deposit amount (latest active setting)
  const sortedSettings = [...settings].sort((a, b) =>
    a.effectiveMonth.localeCompare(b.effectiveMonth)
  );
  const latestSetting = sortedSettings[sortedSettings.length - 1];
  const currentMonthlyPerMember = latestSetting ? Number(latestSetting.monthlyAmount) : 500;
  const memberCount = members.length;
  const currentAnnualDeposits = currentMonthlyPerMember * memberCount * 12;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Fund Projection" }]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fund Projection Simulator</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Simulate future fund growth based on deposits, investments &amp; expenses · save up to 3 scenarios
        </p>
      </div>

      <ProjectionSimulator
        currentBalance={stats.balance}
        currentAnnualDeposits={currentAnnualDeposits}
        memberCount={memberCount}
        monthlyPerMember={currentMonthlyPerMember}
        historicalData={stats.trendChart}
      />
    </div>
  );
}
