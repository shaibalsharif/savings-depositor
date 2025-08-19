import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getDashboardData } from "@/lib/actions/dashboard/dashboard";
import YourDashboardCard from "@/components/dashboard/YourDashboardCard";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { MonthlyCard } from "@/components/dashboard/monthly-card";
import { RecentDeposits } from "@/components/dashboard/recent-deposits";
import { RecentWithdrawals } from "@/components/dashboard/recent-withdrawals";
import MonthlyCollectionChart from "@/components/dashboard/MonthlyCollectionChart";
import OutstandingPendings from "@/components/dashboard/OutstandingPendings";
import PaymentPatternHeatmap from "@/components/dashboard/PaymentPatternHeatmap";
import { fetchAllUsers } from "@/lib/actions/users/users";

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return <div>Please log in.</div>;
  }

  const [dashboardDataResult, usersResult] = await Promise.all([
    getDashboardData(user.id),
    fetchAllUsers(),
  ]);

  if ("error" in dashboardDataResult) {
    return <div>Failed to load dashboard data.</div>;
  }
  if (!Array.isArray(usersResult)) {
    return <div>Failed to load user data.</div>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <YourDashboardCard data={dashboardDataResult} />
        <BalanceCard data={dashboardDataResult} />
        <MonthlyCard data={dashboardDataResult} />
        <RecentDeposits data={dashboardDataResult.recentDeposits} users={usersResult} />
        <RecentWithdrawals data={dashboardDataResult.recentWithdrawals} users={usersResult} />

      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <OutstandingPendings
          outstandingUsers={dashboardDataResult.outstandingUsers}
          totalOutstanding={dashboardDataResult.totalOutstanding}
          monthlyDepositAmount={dashboardDataResult.monthlyDepositAmount} // <-- Pass the new prop
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyCollectionChart data={dashboardDataResult.monthlyCollectionChartData} />
        <PaymentPatternHeatmap data={dashboardDataResult.paymentPatternData} users={dashboardDataResult.allUsers} />
      </div>
    </div>
  )
}