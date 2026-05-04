"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateReport, clearOldReports } from "@/lib/actions/reports";
import { Loader2, Calendar, FileText, Download, CheckCircle, Trash2, Maximize, Minimize } from "lucide-react";

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
  returnedInvestmentsCount: number;
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
          body { background: white !important; color: black !important; }
          .print-only { display: block !important; }
          .glass { border: none !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; }
          .stat-print-box { border: 1px solid #cbd5e1 !important; padding: 12px !important; border-radius: 8px !important; }
          .print-title { font-size: 24px !important; font-weight: bold !important; border-bottom: 2px solid #cbd5e1 !important; padding-bottom: 8px !important; margin-bottom: 12px !important; }
          .print-label { font-size: 11px !important; color: #475569 !important; font-weight: 600 !important; text-transform: uppercase !important; }
          .print-value { font-size: 18px !important; font-weight: 800 !important; color: black !important; }
          .print-all-rows { max-height: none !important; overflow: visible !important; }
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
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Select Month</span>
                  <input
                    type="month"
                    min={minMonth}
                    max={maxMonth}
                    value={monthToGen}
                    onChange={(e) => setMonthToGen(e.target.value)}
                    className="w-full bg-background border border-border text-foreground text-xs sm:text-sm p-2 rounded-lg h-10 outline-none"
                  />
                </div>
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
                                <span>{r.month}</span>
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
          {!selectedReport ? (
            <div className="glass p-12 text-center text-muted-foreground flex flex-col items-center gap-2 justify-center h-full min-h-[300px] no-print">
              <Calendar className="w-10 h-10 opacity-30 animate-pulse text-[var(--teal)]" />
              <div className="text-sm font-semibold">No report selected</div>
              <p className="text-xs">Pick a monthly summary from the list to view.</p>
            </div>
          ) : (
            <div className="glass p-4 sm:p-6 space-y-6 flex flex-col justify-between h-full bg-white print:p-0 print:border-0 print:shadow-none print:text-black">
              <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-border/60">
                <div className="print-title print:w-full">
                  <h1 className="text-lg sm:text-xl font-bold">Report for {getFriendlyMonthName(selectedReport.month)}</h1>
                  <p className="text-xs text-muted-foreground mt-0.5 no-print">Complete financial reconciliation summary.</p>
                </div>
                <div className="flex items-center gap-2">
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
                  <span className="text-muted-foreground">Active Investments:</span>
                  <span className="font-semibold">{selectedReport.summary.activeInvestmentsCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Returned Investments:</span>
                  <span className="font-semibold">{selectedReport.summary.returnedInvestmentsCount}</span>
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
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground">Outstanding dues for <span className="font-bold">{getFriendlyMonthName(selectedReport.month)}</span></div>
                  <div className="overflow-x-auto border rounded-lg max-h-[220px] overflow-y-auto print-all-rows">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="px-3 py-2 font-bold">Member</th>
                          <th className="px-3 py-2 font-bold text-right">Remaining Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.details.dueList.map((d: any) => (
                          <tr key={d.userId}>
                            <td className="px-3 py-1.5 font-bold">{d.name}</td>
                            <td className={`px-3 py-1.5 font-extrabold text-right ${d.due > 0 ? "text-[var(--red)]" : "text-[var(--green)]"}`}>
                              {d.due > 0 ? `৳${d.due.toLocaleString()}` : "Cleared ✓"}
                            </td>
                          </tr>
                        ))}
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
