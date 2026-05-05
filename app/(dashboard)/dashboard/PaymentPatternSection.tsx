"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, Rows3, CalendarRange } from "lucide-react";
import { PaymentHeatmap } from "@/components/charts/PaymentHeatmap";
import { getHeatmapDataAction, getAllTimeHeatmapDataAction } from "@/lib/actions/dashboard";

type HeatmapData = {
  year: number | null;
  months: string[];
  heatmapData: any[];
  startMonth?: string;
  endMonth?: string;
};

export function PaymentPatternSection({ initialData }: { initialData: HeatmapData }) {
  const [data, setData] = useState<HeatmapData>(initialData);
  const [year, setYear] = useState(initialData.year ?? new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [isAllTime, setIsAllTime] = useState(false);

  useEffect(() => {
    if (isAllTime) return; // handled separately

    if (year === (initialData.year ?? new Date().getFullYear()) && !isAllTime) {
      setData(initialData);
      return;
    }

    async function fetchYearData() {
      setLoading(true);
      try {
        const result = await getHeatmapDataAction(year);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchYearData();
  }, [year, initialData, isAllTime]);

  async function handleShowAll() {
    setLoading(true);
    setIsAllTime(true);
    try {
      const result = await getAllTimeHeatmapDataAction();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch all-time heatmap:", err);
      setIsAllTime(false);
    } finally {
      setLoading(false);
    }
  }

  function handleExitAllTime() {
    setIsAllTime(false);
    setData(initialData);
    setYear(initialData.year ?? new Date().getFullYear());
  }

  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => {
    const currentYear = new Date().getFullYear();
    if (year < currentYear) setYear((y) => y + 1);
  };

  const titleLabel = isAllTime
    ? `All Time (${data.startMonth ?? "…"} → ${data.endMonth ?? "…"})`
    : `Member Payment Pattern — ${year}`;

  return (
    <div className="glass border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b bg-muted/20 gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold tracking-tight">{titleLabel}</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            {isAllTime ? "Full contribution history" : "Annual contribution heatmap"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Show All / Back button */}
          {isAllTime ? (
            <button
              onClick={handleExitAllTime}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-xs font-semibold transition disabled:opacity-50"
              title="Back to yearly view"
            >
              <CalendarRange size={13} />
              <span>Year View</span>
            </button>
          ) : (
            <button
              onClick={handleShowAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-xs font-semibold transition disabled:opacity-50"
              style={{ color: "var(--teal)" }}
              title="Show all months from the beginning"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Rows3 size={13} />}
              <span>Show All</span>
            </button>
          )}

          {/* Year navigation — hidden in all-time mode */}
          {!isAllTime && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevYear}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-muted border bg-card transition disabled:opacity-50"
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 py-1 bg-card border rounded-lg text-xs font-bold min-w-[60px] text-center">
                {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : year}
              </div>
              <button
                onClick={handleNextYear}
                disabled={loading || year >= new Date().getFullYear()}
                className="p-1.5 rounded-lg hover:bg-muted border bg-card transition disabled:opacity-50"
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap body */}
      <div
        className={`p-4 sm:p-5 overflow-x-auto transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading heatmap data…</span>
          </div>
        ) : (
          <PaymentHeatmap data={data.heatmapData} months={data.months} />
        )}
      </div>
    </div>
  );
}
