"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateReport } from "@/lib/actions/reports";
import { Loader2, Calendar, FileText, Download, CheckCircle, AlertTriangle } from "lucide-react";

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

export function ReportsManagement({
  availableReports,
  selectedReport,
}: {
  availableReports: ReportItem[];
  selectedReport: ViewableReport | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [monthToGen, setMonthToGen] = useState("");

  const handleGenerate = async () => {
    if (!monthToGen) {
      toast.error("Please pick a month to generate");
      return;
    }

    // validate format
    if (!/^\d{4}-\d{2}$/.test(monthToGen)) {
      toast.error("Format must be YYYY-MM");
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

  const selectReport = (month: string) => {
    router.push(`/settings/reports?month=${month}`);
  };

  const handlePrint = () => {
    if (!selectedReport) return;
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-3 text-sm select-none">
        <button
          onClick={() => router.push("/settings/deposits")}
          className="text-muted-foreground hover:text-foreground"
        >
          Deposit Settings
        </button>
        <button
          onClick={() => router.push("/settings/sync")}
          className="text-muted-foreground hover:text-foreground"
        >
          Google Sheets Sync
        </button>
        <button
          onClick={() => router.push("/settings/reports")}
          className="font-bold text-[var(--teal)] border-b-2 border-[var(--teal)] pb-2.5 -mb-3.5"
        >
          Monthly Reports
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Management & List */}
        <div className="space-y-6 lg:col-span-1 select-none">
          {/* Generation form */}
          <div className="glass p-4 sm:p-5 space-y-3.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold">Generate New Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Generate immutable summaries for completed months.</p>
            </div>
            <div className="space-y-2.5">
              <input
                type="month"
                value={monthToGen}
                onChange={(e) => setMonthToGen(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-xs sm:text-sm p-2 rounded-lg h-10 outline-none"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full px-4 py-2 bg-[var(--teal)] text-[hsl(222 47% 7%)] font-semibold text-xs sm:text-sm rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 select-none"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Report
              </button>
            </div>
          </div>

          {/* List of generated reports */}
          <div className="glass p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold">Generated Reports</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Select a month to view or print the details.</p>
            </div>
            <div className="divide-y border border-border rounded-lg bg-card overflow-hidden">
              {availableReports.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No generated reports yet.
                </div>
              ) : (
                availableReports.map((r) => (
                  <button
                    key={r.month}
                    onClick={() => selectReport(r.month)}
                    className={`w-full flex items-center justify-between p-3.5 text-xs font-medium text-left hover:bg-accent transition ${
                      selectedReport?.month === r.month ? "bg-accent text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-muted-foreground" />
                      <span>{r.month}</span>
                    </div>
                    <CheckCircle size={14} className="text-[var(--teal)] opacity-60" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Report Details */}
        <div className="lg:col-span-2 select-none print:hidden">
          {!selectedReport ? (
            <div className="glass p-12 text-center text-muted-foreground flex flex-col items-center gap-2 justify-center h-full">
              <Calendar className="w-10 h-10 opacity-30 animate-pulse text-[var(--teal)]" />
              <div className="text-sm font-semibold">No report selected</div>
              <p className="text-xs">Pick a generated report from the list to view its details.</p>
            </div>
          ) : (
            <div className="glass p-4 sm:p-6 space-y-6 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">Report for {selectedReport.month}</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Complete financial reconciliation summary.</p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 border border-border bg-background rounded-lg text-xs font-semibold hover:bg-accent flex items-center gap-2 select-none"
                >
                  <Download size={15} />
                  Print / Download PDF
                </button>
              </div>

              {/* Summary blocks */}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {[
                  { label: "Starting Balance", value: `৳${selectedReport.summary.startingBalance.toLocaleString()}` },
                  { label: "Month's Input", value: `৳${selectedReport.summary.thisCollected.toLocaleString()}` },
                  { label: "Expense (This Month)", value: `৳${selectedReport.summary.thisExpensesAmount.toLocaleString()}` },
                  { label: "Balance At End", value: `৳${selectedReport.summary.balance.toLocaleString()}`, accent: "var(--teal)" },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 sm:p-4 border rounded-xl bg-muted/20">
                    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                    <div className="text-sm sm:text-base md:text-xl font-bold mt-1" style={{ color: stat.accent }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Extra summary details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-border p-3 rounded-lg bg-muted/10">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Previous Total Expenses:</span>
                  <span className="font-semibold">৳{selectedReport.summary.prevTotalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Net Revenue (Month):</span>
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

              {/* List details (Scrollable on desktop) */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm sm:text-base font-bold">Month Detail Lists</h3>

                {/* Outstanding Dues list */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Due list of that month (Missed / Partial)</div>
                  <div className="overflow-x-auto border rounded-lg max-h-[250px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="px-3 py-2">Member</th>
                          <th className="px-3 py-2 text-right">Dues Missing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.details.dueList.map((d) => (
                          <tr key={d.userId} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">{d.name}</td>
                            <td className={`px-3 py-2 font-bold text-right ${d.due > 0 ? "text-[var(--red)]" : "text-[var(--green)]"}`}>
                              {d.due > 0 ? `৳${d.due.toLocaleString()}` : "Cleared ✓"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Deposits */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Deposits Submitted</div>
                  <div className="overflow-x-auto border rounded-lg max-h-[250px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="px-3 py-2">Payment ID</th>
                          <th className="px-3 py-2">Member</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.details.payments.map((p) => (
                          <tr key={p.paymentId}>
                            <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{p.paymentId}</td>
                            <td className="px-3 py-2">{p.memberName}</td>
                            <td className="px-3 py-2">{p.paymentDate}</td>
                            <td className="px-3 py-2 font-semibold text-right text-[var(--teal)]">
                              ৳{p.amountReceived.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {selectedReport.details.payments.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                              No deposits submitted.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expenses */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Expenses Recorded</div>
                  <div className="overflow-x-auto border rounded-lg max-h-[250px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 sticky top-0 backdrop-blur">
                        <tr>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.details.expenses.map((e) => (
                          <tr key={e.entryId}>
                            <td className="px-3 py-2">{e.description}</td>
                            <td className="px-3 py-2">{e.expenseDate}</td>
                            <td className="px-3 py-2 font-semibold text-right text-[var(--amber)]">
                              -৳{e.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {selectedReport.details.expenses.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                              No expenses recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── HIGH FIDELITY VISUAL PRINT LAYOUT ONLY ── */}
      {selectedReport && (
        <div className="hidden print:block font-serif text-black bg-white p-3 space-y-4 max-w-4xl mx-auto text-xs min-h-screen">
          {/* Print Header */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Project 13 Financial Summary</h1>
              <p className="text-xs text-slate-600">Report Month: {selectedReport.month}</p>
            </div>
            <div className="text-right text-xs">
              <div>System: Generated Report</div>
              <div>Timestamp: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* KPI overview */}
          <div className="grid grid-cols-4 gap-2 text-center border-b pb-2">
            <div className="border border-slate-300 p-2 rounded">
              <div className="text-[9px] font-bold text-slate-600 uppercase">Starting Balance</div>
              <div className="text-base font-extrabold mt-0.5">৳{selectedReport.summary.startingBalance.toLocaleString()}</div>
            </div>
            <div className="border border-slate-300 p-2 rounded">
              <div className="text-[9px] font-bold text-slate-600 uppercase">This Month Input</div>
              <div className="text-base font-extrabold mt-0.5">৳{selectedReport.summary.thisCollected.toLocaleString()}</div>
            </div>
            <div className="border border-slate-300 p-2 rounded">
              <div className="text-[9px] font-bold text-slate-600 uppercase">Month Expenses</div>
              <div className="text-base font-extrabold mt-0.5">৳{selectedReport.summary.thisExpensesAmount.toLocaleString()}</div>
            </div>
            <div className="border border-slate-300 p-2 rounded">
              <div className="text-[9px] font-bold text-slate-600 uppercase">Final Balance</div>
              <div className="text-base font-extrabold mt-0.5">৳{selectedReport.summary.balance.toLocaleString()}</div>
            </div>
          </div>

          {/* Details list inside Print page */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="text-sm font-bold border-b pb-1 mb-1">Due list of {selectedReport.month}</h3>
              <table className="w-full text-[10px] text-left border divide-y">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-1">Member</th>
                    <th className="p-1 text-right">Remaining Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedReport.details.dueList.map((d) => (
                    <tr key={d.userId}>
                      <td className="p-1">{d.name}</td>
                      <td className="p-1 font-bold text-right">৳{d.due.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-sm font-bold border-b pb-1 mb-1">Deposits in {selectedReport.month}</h3>
              <table className="w-full text-[10px] text-left border divide-y">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-1">Payment ID</th>
                    <th className="p-1">Member</th>
                    <th className="p-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedReport.details.payments.slice(0, 15).map((p) => (
                    <tr key={p.paymentId}>
                      <td className="p-1 font-mono text-[9px]">{p.paymentId}</td>
                      <td className="p-1">{p.memberName}</td>
                      <td className="p-1 font-bold text-right">৳{p.amountReceived.toLocaleString()}</td>
                    </tr>
                  ))}
                  {selectedReport.details.payments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-1 text-center text-slate-500">
                        No deposits
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-2 flex items-center justify-between text-[9px] text-slate-500">
            <div>Project 13 • Internal Financial Summary</div>
            <div>Generated securely on {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
