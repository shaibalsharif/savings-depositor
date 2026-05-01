"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const SOURCE_TYPES = [
  { value: "bank_profit", label: "Bank Profit" },
  { value: "investment_return", label: "Investment Return" },
  { value: "business", label: "Business" },
  { value: "loss", label: "Loss" },
  { value: "other", label: "Other" },
];

const filterStyle = {
  background: "hsl(var(--muted))",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
} as React.CSSProperties;

export function RevenueFilter({
  currentSource,
  currentType,
  currentFrom,
  currentTo,
}: {
  currentSource: string;
  currentType: string;
  currentFrom: string;
  currentTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val);
        else params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasFilters = currentSource || currentType || currentFrom || currentTo;

  return (
    <div className="space-y-3">
      {/* Income / Loss / All type toggles */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { value: "", label: "All Entries" },
          { value: "income", label: "📈 Income Only" },
          { value: "loss", label: "📉 Loss Only" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => update({ type: t.value })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={currentType === t.value
              ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
              : { ...filterStyle, border: "1px solid hsl(var(--border))" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Source type toggles */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => update({ source: "" })}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={!currentSource
            ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
            : { ...filterStyle, border: "1px solid hsl(var(--border))" }
          }
        >
          All Sources
        </button>
        {SOURCE_TYPES.map((s) => (
          <button
            key={s.value}
            onClick={() => update({ source: currentSource === s.value ? "" : s.value })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={currentSource === s.value
              ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
              : { ...filterStyle, border: "1px solid hsl(var(--border))" }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="month"
          value={currentFrom}
          onChange={(e) => update({ from: e.target.value })}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{ ...filterStyle, colorScheme: "dark" }}
          title="From month"
        />
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>to</span>
        <input
          type="month"
          value={currentTo}
          onChange={(e) => update({ to: e.target.value })}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{ ...filterStyle, colorScheme: "dark" }}
          title="To month"
        />

        {hasFilters && (
          <button
            onClick={() => update({ source: "", type: "", from: "", to: "" })}
            className="px-3 py-2 text-sm rounded-md font-medium"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" }}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
