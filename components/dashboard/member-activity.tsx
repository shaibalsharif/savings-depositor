"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Rahul Khan", amount: 48000 },
  { name: "Priya Sharma", amount: 42000 },
  { name: "Amit Patel", amount: 38000 },
  { name: "Neha Gupta", amount: 35000 },
  { name: "Vikram Singh", amount: 32000 },
]

export function MemberActivity() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        data={data}
        tooltipOptions={{
          trigger: "hover",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 10,
              left: 80,
              bottom: 0,
            }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => `৳${value / 1000}k`}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="#888888"
              fontSize={12}
              width={80}
            />
            <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-none bg-background p-2 shadow-md"
                  valueLabelFormatter={(value) => `৳${Number(value).toLocaleString()}`}
                />
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
