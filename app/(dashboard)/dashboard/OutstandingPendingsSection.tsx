"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Search, Filter, SortDesc, SortAsc } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type MemberPending = {
  memberId: string;
  name: string;
  photo?: string | null;
  due: number;
  breakdown: { month: string; expected: number; paid: number; due: number }[];
};

export function OutstandingPendingsSection({
  memberPendings,
  totalOutstanding,
}: {
  memberPendings: MemberPending[];
  totalOutstanding: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"due-desc" | "due-asc" | "name">("due-desc");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get all unique months from breakdowns to offer as filters
  const allMonths = Array.from(
    new Set(
      memberPendings.flatMap((m) => m.breakdown.map((b) => b.month))
    )
  ).sort();

  // Toggle month filter
  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  // Filter and sort members for the modal view
  const filteredMembers = memberPendings
    .map((m) => {
      // If any months are selected, filter breakdowns to only those months
      if (selectedMonths.length === 0) return m;
      const filteredBreakdown = m.breakdown.filter((b) => selectedMonths.includes(b.month));
      const filteredDue = filteredBreakdown.reduce((sum, b) => sum + b.due, 0);
      return { ...m, due: filteredDue, breakdown: filteredBreakdown };
    })
    .filter((m) => m.due > 0)
    .filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "due-desc") return b.due - a.due;
      if (sortBy === "due-asc") return a.due - b.due;
      return a.name.localeCompare(b.name);
    });

  // --- Calculate Metrics for the Metrics Ribbon ---
  const filteredTotalDue = filteredMembers.reduce((sum, m) => sum + m.due, 0);
  const totalExpected = filteredMembers.reduce((sum, m) => 
    sum + m.breakdown.reduce((bSum, b) => bSum + b.expected, 0), 0
  );
  const totalPaid = filteredMembers.reduce((sum, m) => 
    sum + m.breakdown.reduce((bSum, b) => bSum + b.paid, 0), 0
  );
  const recoveryRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 100;
  
  const uniqueDelinquentMonths = new Set(filteredMembers.flatMap(m => m.breakdown.map(b => b.month))).size;
  const avgDuePerMember = filteredMembers.length > 0 ? filteredTotalDue / filteredMembers.length : 0;

  // Find heaviest month and year
  const monthMap: Record<string, number> = {};
  const yearMap: Record<string, number> = {};
  filteredMembers.forEach(m => {
    m.breakdown.forEach(b => {
      monthMap[b.month] = (monthMap[b.month] || 0) + b.due;
      const yr = b.month.split("-")[0];
      yearMap[yr] = (yearMap[yr] || 0) + b.due;
    });
  });

  const heaviestMonth = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const badYear = Object.entries(yearMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Color grade based on proportion of total outstanding dues
  const getColorGrade = (due: number) => {
    const pct = totalOutstanding > 0 ? (due / totalOutstanding) * 100 : 0;
    if (pct >= 15) return "text-[var(--red)]";
    if (pct >= 5) return "text-[var(--amber)]";
    return "text-[var(--teal)]";
  };

  return (
    <div className="glass flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:px-5 sm:pt-5 sm:pb-3 flex-wrap gap-2">
        <h2 className="text-xs sm:text-sm font-semibold">Outstanding Pendings</h2>
        <div className="flex gap-2">
          {memberPendings.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs font-medium text-[var(--teal)] select-none hover:underline"
            >
              See All →
            </button>
          )}
          <Link href="/deposits/new" className="text-xs font-medium text-[var(--teal)] select-none">
            Record Deposit →
          </Link>
        </div>
      </div>

      <div className="divide-y border-t flex-1" style={{ borderColor: "hsl(var(--border))" }}>
        {memberPendings.length === 0 ? (
          <div className="p-4 sm:p-5 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
            🎉 All members are fully paid!
          </div>
        ) : (
          memberPendings.slice(0, 8).map((m) => {
            const pct = totalOutstanding > 0 ? (m.due / totalOutstanding) * 100 : 0;
            return (
              <div key={m.memberId} className="flex items-center justify-between p-3 sm:px-5 sm:py-3.5 transition">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold bg-muted text-foreground border border-border flex-shrink-0">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{m.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-medium line-clamp-1 ${getColorGrade(m.due)}`}>
                      {m.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {pct.toFixed(1)}% of total due
                    </span>
                  </div>
                </div>
                <span className={`text-xs sm:text-sm font-bold ${getColorGrade(m.due)}`}>
                  ৳{m.due.toLocaleString()}
                </span>
              </div>
            );
          })
        )}
      </div>

      {memberPendings.length > 8 && (
        <div className="p-3 border-t text-[10px] text-center text-muted-foreground" style={{ borderColor: "hsl(var(--border))" }}>
          +{memberPendings.length - 8} more with dues
        </div>
      )}

      {/* See All Modal - Using UI Dialog for reliable portaling and full-body width */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden sm:max-w-7xl border-none shadow-2xl bg-background">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-border flex items-center justify-between flex-shrink-0 bg-background">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">Outstanding Dues Breakdown</DialogTitle>
                <p className="text-xs text-muted-foreground">Detailed allocation status and contribution impact for each member.</p>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 sm:px-6 border-b border-border bg-muted/20 space-y-4 flex-shrink-0 select-none">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search & Sort */}
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by member name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-background border border-border text-foreground text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg h-9 outline-none focus:border-teal-500/50"
                    />
                  </div>

                  {/* Sorting */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    <div className="flex gap-1 bg-background border border-border p-0.5 rounded-lg">
                      {[
                        { id: "due-desc", icon: <SortDesc size={14} />, label: "Due High" },
                        { id: "due-asc", icon: <SortAsc size={14} />, label: "Due Low" },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => setSortBy(btn.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] sm:text-xs rounded-md font-medium capitalize select-none transition ${
                            sortBy === btn.id
                              ? "bg-[var(--teal)] text-[hsl(222 47% 7%)]"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          {btn.icon}
                          <span>{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2 lg:items-center">
                  {[
                    { label: "Total Due", value: `৳${filteredTotalDue.toLocaleString()}`, color: "var(--red)" },
                    { label: "Unique Months", value: `${uniqueDelinquentMonths}`, color: "var(--amber)" },
                    { label: "Bad Year", value: badYear, color: "var(--purple)" },
                    { label: "Heaviest", value: heaviestMonth, color: "var(--teal)" },
                    { label: "Recovery", value: `${recoveryRate.toFixed(1)}%`, color: "var(--green)" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-background/60 border border-border/50 px-3 py-1.5 rounded-lg flex flex-col min-w-[80px]">
                      <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold">{stat.label}</span>
                      <span className="text-xs sm:text-sm font-extrabold truncate" style={{ color: stat.color }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Month Multi-Select */}
              {allMonths.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80">Select Target Months:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 flex-wrap">
                    {allMonths.map((month) => (
                      <button
                        key={month}
                        onClick={() => toggleMonth(month)}
                        className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium transition select-none flex-shrink-0 border ${
                          selectedMonths.includes(month)
                            ? "bg-[var(--teal)] text-[hsl(222 47% 7%)] border-[var(--teal)]"
                            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                    {selectedMonths.length > 0 && (
                      <button 
                        onClick={() => setSelectedMonths([])}
                        className="text-[10px] px-2 py-1 text-red-400 hover:text-red-300 font-bold uppercase tracking-tighter"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results Grid / List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
              {filteredMembers.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12">
                  No matching members found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMembers.map((m) => {
                    const pct = totalOutstanding > 0 ? (m.due / totalOutstanding) * 100 : 0;
                    return (
                      <div
                        key={m.memberId}
                        className="glass p-4 rounded-xl border border-border flex flex-col justify-between gap-3 h-full"
                      >
                        {/* Member overview */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold bg-muted text-foreground border border-border flex-shrink-0">
                              {m.photo ? (
                                <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                              ) : (
                                <span>{m.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className={`text-sm sm:text-base font-bold ${getColorGrade(m.due)}`}>
                                {m.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Account Balance Required
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm sm:text-base font-extrabold ${getColorGrade(m.due)}`}>
                              ৳{m.due.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {pct.toFixed(1)}% of total due
                            </div>
                          </div>
                        </div>

                        {/* Breakdown per month */}
                        <div className="border-t border-dashed pt-3 space-y-1 mt-1">
                          <div className="text-[10px] text-muted-foreground mb-1">Month-wise breakdown</div>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {m.breakdown.map((b) => (
                              <div key={b.month} className="flex items-center justify-between py-0.5">
                                <span className="font-mono text-[11px] text-muted-foreground">{b.month}</span>
                                <span className="text-muted-foreground">
                                  Paid <span className="text-foreground">৳{b.paid.toLocaleString()}</span> / Expected <span className="text-foreground">৳{b.expected.toLocaleString()}</span>
                                </span>
                                <span className={`font-semibold ${getColorGrade(b.due)}`}>
                                  ৳{b.due.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
