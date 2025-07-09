// components/dashboard/monthly-card.tsx
import { db } from "@/lib/db"
import { depositSettings, deposits } from "@/db/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { WaterWaveProgress } from "./WaterWaveProgress"
import { and, sql } from "drizzle-orm"

export async function MonthlyCard() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [settings] = await db
    .select()
    .from(depositSettings)
    .where(sql`${depositSettings.effectiveMonth} = ${currentMonth}`)

  const totalUsers = [{ count: 10 }]/*  await db
    .select({ count: sql<number>`count(*)` })
    .from(personalInfo) */

  const monthlyDeposits = await db
    .select()
    .from(deposits)
    .where(
      and(
        sql`${deposits.status} = 'verified'`,
        sql`${deposits.month} = ${currentMonth}`
      )
    )

  const totalCollectable = (parseInt(settings?.monthlyAmount) || 0) * totalUsers[0].count
  const totalCollected = monthlyDeposits.reduce((acc, d) => acc + Number(d.amount), 0)
  const fillPercentage = (totalCollected / totalCollectable) * 100 || 0
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>This Month</CardTitle>
        <CardDescription>Current month's progress</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10"> {/* content above wave */}
        <div className="text-3xl font-bold">৳ {totalCollected.toLocaleString()}</div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Monthly Progress</span>
            <span className="font-medium">{Math.round(fillPercentage)}%</span>
          </div>
        </div>
      </CardContent>

      {/* Wave behind content */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <WaterWaveProgress percentage={fillPercentage} />
      </div>
    </Card>
  )
}