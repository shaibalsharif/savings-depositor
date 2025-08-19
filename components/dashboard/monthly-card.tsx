// components/dashboard/monthly-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { WaterWaveProgress } from "./WaterWaveProgress"

interface MonthlyCardProps {
  data: {
    monthlyCollected: number;
    monthlyCollectable: number;
  };
}

export function MonthlyCard({ data }: MonthlyCardProps) {
  // Safely destructure the data with a fallback of 0
  const monthlyCollected = data.monthlyCollected || 0;
  const monthlyCollectable = data.monthlyCollectable || 0;
  
  const fillPercentage = monthlyCollectable > 0 ? (monthlyCollected / monthlyCollectable) * 100 : 0;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>This Month</CardTitle>
        <CardDescription>Current month's progress</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold">৳ {monthlyCollected.toLocaleString()}</div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Monthly Progress</span>
            <span className="font-medium">{Math.round(fillPercentage)}%</span>
          </div>
        </div>
      </CardContent>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <WaterWaveProgress percentage={fillPercentage} />
      </div>
    </Card>
  )
}