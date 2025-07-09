// components/dashboard/recent-deposits.tsx
import { db } from "@/lib/db"
import { deposits } from "@/db/schema"
import { desc, sql } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import Link from "next/link"

export async function RecentDeposits() {
  const recentDeposits = await db
    .select()
    .from(deposits)
    .where(sql`${deposits.status} = 'verified'`)
    .orderBy(desc(deposits.createdAt))
    .limit(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deposits</CardTitle>
        <CardDescription>Latest verified transactions</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recentDeposits.map((deposit) => (
          <div key={deposit.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">User #{deposit.userId.slice(-4)}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(deposit.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">৳{deposit.amount}</p>
            </div>
          </div>
        ))}
        <Button className="mt-4 w-full" variant="outline">
          <Link href={"/dashboard/deposits"}>See All Deposits</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
