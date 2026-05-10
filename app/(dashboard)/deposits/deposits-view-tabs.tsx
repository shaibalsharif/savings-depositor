"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type ViewMode = "month" | "mine" | "all";

export function DepositsViewTabs({
  currentView,
  isManager,
}: {
  currentView: ViewMode;
  isManager: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = useCallback(
    (view: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      // When switching to month view, reset to current month
      if (view === "month") {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        params.set("month", ym);
        params.delete("member");
      } else if (view === "mine") {
        params.delete("month");
        params.delete("member");
      } else {
        // all — keep month/member as-is
        params.delete("month");
      }
      params.delete("status");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const tabs: { id: ViewMode; label: string }[] = [
    { id: "month", label: "📅 This Month" },
    { id: "mine", label: "👤 My Deposits" },
    { id: "all", label: isManager ? "🌐 All Members" : "🌐 All Deposits" },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          style={
            currentView === tab.id
              ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }
              : { color: "hsl(var(--muted-foreground))", border: "1px solid transparent" }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
