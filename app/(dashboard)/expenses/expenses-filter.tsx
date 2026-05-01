"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = ["Food", "Event", "Materials", "Bank Charge", "Conveyance", "Other"];

const filterStyle = {
  background: "hsl(var(--muted))",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
} as React.CSSProperties;

export function ExpensesFilter({
  currentCategory,
  currentStatus,
  currentFrom,
  currentTo,
}: {
  currentCategory: string;
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

  const hasFilters = currentCategory || currentStatus || currentFrom || currentTo;

  return (
    <div className="space-y-3">
      {/* Category toggles */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => update({ category: "" })}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={!currentCategory
            ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
            : { ...filterStyle, border: "1px solid hsl(var(--border))" }
          }
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => update({ category: currentCategory === cat ? "" : cat })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={currentCategory === cat
              ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
              : { ...filterStyle, border: "1px solid hsl(var(--border))" }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Date range + Status */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="month"
          value={currentFrom}
          onChange={(e) => update({ from: e.target.value })}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{ ...filterStyle, colorScheme: "dark" }}
          placeholder="From"
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

        <select
          value={currentStatus}
          onChange={(e) => update({ status: e.target.value })}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={filterStyle}
        >
          <option value="">All Status</option>
          <option value="active">Active Only</option>
          <option value="voided">Voided Only</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => update({ category: "", status: "", from: "", to: "" })}
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
