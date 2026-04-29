"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type MonthEntry = {
  month: string;
  collected: number;
  expected: number;
  expenses: number;
};

const fmt = (v: number) => `৳${v.toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass p-3 text-xs space-y-1"
      style={{ minWidth: 160, border: "1px solid hsl(var(--border))" }}
    >
      <div className="font-semibold mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-mono">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function MonthlyCollectionChart({ data }: { data: MonthEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={12} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
          tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(value) => <span style={{ color: "hsl(215 20% 65%)" }}>{value}</span>}
        />
        <Bar dataKey="expected" name="Expected" fill="hsl(222 47% 22%)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="collected" name="Collected" fill="#2dd4bf" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type MemberMonthEntry = {
  month: string;
  paid: number;
  expected: number;
};

export function MemberCollectionChart({ data }: { data: MemberMonthEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
          tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="expected" name="Required" fill="hsl(222 47% 22%)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="paid" name="Paid" fill="#2dd4bf" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
