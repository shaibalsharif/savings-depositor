"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Maximize2, Minimize2, Plus, Trash2, Save, Sparkles } from "lucide-react";
import { format } from "date-fns";

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
  depositIncrementPct: number;
  annualExpense: number;
  plannedInvestments: PlannedInvestment[];
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

export function ProjectionSimulator({
  currentBalance,
  currentAnnualDeposits,
  memberCount,
  monthlyPerMember,
  historicalData,
}: {
  currentBalance: number;
  currentAnnualDeposits: number;
  memberCount: number;
  monthlyPerMember: number;
  historicalData: HistoricalItem[];
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [yearsForward, setYearsForward] = useState(5);
  const [depositIncrementPct, setDepositIncrementPct] = useState(5); // yearly increase
  const [annualExpense, setAnnualExpense] = useState(50000);
  const [plannedInvestments, setPlannedInvestments] = useState<PlannedInvestment[]>([]);

  // Local storage management
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [simName, setSimName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_projections");
      if (stored) {
        setSavedSims(JSON.parse(stored).slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to load saved projections", err);
    }
  }, []);

  function saveSimulation() {
    if (!simName.trim()) return;
    const newSim: SavedSimulation = {
      id: Math.random().toString(36).slice(2),
      name: simName.trim(),
      yearsForward,
      depositIncrementPct,
      annualExpense,
      plannedInvestments,
      createdAt: new Date().toLocaleDateString(),
    };
    const updated = [newSim, ...savedSims].slice(0, 3);
    setSavedSims(updated);
    localStorage.setItem("saved_projections", JSON.stringify(updated));
    setSimName("");
  }

  function deleteSimulation(id: string) {
    const updated = savedSims.filter((s) => s.id !== id);
    setSavedSims(updated);
    localStorage.setItem("saved_projections", JSON.stringify(updated));
  }

  function loadSimulation(sim: SavedSimulation) {
    setYearsForward(sim.yearsForward);
    setDepositIncrementPct(sim.depositIncrementPct);
    setAnnualExpense(sim.annualExpense);
    setPlannedInvestments(sim.plannedInvestments);
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

  // Generate continuous line of Past + Future
  const currentYear = new Date().getFullYear();
  const chartData: any[] = historicalData.map((d) => ({
    label: d.month,
    balance: d.balance,
    type: "Historical",
  }));

  // Append projection year by year
  let projectedBal = currentBalance;
  let annualDeposit = currentAnnualDeposits;

  for (let y = 1; y <= yearsForward; y++) {
    // 1. Deposits for the year
    annualDeposit = annualDeposit * (1 + depositIncrementPct / 100);
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

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background text-foreground p-6 overflow-y-auto flex flex-col gap-6"
    : "glass p-5 flex flex-col gap-6";

  const btnStyle = { background: "var(--teal)", color: "hsl(222 47% 7%)" };

  return (
    <div className={wrapperClass}>
      {/* Simulation Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-teal" style={{ color: "var(--teal)" }} />
          <h2 className="text-lg font-semibold tracking-tight">Simulator Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          {isFullscreen ? (
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium border"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              <Minimize2 size={13} /> Exit Fullscreen
            </button>
          ) : (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium border"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              <Maximize2 size={13} /> Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Controls vs Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Main Parameters */}
          <div className="glass p-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">General Setup</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Projection Duration (Years)</label>
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
                <div className="flex justify-between text-xs mt-0.5 text-muted-foreground">
                  <span>1 Year</span>
                  <span className="font-bold text-teal" style={{ color: "var(--teal)" }}>{yearsForward} Years</span>
                  <span>10 Years</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Yearly Deposit Increment (%)</label>
                <input
                  type="number"
                  min={-50}
                  max={100}
                  value={depositIncrementPct}
                  onChange={(e) => setDepositIncrementPct(Number(e.target.value))}
                  className="w-full h-9 rounded-lg px-3 text-sm outline-none"
                  style={{ background: "hsl(222 47% 12%)", border: "1px solid hsl(var(--border))" }}
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Annual Fund Expenses (BDT)</label>
                <input
                  type="number"
                  min={0}
                  value={annualExpense}
                  onChange={(e) => setAnnualExpense(Number(e.target.value))}
                  className="w-full h-9 rounded-lg px-3 text-sm outline-none"
                  style={{ background: "hsl(222 47% 12%)", border: "1px solid hsl(var(--border))" }}
                />
              </div>
            </div>
          </div>

          {/* Investments setup */}
          <div className="glass p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Planned Investments</div>
              <button
                onClick={addInvestment}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                style={{ background: "hsl(var(--accent))", border: "1px solid hsl(var(--border))" }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[220px] p-0.5">
              {plannedInvestments.map((inv) => (
                <div key={inv.id} className="p-3 rounded-xl border flex flex-col gap-2 relative bg-muted/40" style={{ borderColor: "hsl(var(--border))" }}>
                  <button
                    onClick={() => removeInvestment(inv.id)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>

                  <input
                    type="text"
                    value={inv.name}
                    onChange={(e) => updateInvestment(inv.id, { name: e.target.value })}
                    className="text-xs font-semibold bg-transparent outline-none w-5/6"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Principal</span>
                      <input
                        type="number"
                        value={inv.principal}
                        onChange={(e) => updateInvestment(inv.id, { principal: Number(e.target.value) })}
                        className="w-full h-7 mt-0.5 px-2 rounded bg-muted/60 border border-border outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Return Rate (%)</span>
                      <input
                        type="number"
                        value={inv.returnRate}
                        onChange={(e) => updateInvestment(inv.id, { returnRate: Number(e.target.value) })}
                        className="w-full h-7 mt-0.5 px-2 rounded bg-muted/60 border border-border outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Tenure (Years)</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={inv.tenure}
                        onChange={(e) => updateInvestment(inv.id, { tenure: Number(e.target.value) })}
                        className="w-full h-7 mt-0.5 px-2 rounded bg-muted/60 border border-border outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Starts in Year</span>
                      <input
                        type="number"
                        min={1}
                        max={yearsForward}
                        value={inv.startYear}
                        onChange={(e) => updateInvestment(inv.id, { startYear: Number(e.target.value) })}
                        className="w-full h-7 mt-0.5 px-2 rounded bg-muted/60 border border-border outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {plannedInvestments.length === 0 && (
                <div className="text-center text-xs text-muted-foreground my-auto">No planned investments added yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Visualizer & Chart Column */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Output Chart and High-level stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass p-4">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Starting Fund</div>
              <div className="text-xl font-bold mt-1 text-teal" style={{ color: "var(--teal)" }}>{fmt(currentBalance)}</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Ending Projected</div>
              <div className="text-xl font-bold mt-1 text-purple" style={{ color: "var(--purple)" }}>{fmt(projectedBal)}</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Total Projected Growth</div>
              <div className="text-xl font-bold mt-1" style={{ color: projectedBal >= currentBalance ? "var(--green)" : "var(--red)" }}>
                {projectedBal >= currentBalance ? "+" : ""}{fmt(projectedBal - currentBalance)}
              </div>
            </div>
          </div>

          <div className="glass p-4 flex-1 flex flex-col gap-3 min-h-[300px]">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Historical & Projected Balance Curve</div>
            <div className="w-full flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
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
                    name="Balance"
                    stroke="var(--teal)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LocalStorage Saving and Management */}
          <div className="glass p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                maxLength={25}
                placeholder="Simulation Name..."
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs outline-none bg-muted/60 border border-border"
              />
              <button
                disabled={!simName.trim() || savedSims.length >= 3}
                onClick={saveSimulation}
                style={simName.trim() && savedSims.length < 3 ? btnStyle : {}}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold"
              >
                <Save size={13} /> {savedSims.length >= 3 ? "Limit Reached" : "Save Scenario"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {savedSims.map((sim) => (
                <div key={sim.id} className="p-2.5 rounded-xl border flex flex-col gap-1 text-xs bg-muted/20" style={{ borderColor: "hsl(var(--border))" }}>
                  <div className="font-semibold text-teal" style={{ color: "var(--teal)" }}>{sim.name}</div>
                  <div className="text-[10px] text-muted-foreground">{sim.createdAt} • {sim.yearsForward}y</div>
                  <div className="flex gap-1 mt-1 justify-between">
                    <button
                      onClick={() => loadSimulation(sim)}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted-foreground/10"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteSimulation(sim.id)}
                      className="text-[10px] px-2 py-0.5 rounded text-red-400 hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {savedSims.length === 0 && (
                <div className="text-xs text-muted-foreground italic">No saved simulations.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
