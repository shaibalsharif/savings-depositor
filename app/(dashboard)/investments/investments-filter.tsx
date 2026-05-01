"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const filterStyle = {
  background: "hsl(var(--muted))",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
} as React.CSSProperties;

export function InvestmentsFilter({
  currentStatus,
  currentFrom,
  currentTo,
}: {
  currentStatus: string;
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

  const hasFilters = currentStatus || currentFrom || currentTo;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Status toggles */}
      {[
        { value: "", label: "All" },
        { value: "active", label: "🟢 Active" },
        { value: "matured", label: "✅ Matured" },
        { value: "defaulted", label: "🔴 Defaulted" },
      ].map((s) => (
        <button
          key={s.value}
          onClick={() => update({ status: s.value })}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={currentStatus === s.value
            ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
            : { ...filterStyle, border: "1px solid hsl(var(--border))" }
          }
        >
          {s.label}
        </button>
      ))}

      {/* Date range */}
      <input
        type="date"
        value={currentFrom}
        onChange={(e) => update({ from: e.target.value })}
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{ ...filterStyle, colorScheme: "dark" }}
        title="Invest date from"
      />
      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>to</span>
      <input
        type="date"
        value={currentTo}
        onChange={(e) => update({ to: e.target.value })}
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{ ...filterStyle, colorScheme: "dark" }}
        title="Invest date to"
      />

      {hasFilters && (
        <button
          onClick={() => update({ status: "", from: "", to: "" })}
          className="px-3 py-2 text-sm rounded-md font-medium"
          style={{ background: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" }}
        >
          Clear All
        </button>
      )}
    </div>
  );
}
