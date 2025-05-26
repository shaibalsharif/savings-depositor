"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { depositData } from "@/lib/dummy-data"

export function RecentDeposits() {
  // Get the 5 most recent deposits
  const recentDeposits = [...depositData]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deposits</CardTitle>
        <CardDescription>Latest deposit receipts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentDeposits.map((deposit) => (
            <div key={deposit.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{deposit.month}</p>
                <p className="text-sm text-muted-foreground">
                  {deposit.date} • {deposit.transactionId.substring(0, 8)}...
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">৳ {deposit.amount.toLocaleString()}</p>
                <Badge
                  variant={
                    deposit.status === "verified" ? "success" : deposit.status === "pending" ? "outline" : "destructive"
                  }
                  className="mt-1"
                >
                  {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
