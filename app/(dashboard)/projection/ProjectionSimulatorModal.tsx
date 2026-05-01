"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { X, Sparkles, Save, Trash2, TrendingUp } from "lucide-react";

type HistoricalItem = {
  month: string;
  balance: number;
};

type PlannedInvestment = {
  id: string;
  name: string;
  principal: number;
  tenure: number;
  returnRate: number;
  startYear: number;
};

type SavedSimulation = {
  id: string;
  name: string;
  yearsForward: number;
  annualExpense: number;
  plannedInvestments: PlannedInvestment[];
  yearlyDepositAmounts: Record<number, number>;
  createdAt: string;
};

const fmt = (v: number) => `৳${Math.round(v).toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 text-xs space-y-1" style={{ minWidth: 170, border: "1px solid hsl(var(--border))", background: "hsl(222 47% 12%)" }}>
      <div className="font-semibold mb-2 text-muted-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color || p.fill }}>{p.name}</span>
          <span className="font-mono font-bold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function ProjectionSimulatorModal({
  isOpen,
  onClose,
  currentBalance,
  memberCount,
  monthlyPerMember,
  historicalData,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  memberCount: number;
  monthlyPerMember: number;
  historicalData: HistoricalItem[];
}) {
  const [yearsForward, setYearsForward] = useState(5);
  const [annualExpense, setAnnualExpense] = useState(50000);
  const [plannedInvestments, setPlannedInvestments] = useState<PlannedInvestment[]>([]);

  // Custom Deposit Amounts for each of the projected years
  const [yearlyDepositAmounts, setYearlyDepositAmounts] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (let y = 1; y <= 10; y++) {
      init[y] = monthlyPerMember || 2100;
    }
    return init;
  });

  // Local storage management
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [simName, setSimName] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_projections_v2");
      if (stored) {
        setSavedSims(JSON.parse(stored).slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to load saved projections", err);
    }
  }, []);

  if (!isOpen) return null;

  function saveSimulation() {
    if (!simName.trim()) return;
    const newSim: SavedSimulation = {
      id: Math.random().toString(36).slice(2),
      name: simName.trim(),
      yearsForward,
      annualExpense,
      plannedInvestments,
      yearlyDepositAmounts,
      createdAt: new Date().toLocaleDateString(),
    };
    const updated = [newSim, ...savedSims].slice(0, 3);
    setSavedSims(updated);
    localStorage.setItem("saved_projections_v2", JSON.stringify(updated));
    setSimName("");
  }

  function deleteSimulation(id: string) {
    const updated = savedSims.filter((s) => s.id !== id);
    setSavedSims(updated);
    localStorage.setItem("saved_projections_v2", JSON.stringify(updated));
  }

  function loadSimulation(sim: SavedSimulation) {
    setYearsForward(sim.yearsForward);
    setAnnualExpense(sim.annualExpense);
    setPlannedInvestments(sim.plannedInvestments);
    if (sim.yearlyDepositAmounts) {
      setYearlyDepositAmounts(sim.yearlyDepositAmounts);
    }
  }

  function updateDepositAmount(y: number, value: number) {
    setYearlyDepositAmounts({ ...yearlyDepositAmounts, [y]: value });
  }

  function addInvestment() {
    const newInv: PlannedInvestment = {
      id: Math.random().toString(36).slice(2),
      name: `Investment ${plannedInvestments.length + 1}`,
      principal: 100000,
      tenure: 2,
      returnRate: 15,
      startYear: 1,
    };
    setPlannedInvestments([...plannedInvestments, newInv]);
  }

  function removeInvestment(id: string) {
    setPlannedInvestments(plannedInvestments.filter((i) => i.id !== id));
  }

  function updateInvestment(id: string, patch: Partial<PlannedInvestment>) {
    setPlannedInvestments(plannedInvestments.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  // Projection year by year
  const currentYear = new Date().getFullYear();
  const chartData: any[] = historicalData.map((d) => ({
    label: d.month,
    balance: d.balance,
    type: "Historical",
  }));

  let projectedBal = currentBalance;

  for (let y = 1; y <= yearsForward; y++) {
    // 1. Deposits for the year explicitly entered
    const monthlyDeposit = yearlyDepositAmounts[y] || monthlyPerMember || 2100;
    const annualDeposit = monthlyDeposit * memberCount * 12;
    projectedBal += annualDeposit;

    // 2. Expenses for the year
    projectedBal -= annualExpense;

    // 3. Planned Investments for the year
    plannedInvestments.forEach((inv) => {
      if (inv.startYear === y) {
        projectedBal -= inv.principal;
      }
      if (inv.startYear + inv.tenure === y) {
        projectedBal += inv.principal * (1 + (inv.returnRate / 100) * inv.tenure);
      }
    });

    chartData.push({
      label: `Year ${y} (${currentYear + y})`,
      balance: Math.max(0, projectedBal),
      type: "Projected",
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground p-5 overflow-y-auto flex flex-col gap-5 backdrop-blur-md" style={{ background: "hsl(222 47% 7% / 95%)" }}>
      {/* Simulation Modal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5">
          <Sparkles size={20} className="text-teal" style={{ color: "var(--teal)" }} />
          <div>
            <h2 className="text-lg font-bold tracking-tight">Fund Growth & Balance Projection</h2>
            <p className="text-xs text-muted-foreground">Simulate long-term cash balance by directly modifying annual deposit plans</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-muted/60 hover:bg-muted text-foreground transition"
        >
          <X size={15} /> Close Simulation
        </button>
      </div>

      {/* Grid: Inputs vs Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Controls Column */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)] p-0.5">
          {/* Main Parameters */}
          <div className="glass p-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Projection Duration</div>
            <div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={yearsForward}
                onChange={(e) => setYearsForward(Number(e.target.value))}
                className="w-full h-1"
                style={{ accentColor: "var(--teal)" }}
              />
              <div className="flex justify-between text-xs mt-0.5 text-muted-foreground font-medium">
                <span>1 Year</span>
                <span className="font-bold text-teal" style={{ color: "var(--teal)" }}>{yearsForward} Years</span>
                <span>10 Years</span>
              </div>
            </div>
          </div>

          {/* Explicit Monthly Deposit Plans per Year */}
          <div className="glass p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Deposit Amount by Year</div>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-0.5">
              {Array.from({ length: yearsForward }).map((_, i) => {
                const y = i + 1;
                return (
                  <div key={y} className="flex flex-col gap-1 p-2 rounded-xl border bg-muted/20" style={{ borderColor: "hsl(var(--border))" }}>
                    <label className="text-[10px] font-semibold text-muted-foreground">Year {y} ({currentYear + y})</label>
                    <input
                      type="number"
                      min={0}
                      value={yearlyDepositAmounts[y] || 2100}
                      onChange={(e) => updateDepositAmount(y, Number(e.target.value))}
                      className="h-8 w-full rounded bg-muted/60 border border-border px-2 text-xs font-mono outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expenses */}
          <div className="glass p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Annual Fund Expenses (BDT)</label>
            <input
              type="number"
              min={0}
              value={annualExpense}
              onChange={(e) => setAnnualExpense(Number(e.target.value))}
              className="w-full h-9 rounded-lg px-3 text-sm outline-none"
              style={{ background: "hsl(222 47% 12%)", border: "1px solid hsl(var(--border))" }}
            />
          </div>

          {/* Investments */}
          <div className="glass p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Return Scenario</div>
              <button
                onClick={addInvestment}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted border border-border font-medium"
              >
                + Scenario
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[160px] p-0.5">
              {plannedInvestments.map((inv) => (
                <div key={inv.id} className="p-2.5 rounded-xl border flex flex-col gap-1.5 relative bg-muted/40" style={{ borderColor: "hsl(var(--border))" }}>
                  <button
                    onClick={() => removeInvestment(inv.id)}
                    className="absolute top-1.5 right-2 text-muted-foreground hover:text-red-400 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                  <input
                    type="text"
                    value={inv.name}
                    onChange={(e) => updateInvestment(inv.id, { name: e.target.value })}
                    className="text-xs font-semibold bg-transparent outline-none w-5/6"
                  />
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="block text-muted-foreground">Principal (BDT)</span>
                      <input
                        type="number"
                        value={inv.principal}
                        onChange={(e) => updateInvestment(inv.id, { principal: Number(e.target.value) })}
                        className="w-full h-6 mt-0.5 px-1.5 rounded bg-muted/60 border border-border outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Return (%)</span>
                      <input
                        type="number"
                        value={inv.returnRate}
                        onChange={(e) => updateInvestment(inv.id, { returnRate: Number(e.target.value) })}
                        className="w-full h-6 mt-0.5 px-1.5 rounded bg-muted/60 border border-border outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {plannedInvestments.length === 0 && (
                <div className="text-center text-xs text-muted-foreground my-auto italic">No investments added.</div>
              )}
            </div>
          </div>
        </div>

        {/* Output Curve Column */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Output Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass p-3 flex flex-col justify-between">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Initial Capital</div>
              <div className="text-xl font-bold mt-1 text-teal" style={{ color: "var(--teal)" }}>{fmt(currentBalance)}</div>
            </div>
            <div className="glass p-3 flex flex-col justify-between">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Target Capital</div>
              <div className="text-xl font-bold mt-1 text-purple" style={{ color: "var(--purple)" }}>{fmt(projectedBal)}</div>
            </div>
            <div className="glass p-3 flex flex-col justify-between">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Net Surplus</div>
              <div className="text-xl font-bold mt-1" style={{ color: projectedBal >= currentBalance ? "var(--green)" : "var(--red)" }}>
                {projectedBal >= currentBalance ? "+" : ""}{fmt(projectedBal - currentBalance)}
              </div>
            </div>
          </div>

          {/* Area Chart */}
          <div className="glass p-4 flex-1 flex flex-col gap-3 min-h-[300px]">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Historical & Projected Continuity</div>
            <div className="w-full flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalanceModal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={25}
                  />
                  <YAxis
                    tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Total BDT"
                    stroke="var(--teal)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBalanceModal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Persistence */}
          <div className="glass p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <input
                type="text"
                maxLength={20}
                placeholder="Unique Name..."
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs outline-none bg-muted/60 border border-border"
              />
              <button
                disabled={!simName.trim() || savedSims.length >= 3}
                onClick={saveSimulation}
                style={{ background: simName.trim() && savedSims.length < 3 ? "var(--teal)" : "hsl(var(--muted))", color: simName.trim() && savedSims.length < 3 ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))" }}
                className="flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer"
              >
                <Save size={13} /> Save Scenario ({savedSims.length}/3)
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {savedSims.map((sim) => (
                <div key={sim.id} className="p-2 rounded-lg border flex flex-col gap-0.5 text-xs bg-muted/20" style={{ borderColor: "hsl(var(--border))" }}>
                  <div className="font-semibold text-teal" style={{ color: "var(--teal)" }}>{sim.name}</div>
                  <div className="text-[10px] text-muted-foreground">{sim.yearsForward}y projection</div>
                  <div className="flex gap-1 mt-0.5">
                    <button
                      onClick={() => loadSimulation(sim)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/10"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteSimulation(sim.id)}
                      className="text-[10px] px-1.5 py-0.5 rounded text-red-400 hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
