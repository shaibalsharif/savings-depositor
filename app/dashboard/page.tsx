
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { RecentDeposits } from "@/components/dashboard/recent-deposits"
import { DepositChart } from "@/components/dashboard/deposit-chart"
import { MemberActivity } from "@/components/dashboard/member-activity"
import { WithdrawalPurposes } from "@/components/dashboard/withdrawal-purposes"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { MonthlyCard } from "@/components/dashboard/monthly-card"
import { RecentWithdrawals } from "@/components/dashboard/recent-withdrawals"

export default async function DashboardPage() {
  const { isAuthenticated } = getKindeServerSession();
  const isUserAuthenticated = await isAuthenticated();
  const { getUser } = getKindeServerSession();
  const user = await getUser();


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <BalanceCard />
        <MonthlyCard />
        <RecentDeposits />
        <RecentWithdrawals />
      </div>

    </div>
  )
}
