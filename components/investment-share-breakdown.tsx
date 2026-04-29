"use client";

import { useState, useCallback } from "react";
import { InvestmentShareDonut } from "@/components/charts/investment-share-donut";
import { SHARE_COLORS } from "@/components/charts/investment-share-donut";

type ShareEntry = {
  memberId: string;
  memberName: string;
  sharePercentage: number;
  balanceAtInvestment: number;
};

type Summary = {
  netRevenue: number;
};

export function InvestmentShareBreakdown({
  shares,
  principal,
  summary,
  investDate,
}: {
  shares: ShareEntry[];
  principal: number;
  summary: Summary;
  investDate: string;
}) {
  const [revenueInput, setRevenueInput] = useState<string>(
    summary.netRevenue !== 0
      ? ((summary.netRevenue / principal) * 100).toFixed(2)
      : ""
  );

  const revenuePercent = parseFloat(revenueInput) || 0;
  const revenueAmount = (revenuePercent / 100) * principal;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
      setRevenueInput(raw);
      return;
    }
    // Allow up to 4 digits before decimal, 2 after; range -1000 to 1000
    const match = raw.match(/^-?\d{0,4}(\.\d{0,2})?$/);
    if (match) {
      const num = parseFloat(raw);
      if (isNaN(num) || (num >= -1000 && num <= 1000)) {
        setRevenueInput(raw);
      }
    }
  }, []);

  const totalBalance = shares.reduce((s, m) => s + m.balanceAtInvestment, 0);

  return (
    <div className="glass p-5 space-y-5">
      {/* Header + Revenue Input */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Member Share Breakdown</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Proportional stake in ৳{principal.toLocaleString()} · invested {investDate}
          </p>
        </div>

        {/* Revenue % input */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50"
          style={{ background: "hsl(var(--muted)/0.3)", minWidth: 260 }}
        >
          <div className="flex-1">
            <label
              htmlFor="revenue-pct"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Revenue % of Principal
            </label>
            <div className="flex items-center gap-2">
              <input
                id="revenue-pct"
                type="text"
                inputMode="decimal"
                value={revenueInput}
                onChange={handleChange}
                placeholder="e.g. 12.50"
                className="w-full bg-transparent text-sm font-bold focus:outline-none"
                style={{ color: revenuePercent >= 0 ? "var(--green)" : "var(--red)" }}
              />
              <span className="text-sm font-bold text-muted-foreground">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">= Revenue</div>
            <div
              className="text-sm font-bold"
              style={{ color: revenuePercent >= 0 ? "var(--green)" : "var(--red)" }}
            >
              {revenueAmount >= 0 ? "+" : "−"}৳
              {Math.abs(revenueAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* 2-column grid table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shares.map((s, i) => {
          const investmentStake = (s.sharePercentage / 100) * principal;
          const projProfit = (revenueAmount * s.sharePercentage) / 100;
          const color = SHARE_COLORS[i % SHARE_COLORS.length];
          return (
            <div
              key={s.memberId}
              className="rounded-xl border border-border/40 p-4 hover:bg-muted/10 transition-colors"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-semibold text-sm">{s.memberName}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${color}22`, color }}
                >
                  {s.sharePercentage.toFixed(2)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground mb-0.5">Available Bal.</div>
                  <div className="font-medium">
                    ৳{s.balanceAtInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Inv. Stake</div>
                  <div className="font-bold" style={{ color: "#8b5cf6" }}>
                    ৳{investmentStake.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Proj. Profit</div>
                  <div
                    className="font-bold"
                    style={{ color: revenueAmount >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {projProfit >= 0 ? "+" : "−"}৳
                    {Math.abs(projProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer totals row */}
      <div
        className="flex flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 rounded-xl text-xs font-semibold border border-border/30"
        style={{ background: "hsl(var(--muted)/0.2)" }}
      >
        <span className="uppercase tracking-wider text-muted-foreground">Totals</span>
        <span>
          Balances:{" "}
          <span className="text-foreground">৳{totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </span>
        <span>
          Invested:{" "}
          <span style={{ color: "#8b5cf6" }}>৳{principal.toLocaleString()}</span>
        </span>
        <span>
          Revenue:{" "}
          <span style={{ color: revenueAmount >= 0 ? "var(--green)" : "var(--red)" }}>
            {revenueAmount >= 0 ? "+" : "−"}৳
            {Math.abs(revenueAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </span>
        <span>
          Share: <span style={{ color: "var(--teal)" }}>100.00%</span>
        </span>
      </div>

      {/* Full-width Donut Chart below */}
      <div className="w-full" style={{ marginTop: 8 }}>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
          Hover slices for details
        </div>
        <InvestmentShareDonut
          shares={shares}
          principal={principal}
          revenueAmount={revenueAmount}
        />
      </div>
    </div>
  );
}
