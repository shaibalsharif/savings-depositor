// components/dashboard/balance-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BalanceCardProps {
  data: { totalBalance: number };
}

export function BalanceCard({ data }: BalanceCardProps) {
  const totalBalance = data.totalBalance;
  
  let currentTarget = 50000;
  while (totalBalance > currentTarget) {
    currentTarget += 50000;
  }

  const progressPercentage = Math.min(100, (totalBalance / currentTarget) * 100);
  const progressColor = `hsl(${progressPercentage * 1.2}, 100%, 50%)`;

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
            <span>Target: ৳{currentTarget.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}