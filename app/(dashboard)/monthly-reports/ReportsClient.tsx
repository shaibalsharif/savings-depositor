"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateReport, clearOldReports } from "@/lib/actions/reports";
import { Loader2, Calendar, FileText, Download, CheckCircle, Trash2, Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react";

type ReportItem = {
  month: string;
  createdAt: Date;
};

type SummaryData = {
  startingBalance: number;
  thisCollected: number;
  thisExpensesAmount: number;
  prevTotalExpenses: number;
  balance: number;
  activeInvestmentsCount: number;
  activeInvestmentsAmount?: number | string;
  returnedInvestmentsCount: number;
  returnedInvestmentsAmount?: number | string;
  netRevenueThisMonth: number;
};

type ReportDetails = {
  payments: any[];
  expenses: any[];
  investments: any[];
  revenue: any[];
  dueList: any[];
};

type ViewableReport = {
  month: string;
  summary: SummaryData;
  details: ReportDetails;
};

export function ReportsClient({
  availableReports,
  selectedReport,
  isManager,
  minMonth,
  maxMonth,
}: {
  availableReports: ReportItem[];
  selectedReport: ViewableReport | null;
  isManager: boolean;
  minMonth: string;
  maxMonth: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [monthToGen, setMonthToGen] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [selectedReport]);

  const minYear = parseInt(minMonth.split("-")[0] || "2024");
  const maxYear = parseInt(maxMonth.split("-")[0] || "2026");
  const [pickerYear, setPickerYear] = useState(maxYear);

  const reportsByYear = availableReports.reduce((acc, r) => {
    const year = r.month.split("-")[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {} as Record<string, typeof availableReports>);

  const years = Object.keys(reportsByYear).sort((a, b) => b.localeCompare(a));
  const [openYears, setOpenYears] = useState<string[]>(years.length > 0 ? [years[0]] : []);

  const toggleYear = (year: string) => {
    if (openYears.includes(year)) {
      setOpenYears(openYears.filter((y) => y !== year));
    } else {
      setOpenYears([...openYears, year]);
    }
  };

  const handleGenerate = async () => {
    if (!monthToGen) {
      toast.error("Please pick a month to generate");
      return;
    }
    const alreadyExists = availableReports.some((r) => r.month === monthToGen);
    if (alreadyExists) {
      toast.error(`Report for ${monthToGen} has already been generated.`);
      return;
    }
    setLoading(true);
    try {
      await generateReport(monthToGen);
      toast.success(`Report for ${monthToGen} generated successfully!`);
      router.refresh();
      setMonthToGen("");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleClearReports = async () => {
    if (!confirm("Are you sure you want to delete all generated reports? This action cannot be undone.")) return;
    setClearing(true);
    try {
      await clearOldReports();
      toast.success("Legacy reports successfully cleared.");
      router.push("/monthly-reports");
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to clear old reports");
    } finally {
      setClearing(false);
    }
  };

  const selectReport = (month: string) => {
    setIsNavigating(true);
    router.push(`/monthly-reports?month=${month}`);
  };

  // Helper functions for dynamic printing terminologies
  function getFriendlyMonthName(monthStr: string) {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function getMonthNameOnly(monthStr: string) {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long" });
  }

  function getLastDayOfMonthStr(monthStr: string) {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-").map(Number);
    const lastDayDate = new Date(year, month, 0);
    const day = lastDayDate.getDate();
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    return `${day}${suffix} of ${getFriendlyMonthName(monthStr)}`;
  }

  function getPreviousMonthLastDayStr(monthStr: string) {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-").map(Number);
    const lastDayDate = new Date(year, month - 1, 0);
    const day = lastDayDate.getDate();
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    
    // adjust year if transitioning from Jan to Dec
    const pYear = month === 1 ? year - 1 : year;
    const pMonth = month === 1 ? 12 : month - 1;
    const pDate = new Date(pYear, pMonth - 1, 1);
    const pMonthName = pDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return `${day}${suffix} of ${pMonthName}`;
  }

  const handlePrint = () => {
    if (!selectedReport) return;
    const previousTitle = document.title;
    document.title = `${getMonthNameOnly(selectedReport.month)}_${selectedReport.month.split("-")[0]}_Report`;
    window.print();
    document.title = previousTitle;
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body, main, div, .max-w-7xl { padding: 0 2px !important; margin: 0 !important; max-width: none !important; width: 100% !important; height: auto !important; box-shadow: none !important; border: none !important; background: white !important; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-only { display: block !important; }
          .glass { border: none !important; background: white !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .stat-print-box { border: 1px solid #94a3b8 !important; padding: 10px !important; border-radius: 4px !important; background-color: #f8fafc !important; }
          .print-title { text-align: center !important; font-size: 22px !important; font-weight: 800 !important; letter-spacing: 0.15em !important; text-transform: uppercase !important; border-bottom: 2px solid #0f172a !important; padding-bottom: 10px !important; margin-bottom: 20px !important; color: #0f172a !important; width: 100% !important; display: block !important; }
          .print-label { font-size: 10px !important; color: #334155 !important; font-weight: 600 !important; text-transform: uppercase !important; }
          .print-value { font-size: 16px !important; font-weight: 800 !important; color: #0f172a !important; }
          .print-all-rows { max-height: none !important; overflow: visible !important; }
          .page-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `}</style>

      <div className={`grid grid-cols-1 ${isMaximized ? "lg:grid-cols-1" : "lg:grid-cols-3"} gap-6`}>
        {/* Available reports and generation tools */}
        <div className={`space-y-6 lg:col-span-1 select-none no-print ${isMaximized ? "hidden" : "block"}`}>
          {/* Manager generation and tools only */}
          {isManager && (
            <div className="glass p-4 sm:p-5 space-y-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-bold">Manage Reports</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Generate or clear old summaries.</p>
              </div>
              <div className="space-y-3">
                {(() => {
                  const monthsArray = Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, "0");
                    const fullMonthStr = `${pickerYear}-${m}`;
                    const date = new Date(pickerYear, i, 1);
                    const monthLabel = date.toLocaleDateString("en-US", { month: "short" });
                    const isGenerated = availableReports.some((r) => r.month === fullMonthStr);
                    const isOutOfBounds = fullMonthStr < minMonth || fullMonthStr > maxMonth;
                    return {
                      monthStr: fullMonthStr,
                      label: monthLabel,
                      isGenerated,
                      isOutOfBounds,
                    };
                  });

                  return (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground font-medium">Select Month</span>
                      
                      {/* Year selector */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setPickerYear(Math.max(minYear, pickerYear - 1))}
                          disabled={pickerYear <= minYear}
                          className="px-2.5 py-1 text-xs border border-border bg-background rounded hover:bg-accent disabled:opacity-30"
                        >
                          ◄
                        </button>
                        <span className="text-xs font-bold flex-1 text-center">{pickerYear}</span>
                        <button
                          type="button"
                          onClick={() => setPickerYear(Math.min(maxYear, pickerYear + 1))}
                          disabled={pickerYear >= maxYear}
                          className="px-2.5 py-1 text-xs border border-border bg-background rounded hover:bg-accent disabled:opacity-30"
                        >
                          ►
                        </button>
                      </div>

                      {/* Month grid */}
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/20 border border-border rounded-lg">
                        {monthsArray.map((m) => {
                          const isSelected = monthToGen === m.monthStr;
                          if (m.isOutOfBounds) {
                            return (
                              <div
                                key={m.monthStr}
                                className="p-1.5 text-[10px] sm:text-xs text-center border border-dashed border-border/40 text-muted-foreground/40 rounded bg-muted/10 cursor-not-allowed select-none"
                                title="Out of bounds"
                              >
                                {m.label}
                              </div>
                            );
                          }
                          if (m.isGenerated) {
                            return (
                              <div
                                key={m.monthStr}
                                className="p-1.5 text-[10px] sm:text-xs text-center border border-border bg-muted/40 text-muted-foreground/60 rounded flex items-center justify-center gap-0.5 cursor-not-allowed select-none"
                                title="Generated"
                              >
                                <span>{m.label}</span>
                                <span className="text-[10px] text-[var(--teal)] font-bold leading-none">✓</span>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={m.monthStr}
                              type="button"
                              onClick={() => setMonthToGen(m.monthStr)}
                              className={`p-1.5 text-[10px] sm:text-xs font-semibold text-center border rounded transition ${
                                isSelected
                                  ? "bg-[var(--teal)] text-[hsl(222 47% 7%)] border-[var(--teal)]"
                                  : "bg-background text-foreground border-border hover:bg-accent"
                              }`}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-[var(--teal)] text-[hsl(222 47% 7%)] font-bold text-xs sm:text-sm rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generate Report
                </button>
                <div className="pt-2 border-t border-dashed mt-2">
                  <button
                    onClick={handleClearReports}
                    disabled={clearing}
                    className="w-full px-4 py-2 bg-muted text-foreground border border-border font-medium text-xs sm:text-sm rounded-lg hover:bg-accent hover:text-red-500 transition flex items-center justify-center gap-2"
                  >
                    {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={15} />}
                    Clear All Reports
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of generated reports */}
          <div className="glass p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold">Report Selection</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Select a month to view or print the details.</p>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {availableReports.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No generated reports yet.
                </div>
              ) : (
                years.map((year) => {
                  const isOpen = openYears.includes(year);
                  return (
                    <div key={year} className="border border-border rounded-lg bg-card overflow-hidden">
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full flex items-center justify-between p-3 text-xs font-bold bg-muted/20 hover:bg-muted/40 transition select-none"
                      >
                        <span>{year} Reports</span>
                        <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="divide-y border-t border-border">
                          {reportsByYear[year].map((r) => (
                            <button
                              key={r.month}
                              onClick={() => selectReport(r.month)}
                              className={`w-full flex items-center justify-between p-3.5 text-xs font-medium text-left hover:bg-accent transition ${
                                selectedReport?.month === r.month ? "bg-accent text-foreground font-bold" : "text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FileText size={15} className="text-muted-foreground" />
                                <span>{getFriendlyMonthName(r.month)}</span>
                              </div>
                              <CheckCircle size={14} className="text-[var(--teal)] opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Selected Report View Container */}
        <div className={`select-none print:w-full ${isMaximized ? "lg:col-span-1" : "lg:col-span-2"}`}>
          {loading || isNavigating ? (
            <div className="glass p-4 sm:p-6 space-y-6 flex flex-col justify-between h-full bg-white animate-pulse min-h-[400px]">
              <div className="flex justify-between items-center pb-4 border-b">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-slate-200 rounded"></div>
                  <div className="h-3 w-32 bg-slate-100 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-16 bg-slate-200 rounded-lg"></div>
                  <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl border border-slate-200 p-3 flex flex-col justify-between">
                    <div className="h-3 w-12 bg-slate-200 rounded"></div>
                    <div className="h-5 w-20 bg-slate-300 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="h-5 w-36 bg-slate-200 rounded"></div>
                <div className="h-32 bg-slate-100 rounded-lg border"></div>
              </div>
            </div>
          ) : !selectedReport ? (
            <div className="glass p-12 text-center text-muted-foreground flex flex-col items-center gap-2 justify-center h-full min-h-[300px] no-print">
              <Calendar className="w-10 h-10 opacity-30 animate-pulse text-[var(--teal)]" />
              <div className="text-sm font-semibold">No report selected</div>
              <p className="text-xs">Pick a monthly summary from the list to view.</p>
            </div>
          ) : (
            <div className="glass p-4 sm:p-6 space-y-6 flex flex-col justify-between h-full bg-white print:p-0 print:border-0 print:shadow-none print:text-black print:gap-4 print:space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-border/60">
                <div className="print-title print:w-full select-none">
                  <h1 className="text-lg sm:text-xl font-bold">Report for {getFriendlyMonthName(selectedReport.month)}</h1>
                  <p className="text-xs text-muted-foreground mt-0.5 no-print">Complete financial reconciliation summary.</p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentIndex = availableReports.findIndex((r) => r.month === selectedReport?.month);
                    const nextReport = currentIndex > 0 ? availableReports[currentIndex - 1] : null;
                    const prevReport = currentIndex < availableReports.length - 1 ? availableReports[currentIndex + 1] : null;

                    return (
                      <div className="flex items-center gap-2 select-none no-print">
                        <button
                          onClick={() => prevReport && selectReport(prevReport.month)}
                          disabled={!prevReport}
                          title="Previous Month"
                          className="px-2 sm:px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                        >
                          <ChevronLeft size={14} />
                          <span className="hidden sm:inline">Prev</span>
                        </button>
                        <button
                          onClick={() => nextReport && selectReport(nextReport.month)}
                          disabled={!nextReport}
                          title="Next Month"
                          className="px-2 sm:px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="px-3 py-2 border border-border bg-background rounded-lg text-xs font-semibold hover:bg-accent flex items-center gap-2 select-none no-print"
                  >
                    {isMaximized ? <Minimize size={15} /> : <Maximize size={15} />}
                    {isMaximized ? "Minimize" : "Maximize"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-border bg-background rounded-lg text-xs font-semibold hover:bg-accent flex items-center gap-2 select-none no-print"
                  >
                    <Download size={15} />
                    Print / Download PDF
                  </button>
                </div>
              </div>

              {/* Summary Terminologies Grid */}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 print:grid-cols-4 print:gap-2">
                {[
                  { label: "Starting Balance", value: `৳${selectedReport.summary.startingBalance.toLocaleString()}` },
                  { label: `Total Deposit in ${getMonthNameOnly(selectedReport.month)}`, value: `৳${selectedReport.summary.thisCollected.toLocaleString()}` },
                  { label: "Month's Expenses", value: `৳${selectedReport.summary.thisExpensesAmount.toLocaleString()}` },
                  { label: `${getLastDayOfMonthStr(selectedReport.month)}`, value: `৳${selectedReport.summary.balance.toLocaleString()}`, accent: "var(--teal)" },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 sm:p-4 border rounded-xl bg-muted/20 stat-print-box">
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest leading-tight print-label">{stat.label}</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold mt-1 print-value" style={{ color: stat.accent }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Advanced Summary Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-border p-3 rounded-lg bg-muted/10 print:border print:p-2 print:grid-cols-2">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground leading-tight">Total expense at {getPreviousMonthLastDayStr(selectedReport.month)}:</span>
                  <span className="font-semibold">৳{selectedReport.summary.prevTotalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Net Revenue This Month:</span>
                  <span className={`font-semibold ${selectedReport.summary.netRevenueThisMonth >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {selectedReport.summary.netRevenueThisMonth >= 0 ? "+" : ""}৳{selectedReport.summary.netRevenueThisMonth.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Active Investments Amount:</span>
                  <span className="font-semibold">
                    {typeof selectedReport.summary.activeInvestmentsAmount === "number"
                      ? `৳${selectedReport.summary.activeInvestmentsAmount.toLocaleString()}`
                      : typeof selectedReport.summary.activeInvestmentsAmount === "string"
                      ? `৳${Number(selectedReport.summary.activeInvestmentsAmount).toLocaleString()}`
                      : selectedReport.summary.activeInvestmentsCount}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Returned Investments Amount:</span>
                  <span className="font-semibold">
                    {typeof selectedReport.summary.returnedInvestmentsAmount === "number"
                      ? `৳${selectedReport.summary.returnedInvestmentsAmount.toLocaleString()}`
                      : typeof selectedReport.summary.returnedInvestmentsAmount === "string"
                      ? `৳${Number(selectedReport.summary.returnedInvestmentsAmount).toLocaleString()}`
                      : selectedReport.summary.returnedInvestmentsCount}
                  </span>
                </div>
              </div>

              {/* Detailed Lists */}
              <div className="space-y-4 border-t pt-4 print:space-y-2 print:pt-2">
                <h3 className="text-sm sm:text-base font-bold no-print">Summary Breakdowns</h3>

                {/* Deposits List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground">Deposit in <span className="font-bold">{getFriendlyMonthName(selectedReport.month)}</span></div>
                  <div className="overflow-x-auto border rounded-lg max-h-[220px] overflow-y-auto print-all-rows">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="px-3 py-2 font-bold">Member</th>
                          <th className="px-3 py-2 font-bold">Date</th>
                          <th className="px-3 py-2 font-bold text-right">Amount Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.details.payments.map((p: any) => (
                          <tr key={p.paymentId}>
                            <td className="px-3 py-1.5 font-bold">{p.memberName}</td>
                            <td className="px-3 py-1.5 font-bold">{p.paymentDate}</td>
                            <td className="px-3 py-1.5 font-extrabold text-right text-[var(--teal)]">
                              ৳{p.amountReceived.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {selectedReport.details.payments.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground font-bold">
                              No deposits submitted.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Outstanding Dues list */}
                <div className="space-y-2 page-break-avoid pt-2">
                  <div className="text-xs font-bold text-muted-foreground">Outstanding dues for <span className="font-bold">{getFriendlyMonthName(selectedReport.month)}</span></div>
                  <div className="overflow-x-auto border rounded-lg max-h-[220px] overflow-y-auto print-all-rows">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="px-3 py-2 font-bold">Member</th>
                          <th className="px-3 py-2 font-bold text-center">Months Overdue</th>
                          <th className="px-3 py-2 font-bold text-right">Remaining Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.details.dueList.filter((d: any) => d.due > 0).map((d: any) => (
                          <tr key={d.userId}>
                            <td className="px-3 py-1.5 font-bold">{d.name}</td>
                            <td className="px-3 py-1.5 font-bold text-center">{Math.max(1, Math.ceil(d.due / 2000))}</td>
                            <td className="px-3 py-1.5 font-extrabold text-right text-[var(--red)]">
                              ৳{d.due.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {selectedReport.details.dueList.filter((d: any) => d.due > 0).length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-[var(--green)] font-bold">
                              All outstanding dues for this month are cleared ✓
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer inside print view */}
              <div className="hidden print:flex items-center justify-between text-[9px] text-slate-500 border-t pt-2 select-none">
                <div className="font-bold">Project 13 Financial Summary Report • {getFriendlyMonthName(selectedReport.month)}</div>
                <div className="font-bold">Exported on {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
