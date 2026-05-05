"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PaymentHeatmap } from "@/components/charts/PaymentHeatmap";
import { getHeatmapDataAction } from "@/lib/actions/dashboard";

type HeatmapData = {
  year: number;
  months: string[];
  heatmapData: any[];
};

export function PaymentPatternSection({ initialData }: { initialData: HeatmapData }) {
  const [data, setData] = useState<HeatmapData>(initialData);
  const [year, setYear] = useState(initialData.year);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (year === initialData.year) {
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
  }, [year, initialData]);

  const handlePrevYear = () => setYear(year - 1);
  const handleNextYear = () => {
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
      setYear(year + 1);
    }
  };

  return (
    <div className="glass border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex items-center justify-between border-b bg-muted/20">
        <div>
          <h2 className="text-base font-bold tracking-tight">Member Payment Pattern — {year}</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Annual contribution heatmap
          </p>
        </div>
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
      </div>
      <div className={`p-4 sm:p-5 overflow-x-auto transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <PaymentHeatmap data={data.heatmapData} months={data.months} />
      </div>
    </div>
  );
}
