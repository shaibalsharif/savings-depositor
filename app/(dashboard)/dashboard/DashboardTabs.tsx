"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function DashboardTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="tabs-container">
      <button
        onClick={() => setTab("own")}
        className={`tab-trigger ${activeTab === "own" ? "active" : ""}`}
      >
        Own View
      </button>
      <button
        onClick={() => setTab("all")}
        className={`tab-trigger ${activeTab === "all" ? "active" : ""}`}
      >
        All View
      </button>
    </div>
  );
}
