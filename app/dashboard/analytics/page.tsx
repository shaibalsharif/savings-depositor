"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepositChart } from "@/components/dashboard/deposit-chart"
import { MemberActivity } from "@/components/dashboard/member-activity"
import { WithdrawalPurposes } from "@/components/dashboard/withdrawal-purposes"
import { BalanceCard } from "@/components/dashboard/balance-card"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Detailed financial analytics and insights</p>
      </div>

      <Tabs defaultValue="deposits">
        <TabsList>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <BalanceCard />
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Deposits</CardTitle>
                <CardDescription>Deposit trends over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <DepositChart />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deposit Analysis</CardTitle>
              <CardDescription>Detailed breakdown of deposit patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Average Monthly Deposit</h3>
                  <p className="text-3xl font-bold">৳ 43,167</p>
                  <p className="mt-1 text-sm text-muted-foreground">Based on last 6 months</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium">Highest Month</h3>
                  <p className="text-3xl font-bold">৳ 52,000</p>
                  <p className="mt-1 text-sm text-muted-foreground">June 2025</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium">Growth Rate</h3>
                  <p className="text-3xl font-bold text-success">+8.3%</p>
                  <p className="mt-1 text-sm text-muted-foreground">Month-over-month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Purposes</CardTitle>
              <CardDescription>Breakdown of withdrawal categories</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <WithdrawalPurposes />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Statistics</CardTitle>
              <CardDescription>Key withdrawal metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Total Withdrawals</h3>
                  <p className="text-3xl font-bold">৳ 105,000</p>
                  <p className="mt-1 text-sm text-muted-foreground">Year to date</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium">Average Withdrawal</h3>
                  <p className="text-3xl font-bold">৳ 15,000</p>
                  <p className="mt-1 text-sm text-muted-foreground">Per request</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium">Approval Rate</h3>
                  <p className="text-3xl font-bold">75%</p>
                  <p className="mt-1 text-sm text-muted-foreground">Of all requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Members with highest contributions</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <MemberActivity />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Statistics</CardTitle>
              <CardDescription>Key member metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Total Members</h3>
                  <p className="text-3xl font-bold">24</p>
                  <p className="mt-1 text-sm text-muted-foreground">Active members</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium">Average Contribution</h3>
                  <p className="text-3xl font-bold">৳ 40,833</p>
                  <p className="mt-1 text-sm text-muted-foreground">Per member</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium">New Members</h3>
                  <p className="text-3xl font-bold">+3</p>
                  <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
