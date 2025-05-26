
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { RecentDeposits } from "@/components/dashboard/recent-deposits"
import { DepositChart } from "@/components/dashboard/deposit-chart"
import { MemberActivity } from "@/components/dashboard/member-activity"
import { WithdrawalPurposes } from "@/components/dashboard/withdrawal-purposes"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export default async function DashboardPage() {
const {isAuthenticated} = getKindeServerSession();
const isUserAuthenticated = await isAuthenticated();
const {getUser} = getKindeServerSession();
const user = await getUser();


//FETCH BALANCE DATA
//FETCH MEMBER DATA
//TOAT DEPOIST OF MONTH ALSO PERCENTAGE
//FETCH RECENT DEPOSITS
//FETCH RECENT WITHDRAWALS
//FETCH DEPOSIT TRENDS
//FETCH TOP CONTRIBUTORS
//FETCH WITHDRAWAL PURPOSES


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <BalanceCard />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Members</CardTitle>
                <CardDescription>Active members in the group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">24</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>This Month</CardTitle>
                <CardDescription>Total deposits for May 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">৳ 48,000</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <RecentDeposits />
            <Card>
              <CardHeader>
                <CardTitle>Recent Withdrawals</CardTitle>
                <CardDescription>Latest withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Emergency Fund</p>
                      <p className="text-sm text-muted-foreground">Requested by Rahul Khan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">৳ 15,000</p>
                      <p className="text-sm text-amber-500">Pending Approval</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Equipment Purchase</p>
                      <p className="text-sm text-muted-foreground">Requested by Priya Sharma</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">৳ 8,500</p>
                      <p className="text-sm text-green-500">Approved</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Deposit Trends</CardTitle>
                <CardDescription>Monthly deposit patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <DepositChart />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>Members with highest contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <MemberActivity />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Purposes</CardTitle>
                <CardDescription>Breakdown of withdrawal categories</CardDescription>
              </CardHeader>
              <CardContent>
                <WithdrawalPurposes />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
