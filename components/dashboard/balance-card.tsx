// components/dashboard/balance-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { db } from "@/lib/db"
import { funds } from "@/db/schema"
import { sql } from "drizzle-orm"

export async function BalanceCard() {
  // Calculate total balance from non-deleted funds
  const fundsData = await db
    .select({ balance: funds.balance })
    .from(funds)
    .where(sql`${funds.deleted} = false`)

  const totalBalance = fundsData.reduce((acc, fund) => acc + Number(fund.balance), 0)
  
  // Calculate dynamic target
  let currentTarget = 50000
  while (totalBalance > currentTarget) {
    currentTarget += 50000
  }

  const progressPercentage = Math.min(100, (totalBalance / currentTarget) * 100)
  
  // Gradient color calculation
  const progressColor = `hsl(${progressPercentage * 1.2}, 100%, 50%)`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Current Balance</CardTitle>
        <CardDescription>Total group savings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">৳ {totalBalance.toLocaleString()}</div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress to target</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            style={{ backgroundColor: progressColor }}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* <span>৳0</span> */}
            <span>Target: ৳{currentTarget.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
