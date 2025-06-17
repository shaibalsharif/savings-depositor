// components/dashboard/recent-withdrawals.tsx
import { db } from "@/lib/db"
import { withdrawals } from "@/db/schema/logs" // Ensure you have a withdrawals table/schema
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { desc, sql } from "drizzle-orm"

export async function RecentWithdrawals() {
  const recentWithdrawals = await db
    .select()
    .from(withdrawals)
    .where(sql`${withdrawals.status} = 'verified'`)
    .orderBy(desc(withdrawals.createdAt))
    .limit(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Withdrawals</CardTitle>
        <CardDescription>Latest verified withdrawal requests</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recentWithdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">User #{withdrawal.userId.slice(-4)}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(withdrawal.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">৳{withdrawal.amount}</p>
            </div>
          </div>
        ))}
        <Button className="mt-4 w-full" variant="outline">
          See All Withdrawals
        </Button>
      </CardContent>
    </Card>
  )
}
