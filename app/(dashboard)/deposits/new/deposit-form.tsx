"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBatchPayments } from "@/lib/actions/deposits";
import { getMemberOutstandingMonths, type OutstandingMonth } from "@/lib/actions/outstanding";
import { toast } from "sonner";
import { Loader2, Check, ChevronRight, X, CheckSquare } from "lucide-react";
import { format } from "date-fns";

type Member = { id: string; name: string; mobile: string; position: string };

type MemberEntry = {
  outstanding: OutstandingMonth[];
  loading: boolean;
  selectedMonths: string[];           // months toggled on
  amountPerMonth: Record<string, number>; // amount for each selected month
};

const AVATAR_COLORS = [
  "hsl(168 84% 32%)", "hsl(270 70% 50%)", "hsl(38 92% 45%)",
  "hsl(220 70% 50%)", "hsl(340 82% 50%)", "hsl(185 74% 38%)",
  "hsl(30 80% 48%)", "hsl(260 65% 55%)", "hsl(145 60% 36%)",
];

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[Number(mo) - 1]} '${y.slice(2)}`;
}

// ─── MemberEntry Editor ───────────────────────────────────────────────────────

function MemberEntryEditor({
  member,
  memberIdx,
  entry,
  onDeselect,
  onToggleMonth,
  onAmountChange,
}: {
  member: Member;
  memberIdx: number;
  entry: MemberEntry;
  onDeselect: () => void;
  onToggleMonth: (month: string, defaultAmount: number) => void;
  onAmountChange: (month: string, amount: number) => void;
}) {
  const dueMonths = entry.outstanding.filter((m) => m.remaining > 0);

  if (entry.loading) {
    return (
      <div className="rounded-xl p-5 flex items-center gap-3" style={{ border: "1px solid hsl(var(--border))", background: "hsl(222 47% 10%)" }}>
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: AVATAR_COLORS[memberIdx % AVATAR_COLORS.length], color: "#fff" }}
        >
          <Loader2 size={14} className="animate-spin" />
        </div>
        <span className="text-sm font-medium">{member.name}</span>
        <span className="text-xs ml-auto" style={{ color: "hsl(var(--muted-foreground))" }}>Loading months…</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: "hsl(var(--accent))" }}>
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: AVATAR_COLORS[memberIdx % AVATAR_COLORS.length], color: "#fff" }}
        >
          {getInitials(member.name)}
        </div>
        <span className="text-sm font-semibold flex-1">{member.name}</span>
        {entry.selectedMonths.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }}>
            {entry.selectedMonths.length} month{entry.selectedMonths.length > 1 ? "s" : ""} · ৳{entry.selectedMonths.reduce((s, m) => s + (entry.amountPerMonth[m] ?? 0), 0).toLocaleString()}
          </span>
        )}
        <button
          type="button"
          onClick={onDeselect}
          className="p-1 rounded-lg transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
          title="Remove member"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {dueMonths.length === 0 ? (
          <div className="text-xs px-3 py-2.5 rounded-lg" style={{ background: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" }}>
            ✓ No outstanding months — this member is fully paid up
          </div>
        ) : (
          <>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Select months to pay (tap to toggle)
            </div>
            <div className="space-y-2" style={{ maxHeight: 240, overflowY: "auto" }}>
              {dueMonths.map((mo) => {
                const isSelected = entry.selectedMonths.includes(mo.month);
                const pct = mo.expected > 0 ? (mo.paid / mo.expected) * 100 : 0;
                const amount = entry.amountPerMonth[mo.month] ?? mo.remaining;

                return (
                  <div key={mo.month}>
                    {/* Month toggle row */}
                    <button
                      type="button"
                      onClick={() => onToggleMonth(mo.month, mo.remaining)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                      style={{
                        background: isSelected ? "hsl(168 84% 32% / 0.12)" : "hsl(222 47% 10%)",
                        border: `1.5px solid ${isSelected ? "var(--teal)" : "hsl(var(--border))"}`,
                      }}
                    >
                      <div
                        className="flex-shrink-0 h-4 w-4 rounded flex items-center justify-center transition-all"
                        style={{
                          background: isSelected ? "var(--teal)" : "transparent",
                          border: isSelected ? "none" : "1.5px solid hsl(var(--muted-foreground))",
                        }}
                      >
                        {isSelected && <Check size={9} color="hsl(222 47% 7%)" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold">{formatMonth(mo.month)}</span>
                          <span className="text-xs font-bold" style={{ color: "var(--red)" }}>৳{mo.remaining.toLocaleString()} due</span>
                        </div>
                        <div className="mt-0.5 h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
                          <div className="h-1 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "var(--green)" : "var(--amber)" }} />
                        </div>
                      </div>
                    </button>

                    {/* Amount input — shown only when month is selected */}
                    {isSelected && (
                      <div className="mt-1.5 px-1">
                        <div className="flex gap-2 mb-1.5">
                          <button
                            type="button"
                            onClick={() => onAmountChange(mo.month, mo.remaining)}
                            className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{
                              background: amount === mo.remaining ? "var(--teal)" : "hsl(var(--accent))",
                              color: amount === mo.remaining ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
                            }}
                          >
                            Full ৳{mo.remaining.toLocaleString()}
                          </button>
                          {mo.remaining > 500 && (
                            <button
                              type="button"
                              onClick={() => onAmountChange(mo.month, Math.floor(mo.remaining / 2))}
                              className="text-xs px-2.5 py-1 rounded-full font-semibold"
                              style={{
                                background: amount === Math.floor(mo.remaining / 2) ? "var(--teal)" : "hsl(var(--accent))",
                                color: amount === Math.floor(mo.remaining / 2) ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
                              }}
                            >
                              Half
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={mo.remaining}
                          value={amount || ""}
                          onChange={(e) => onAmountChange(mo.month, Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-lg text-sm font-medium"
                          style={{
                            background: "hsl(222 47% 12%)",
                            border: `1px solid ${amount > 0 && amount < mo.remaining ? "var(--amber)" : "hsl(var(--border))"}`,
                            color: "hsl(var(--foreground))",
                            outline: "none",
                          }}
                          placeholder="Custom amount…"
                        />
                        {amount > 0 && amount < mo.remaining && (
                          <div className="text-xs mt-1" style={{ color: "hsl(38 92% 45%)" }}>
                            Partial payment — ৳{(mo.remaining - amount).toLocaleString()} will remain outstanding
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main DepositForm ─────────────────────────────────────────────────────────

export function DepositForm({ members, monthlyAmount }: { members: Member[]; monthlyAmount: number }) {
  const router = useRouter();

  // selectedMemberIds: Set of member IDs that have been toggled ON
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Per-member data: outstanding months + UI state
  const [memberData, setMemberData] = useState<Record<string, MemberEntry>>({});

  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const currentMonth = format(new Date(), "yyyy-MM");

  // ── Toggle a member card ──────────────────────────────────────────────────
  const handleToggleMember = useCallback(async (member: Member) => {
    const isSelected = selectedIds.has(member.id);

    if (isSelected) {
      // Deselect — remove from both sets
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(member.id); return n; });
      setMemberData((prev) => { const n = { ...prev }; delete n[member.id]; return n; });
      return;
    }

    // Select — add immediately as loading
    setSelectedIds((prev) => new Set([...prev, member.id]));
    setMemberData((prev) => ({
      ...prev,
      [member.id]: { outstanding: [], loading: true, selectedMonths: [], amountPerMonth: {} },
    }));

    try {
      const months = await getMemberOutstandingMonths(member.id);

      // Auto-select current month if outstanding
      const due = months.filter((m) => m.remaining > 0);
      const defaultMonth = due.find((m) => m.month === currentMonth) ?? due[0];
      const autoSelectedMonths = defaultMonth ? [defaultMonth.month] : [];
      const autoAmounts: Record<string, number> = {};
      if (defaultMonth) autoAmounts[defaultMonth.month] = defaultMonth.remaining;

      setMemberData((prev) => ({
        ...prev,
        [member.id]: {
          outstanding: months,
          loading: false,
          selectedMonths: autoSelectedMonths,
          amountPerMonth: autoAmounts,
        },
      }));
    } catch {
      toast.error(`Failed to load data for ${member.name}`);
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(member.id); return n; });
      setMemberData((prev) => { const n = { ...prev }; delete n[member.id]; return n; });
    }
  }, [selectedIds, currentMonth]);

  // ── Toggle a month for a member ───────────────────────────────────────────
  const handleToggleMonth = useCallback((memberId: string, month: string, defaultAmount: number) => {
    setMemberData((prev) => {
      const entry = prev[memberId];
      if (!entry) return prev;
      const isSelected = entry.selectedMonths.includes(month);
      if (isSelected) {
        // Deselect month
        const newMonths = entry.selectedMonths.filter((m) => m !== month);
        const newAmounts = { ...entry.amountPerMonth };
        delete newAmounts[month];
        return { ...prev, [memberId]: { ...entry, selectedMonths: newMonths, amountPerMonth: newAmounts } };
      } else {
        // Select month with default amount
        return {
          ...prev,
          [memberId]: {
            ...entry,
            selectedMonths: [...entry.selectedMonths, month].sort(),
            amountPerMonth: { ...entry.amountPerMonth, [month]: defaultAmount },
          },
        };
      }
    });
  }, []);

  // ── Update amount for a (member, month) pair ──────────────────────────────
  const handleAmountChange = useCallback((memberId: string, month: string, amount: number) => {
    setMemberData((prev) => {
      const entry = prev[memberId];
      if (!entry) return prev;
      return {
        ...prev,
        [memberId]: { ...entry, amountPerMonth: { ...entry.amountPerMonth, [month]: amount } },
      };
    });
  }, []);

  // ── Build flat records for submission ─────────────────────────────────────
  const allRecords = Array.from(selectedIds).flatMap((memberId) => {
    const entry = memberData[memberId];
    if (!entry || entry.loading) return [];
    return entry.selectedMonths
      .filter((m) => (entry.amountPerMonth[m] ?? 0) > 0)
      .map((m) => ({
        memberId,
        memberName: members.find((x) => x.id === memberId)?.name ?? memberId,
        forMonth: m,
        amountReceived: entry.amountPerMonth[m],
        isPartial: entry.amountPerMonth[m] < (entry.outstanding.find((o) => o.month === m)?.remaining ?? Infinity),
      }));
  });

  const totalAmount = allRecords.reduce((s, r) => s + r.amountReceived, 0);
  const anyLoading = Array.from(selectedIds).some((id) => memberData[id]?.loading);
  const canProceed = allRecords.length > 0 && !anyLoading;

  function handlePreview() {
    if (!canProceed) { toast.error("Select at least one member and one month with a valid amount"); return; }
    setStep(2);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const records = allRecords.map((r) => ({
        memberId: r.memberId,
        amountReceived: r.amountReceived,
        paymentDate,
        forMonth: r.forMonth,
        note,
      }));
      const res = await createBatchPayments(records);
      toast.success(`${res.paymentIds.length} deposit${res.paymentIds.length > 1 ? "s" : ""} recorded`);
      router.push("/deposits");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "hsl(222 47% 12%)",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    outline: "none",
  };

  // ── Step 2: Confirm ───────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
          Confirm {allRecords.length} Payment{allRecords.length > 1 ? "s" : ""}
        </div>
        <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Date: {format(new Date(paymentDate), "dd MMM yyyy")}
          {note && ` · Note: ${note}`}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(var(--accent))", borderBottom: "1px solid hsl(var(--border))" }}>
                <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Member</th>
                <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Month</th>
                <th className="px-4 py-2 text-right text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Amount</th>
                <th className="px-4 py-2 text-center text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <td className="px-4 py-2.5 text-sm font-medium">{r.memberName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{formatMonth(r.forMonth)}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: "var(--teal)" }}>৳{r.amountReceived.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    {r.isPartial ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "hsl(38 92% 45% / 0.15)", color: "hsl(38 92% 45%)" }}>Partial</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "hsl(168 84% 32% / 0.15)", color: "var(--teal)" }}>Full</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid hsl(var(--border))", background: "hsl(var(--accent))" }}>
                <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Total</td>
                <td className="px-4 py-2.5 text-right font-bold text-sm" style={{ color: "var(--teal)" }}>৳{totalAmount.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep(1)}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--foreground))", opacity: submitting ? 0.6 : 1 }}
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "var(--teal)", color: "hsl(222 47% 7%)", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {submitting ? "Saving…" : "Confirm & Save All"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Form ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Member grid — checkmark-toggle cards */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
          Select Members {selectedIds.size > 0 && <span style={{ color: "var(--teal)" }}>({selectedIds.size} selected)</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {members.map((m, i) => {
            const isSelected = selectedIds.has(m.id);
            const isLoading = memberData[m.id]?.loading;
            return (
              <button
                key={m.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleToggleMember(m)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all relative"
                style={{
                  background: isSelected ? "hsl(168 84% 32% / 0.1)" : "hsl(222 47% 12%)",
                  border: `2px solid ${isSelected ? "var(--teal)" : "transparent"}`,
                }}
              >
                {/* Checkmark badge */}
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
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: "#fff" }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : getInitials(m.name)}
                </div>
                <span className="text-xs font-medium text-center leading-tight" style={{ color: isSelected ? "var(--teal)" : "hsl(var(--muted-foreground))" }}>
                  {m.name.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            );
          })}
        </div>
        <div className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          Tap a card to select · tap again to remove
        </div>
      </div>

      {/* Per-member editors */}
      {selectedIds.size > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Deposit Details ({allRecords.length} payment{allRecords.length !== 1 ? "s" : ""})
            </div>
            {totalAmount > 0 && (
              <span className="text-xs font-bold" style={{ color: "var(--teal)" }}>
                Total: ৳{totalAmount.toLocaleString()}
              </span>
            )}
          </div>
          {Array.from(selectedIds).map((memberId) => {
            const member = members.find((m) => m.id === memberId)!;
            const entry = memberData[memberId];
            const memberIdx = members.findIndex((m) => m.id === memberId);
            if (!entry) return null;
            return (
              <MemberEntryEditor
                key={memberId}
                member={member}
                memberIdx={memberIdx}
                entry={entry}
                onDeselect={() => handleToggleMember(member)}
                onToggleMonth={(month, defaultAmount) => handleToggleMonth(memberId, month, defaultAmount)}
                onAmountChange={(month, amount) => handleAmountChange(memberId, month, amount)}
              />
            );
          })}
        </div>
      )}

      {/* Shared date + note — shown once any selection exists */}
      {selectedIds.size > 0 && (
        <>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Note (Optional)
            </label>
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
        disabled={!canProceed}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{
          background: canProceed ? "var(--teal)" : "hsl(var(--muted))",
          color: canProceed ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
          cursor: canProceed ? "pointer" : "not-allowed",
        }}
      >
        <ChevronRight size={15} />
        {allRecords.length > 1 ? `Preview ${allRecords.length} Deposits →` : "Preview & Confirm →"}
      </button>
    </div>
  );
}
