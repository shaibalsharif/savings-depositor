"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Emergency Fund", value: 35000 },
  { name: "Equipment Purchase", value: 25000 },
  { name: "Business Investment", value: 20000 },
  { name: "Medical Expenses", value: 15000 },
  { name: "Education", value: 10000 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function WithdrawalPurposes() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        data={data}
        tooltipOptions={{
          trigger: "hover",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-none bg-background p-2 shadow-md"
                  valueLabelFormatter={(value) => `৳${Number(value).toLocaleString()}`}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
