"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { previewBatchAllocations, createBatchPayments } from "@/lib/actions/deposits";
import { getMemberOutstandingMonths, type OutstandingMonth } from "@/lib/actions/outstanding";
import { toast } from "sonner";
import { Loader2, Check, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type Member = { id: string; name: string; mobile: string; position: string };

type BatchPreviewItem = {
  memberId: string;
  memberName: string;
  amount: number;
  allocations: { forMonth: string; amountAllocated: number }[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "hsl(168 84% 32%)", "hsl(270 70% 50%)", "hsl(38 92% 45%)",
  "hsl(220 70% 50%)", "hsl(340 82% 50%)", "hsl(185 74% 38%)",
  "hsl(30 80% 48%)", "hsl(260 65% 55%)", "hsl(145 60% 36%)",
];

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[Number(mo) - 1]} '${y.slice(2)}`;
}

// Per-member data including outstanding months and custom amount
type MemberData = {
  outstanding: OutstandingMonth[];
  selectedMonths: string[];
  amount: number;
};

export function DepositForm({
  members,
  monthlyAmount,
}: {
  members: Member[];
  monthlyAmount: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Multi-member selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [memberData, setMemberData] = useState<Record<string, MemberData>>({});
  const [loadingMember, setLoadingMember] = useState<string | null>(null);

  // Shared fields
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  // Batch preview
  const [batchPreview, setBatchPreview] = useState<BatchPreviewItem[]>([]);

  const currentMonth = format(new Date(), "yyyy-MM");

  async function toggleMember(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      return;
    }

    setSelectedIds((prev) => [...prev, id]);

    // Load outstanding if not already loaded
    if (!memberData[id]) {
      setLoadingMember(id);
      try {
        const months = await getMemberOutstandingMonths(id);
        const outstanding = months.filter((m) => m.remaining > 0);
        // Default: auto-select current month if outstanding, else oldest
        let defaultMonths: string[] = [];
        const curr = outstanding.find((m) => m.month === currentMonth);
        if (curr) defaultMonths = [currentMonth];
        else if (outstanding.length > 0) defaultMonths = [outstanding[0].month];

        const defaultAmount = defaultMonths.reduce(
          (sum, mo) => sum + (outstanding.find((o) => o.month === mo)?.remaining ?? 0), 0
        );

        setMemberData((prev) => ({
          ...prev,
          [id]: { outstanding, selectedMonths: defaultMonths, amount: defaultAmount },
        }));
      } catch {
        toast.error("Failed to load member data");
        setSelectedIds((prev) => prev.filter((x) => x !== id));
      } finally {
        setLoadingMember(null);
      }
    }
  }

  function toggleMonth(memberId: string, month: string) {
    setMemberData((prev) => {
      const data = prev[memberId];
      if (!data) return prev;
      const next = data.selectedMonths.includes(month)
        ? data.selectedMonths.filter((m) => m !== month)
        : [...data.selectedMonths, month].sort();
      const total = next.reduce(
        (sum, m) => sum + (data.outstanding.find((o) => o.month === m)?.remaining ?? 0), 0
      );
      return { ...prev, [memberId]: { ...data, selectedMonths: next, amount: total } };
    });
  }

  function setMemberAmount(memberId: string, value: number) {
    setMemberData((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], amount: value },
    }));
  }

  async function handlePreview() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one member");
      return;
    }
    const invalid = selectedIds.find((id) => !memberData[id] || memberData[id].amount <= 0);
    if (invalid) {
      toast.error("Set a valid amount for each selected member");
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        selectedIds.map(async (memberId) => {
          const d = memberData[memberId];
          const allocations = await (
            await import("@/lib/actions/deposits")
          ).previewAllocation(memberId, d.amount, paymentDate);
          const m = members.find((x) => x.id === memberId)!;
          return { memberId, memberName: m.name, amount: d.amount, allocations };
        })
      );
      setBatchPreview(results);
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const records = batchPreview.map((p) => ({
        memberId: p.memberId,
        amountReceived: p.amount,
        paymentDate,
        note,
      }));
      const res = await createBatchPayments(records);
      toast.success(
        `${res.paymentIds.length} deposit${res.paymentIds.length > 1 ? "s" : ""} recorded`
      );
      router.push("/deposits");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
      setLoading(false);
    }
  }

  const labelClass = "text-xs font-semibold uppercase tracking-widest block mb-2";
  const labelStyle = { color: "hsl(var(--muted-foreground))" } as React.CSSProperties;
  const inputStyle = {
    background: "hsl(222 47% 12%)",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    outline: "none",
  } as React.CSSProperties;

  // ── Step 2: Confirm ───────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Confirm {batchPreview.length} Payment{batchPreview.length > 1 ? "s" : ""}
        </div>
        <div className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
          Date: {format(new Date(paymentDate), "dd MMM yyyy")}
          {note && ` · Note: ${note}`}
        </div>

        <div className="space-y-4">
          {batchPreview.map((item, i) => (
            <div key={item.memberId} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
              {/* Member header */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: "hsl(var(--accent))" }}>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: AVATAR_COLORS[members.findIndex(m => m.id === item.memberId) % AVATAR_COLORS.length], color: "#fff" }}
                >
                  {getInitials(item.memberName)}
                </div>
                <span className="text-sm font-semibold flex-1">{item.memberName}</span>
                <span className="text-sm font-bold" style={{ color: "var(--teal)" }}>
                  ৳{item.amount.toLocaleString()}
                </span>
              </div>
              {/* Allocations */}
              <table className="w-full text-xs">
                <tbody>
                  {item.allocations.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-2 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>No allocations generated</td></tr>
                  ) : (
                    item.allocations.map((a, j) => (
                      <tr key={j} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                        <td className="px-4 py-2 font-mono">{a.forMonth}</td>
                        <td className="px-4 py-2 text-right font-semibold" style={{ color: "var(--teal)" }}>
                          ৳{Number(a.amountAllocated).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep(1)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--foreground))" }}
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "var(--teal)", color: "hsl(222 47% 7%)" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Confirm & Save All
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Form ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Member avatar grid: 3 cols, scrollable */}
      <div>
        <label className={labelClass} style={labelStyle}>
          Select Member(s)
          {selectedIds.length > 0 && (
            <span className="ml-2 font-normal normal-case" style={{ color: "var(--teal)" }}>
              {selectedIds.length} selected
            </span>
          )}
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            maxHeight: 220,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {members.map((m, i) => {
            const isSelected = selectedIds.includes(m.id);
            const isLoading = loadingMember === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                disabled={isLoading}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all relative"
                style={{
                  background: isSelected ? "hsl(var(--accent))" : "hsl(222 47% 12%)",
                  border: `2px solid ${isSelected ? "var(--teal)" : "transparent"}`,
                }}
              >
                {/* Check badge */}
                {isSelected && !isLoading && (
                  <div
                    className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center"
                    style={{ background: "var(--teal)" }}
                  >
                    <Check size={9} color="hsl(222 47% 7%)" strokeWidth={3} />
                  </div>
                )}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    color: "#fff",
                    boxShadow: isSelected ? `0 0 0 3px ${AVATAR_COLORS[i % AVATAR_COLORS.length]}55` : "none",
                  }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : getInitials(m.name)}
                </div>
                <span
                  className="text-xs font-medium text-center leading-tight"
                  style={{ color: isSelected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                >
                  {m.name.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-member month & amount sections */}
      {selectedIds.length > 0 && selectedIds.map((id) => {
        const m = members.find((x) => x.id === id)!;
        const idx = members.indexOf(m);
        const data = memberData[id];
        if (!data) return null;

        const totalForSelected = data.selectedMonths.reduce(
          (sum, mo) => sum + (data.outstanding.find((o) => o.month === mo)?.remaining ?? 0), 0
        );

        return (
          <div key={id} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
            {/* Member header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: "hsl(var(--accent))" }}>
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: "#fff" }}
              >
                {getInitials(m.name)}
              </div>
              <span className="text-sm font-semibold">{m.name}</span>
              {data.outstanding.length === 0 && (
                <span className="ml-auto text-xs" style={{ color: "var(--green)" }}>✓ Fully paid</span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Outstanding months */}
              {data.outstanding.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Outstanding Months (multi-select)
                  </div>
                  <div className="space-y-1.5" style={{ maxHeight: 180, overflowY: "auto" }}>
                    {data.outstanding.map((mo) => {
                      const isChecked = data.selectedMonths.includes(mo.month);
                      const pct = mo.expected > 0 ? (mo.paid / mo.expected) * 100 : 0;
                      return (
                        <button
                          key={mo.month}
                          type="button"
                          onClick={() => toggleMonth(id, mo.month)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                          style={{
                            background: isChecked ? "hsl(168 84% 32% / 0.15)" : "hsl(222 47% 10%)",
                            border: `1.5px solid ${isChecked ? "var(--teal)" : "hsl(var(--border))"}`,
                          }}
                        >
                          <div
                            className="flex-shrink-0 h-4 w-4 rounded flex items-center justify-center"
                            style={{ background: isChecked ? "var(--teal)" : "hsl(var(--border))" }}
                          >
                            {isChecked && <Check size={9} color="hsl(222 47% 7%)" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold">{formatMonth(mo.month)}</span>
                              <span className="text-xs font-bold" style={{ color: "var(--red)" }}>
                                ৳{mo.remaining.toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-0.5 h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
                              <div
                                className="h-1 rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "var(--green)" : "var(--amber)" }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {data.selectedMonths.length > 0 && (
                    <div className="text-xs mt-1.5 px-1" style={{ color: "var(--teal)" }}>
                      {data.selectedMonths.length} month(s) · Full: ৳{totalForSelected.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              {(data.outstanding.length === 0 || data.selectedMonths.length > 0) && (
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Amount (BDT)</div>
                  {/* Quick buttons */}
                  {totalForSelected > 0 && (
                    <div className="flex gap-2 mb-2">
                      {[
                        { label: "Full", value: totalForSelected },
                        { label: "Half", value: Math.floor(totalForSelected / 2) },
                      ].map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={() => setMemberAmount(id, q.value)}
                          className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={{
                            background: data.amount === q.value ? "var(--teal)" : "hsl(var(--accent))",
                            color: data.amount === q.value ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {q.label} ৳{q.value.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Slider */}
                  {totalForSelected > 0 && (
                    <input
                      type="range"
                      min={1}
                      max={totalForSelected}
                      step={50}
                      value={data.amount}
                      onChange={(e) => setMemberAmount(id, Number(e.target.value))}
                      className="w-full mb-2"
                      style={{ accentColor: "var(--teal)" }}
                    />
                  )}
                  {/* Number input */}
                  <input
                    type="number"
                    min={1}
                    max={totalForSelected > 0 ? totalForSelected : undefined}
                    value={data.amount || ""}
                    onChange={(e) => {
                      const v = totalForSelected > 0
                        ? Math.min(Math.max(1, Number(e.target.value)), totalForSelected)
                        : Math.max(1, Number(e.target.value));
                      setMemberAmount(id, v);
                    }}
                    className="w-full h-10 px-4 rounded-xl text-sm font-medium"
                    style={inputStyle}
                    placeholder="Enter amount..."
                  />
                  {totalForSelected > 0 && (
                    <div className="flex justify-between text-xs mt-1 px-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <span>Min: ৳1</span>
                      <span>Max: ৳{totalForSelected.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Shared payment date & note */}
      {selectedIds.length > 0 && (
        <>
          <div>
            <label className={labelClass} style={labelStyle}>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Note (Optional)</label>
            <textarea
              placeholder="e.g. April collection — via bKash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
            />
          </div>
        </>
      )}

      <button
        onClick={handlePreview}
        disabled={
          loading ||
          selectedIds.length === 0 ||
          selectedIds.some((id) => !memberData[id] || memberData[id].amount <= 0)
        }
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{
          background:
            selectedIds.length > 0 && selectedIds.every((id) => memberData[id]?.amount > 0)
              ? "var(--teal)"
              : "hsl(var(--muted))",
          color:
            selectedIds.length > 0 && selectedIds.every((id) => memberData[id]?.amount > 0)
              ? "hsl(222 47% 7%)"
              : "hsl(var(--muted-foreground))",
        }}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
        {selectedIds.length > 1
          ? `Preview ${selectedIds.length} Deposits →`
          : "Preview Allocation →"}
      </button>
    </div>
  );
}
