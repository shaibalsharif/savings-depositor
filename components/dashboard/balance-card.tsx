"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function BalanceCard() {
  const currentBalance = 245000
  const targetBalance = 500000
  const progressPercentage = Math.min(100, Math.round((currentBalance / targetBalance) * 100))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Current Balance</CardTitle>
        <CardDescription>Total group savings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">৳ {currentBalance.toLocaleString()}</div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress to target</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>৳0</span>
            <span>Target: ৳{targetBalance.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
