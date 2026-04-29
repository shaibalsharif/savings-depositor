"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const SHARE_COLORS = [
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

export function InvestmentShareDonut({
  shares,
  principal,
  revenueAmount,
}: {
  shares: ShareEntry[];
  principal: number;
  revenueAmount: number;
}) {
  const data = shares.map((s) => ({
    name: s.memberName,
    value: parseFloat(s.sharePercentage.toFixed(2)),
    balance: s.balanceAtInvestment,
    stake: (s.sharePercentage / 100) * principal,
    profit: (revenueAmount * s.sharePercentage) / 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      const color = payload[0].payload.fill || SHARE_COLORS[0];
      return (
        <div
          style={{
            background: "hsl(var(--card))",
            border: `1px solid ${color}55`,
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            minWidth: 200,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{entry.name}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: "var(--teal)" }}>
              Share: <strong>{entry.value.toFixed(2)}%</strong>
            </span>
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
              Available balance: ৳{entry.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span style={{ color: "#8b5cf6" }}>
              Investment stake: ৳{entry.stake.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            {revenueAmount !== 0 && (
              <span style={{ color: revenueAmount >= 0 ? "var(--green)" : "var(--red)" }}>
                Proj. profit: ৳{entry.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={90}
          outerRadius={155}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={SHARE_COLORS[i % SHARE_COLORS.length]}
              style={{ cursor: "pointer", outline: "none" }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
