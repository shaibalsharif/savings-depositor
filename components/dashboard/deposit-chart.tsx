"use client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", amount: 32000 },
  { month: "Feb", amount: 40000 },
  { month: "Mar", amount: 45000 },
  { month: "Apr", amount: 42000 },
  { month: "May", amount: 48000 },
  { month: "Jun", amount: 52000 },
]

export function DepositChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        data={data}
        tooltipOptions={{
          trigger: "hover",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} stroke="#888888" fontSize={12} />
            <YAxis
              tickFormatter={(value) => `৳${value / 1000}k`}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#888888"
              fontSize={12}
            />
            <Line
              type="monotone"
              dataKey="amount"
              strokeWidth={2}
              activeDot={{
                r: 6,
                style: { fill: "var(--primary)", opacity: 0.8 },
              }}
              stroke="var(--primary)"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-none bg-background p-2 shadow-md"
                  valueLabelFormatter={(value) => `৳${Number(value).toLocaleString()}`}
                />
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
