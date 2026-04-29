"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#14b8a6", // teal
  "#8b5cf6", // purple
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#a3e635", // lime
  "#f97316", // orange
];

type ShareEntry = {
  memberName: string;
  sharePercentage: number;
  balanceAtInvestment: number;
};

export function InvestmentShareDonut({ shares }: { shares: ShareEntry[] }) {
  const data = shares.map((s) => ({
    name: s.memberName,
    value: parseFloat(s.sharePercentage.toFixed(2)),
    balance: s.balanceAtInvestment,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 4 }}>{entry.name}</p>
          <p style={{ color: "var(--teal)" }}>Share: {entry.value.toFixed(2)}%</p>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Balance at investment: ৳{entry.balance.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={130}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
