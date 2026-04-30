"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatchPayments } from "@/lib/actions/deposits";
import { getMemberOutstandingMonths, type OutstandingMonth } from "@/lib/actions/outstanding";
import { toast } from "sonner";
import { Loader2, Check, ChevronRight, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Member = { id: string; name: string; mobile: string; position: string };

// One line item = one payment entry the manager is about to record
type DepositLine = {
  id: string; // local key only
  memberId: string;
  memberName: string;
  forMonth: string;        // YYYY-MM — manager explicitly chooses
  amountReceived: number;
  outstandingForMonth: number; // remaining due for that month (0 if fully paid or future)
  isPartial: boolean;      // amount < outstanding
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

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── MemberPicker ─────────────────────────────────────────────────────────────

function MemberPicker({
  members,
  onAddLine,
}: {
  members: Member[];
  onAddLine: (memberId: string, memberName: string, outstanding: OutstandingMonth[]) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePick(m: Member, idx: number) {
    setLoading(m.id);
    try {
      const months = await getMemberOutstandingMonths(m.id);
      onAddLine(m.id, m.name, months);
    } catch {
      toast.error("Failed to load member data");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
        Pick a Member to Add an Entry
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
        {members.map((m, i) => (
          <button
            key={m.id}
            type="button"
            disabled={loading === m.id}
            onClick={() => handlePick(m, i)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
            style={{ background: "hsl(222 47% 12%)", border: "2px solid transparent" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--teal)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: "#fff" }}
            >
              {loading === m.id ? <Loader2 size={14} className="animate-spin" /> : getInitials(m.name)}
            </div>
            <span className="text-xs font-medium text-center leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>
              {m.name.split(" ").slice(0, 2).join(" ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DepositLineEditor ────────────────────────────────────────────────────────

function DepositLineEditor({
  line,
  outstanding,
  memberIdx,
  onUpdate,
  onRemove,
}: {
  line: DepositLine;
  outstanding: OutstandingMonth[];
  memberIdx: number;
  onUpdate: (id: string, patch: Partial<DepositLine>) => void;
  onRemove: (id: string) => void;
}) {
  const monthOptions = outstanding.filter((m) => m.remaining > 0);
  const currentOutstanding = outstanding.find((m) => m.month === line.forMonth);
  const maxAmount = currentOutstanding?.remaining ?? line.amountReceived;

  function handleMonthChange(month: string) {
    const o = outstanding.find((m) => m.month === month);
    const remaining = o?.remaining ?? 0;
    onUpdate(line.id, {
      forMonth: month,
      outstandingForMonth: remaining,
      amountReceived: remaining, // default to full outstanding for that month
      isPartial: false,
    });
  }

  function handleAmountChange(val: number) {
    const clamped = Math.max(1, Math.min(val, maxAmount > 0 ? maxAmount : val));
    onUpdate(line.id, {
      amountReceived: clamped,
      isPartial: clamped < maxAmount,
    });
  }

  const inputStyle: React.CSSProperties = {
    background: "hsl(222 47% 12%)",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    outline: "none",
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: "hsl(var(--accent))" }}>
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: AVATAR_COLORS[memberIdx % AVATAR_COLORS.length], color: "#fff" }}
        >
          {getInitials(line.memberName)}
        </div>
        <span className="text-sm font-semibold flex-1">{line.memberName}</span>
        <button
          type="button"
          onClick={() => onRemove(line.id)}
          className="p-1 rounded-lg transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
          title="Remove this entry"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Month selector */}
        <div>
          <div className="text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Month This Payment Covers
          </div>
          {monthOptions.length === 0 ? (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" }}>
              No outstanding months — member is fully paid up
            </div>
          ) : (
            <div className="space-y-1" style={{ maxHeight: 160, overflowY: "auto" }}>
              {monthOptions.map((mo) => {
                const isSelected = line.forMonth === mo.month;
                const pct = mo.expected > 0 ? (mo.paid / mo.expected) * 100 : 0;
                return (
                  <button
                    key={mo.month}
                    type="button"
                    onClick={() => handleMonthChange(mo.month)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                    style={{
                      background: isSelected ? "hsl(168 84% 32% / 0.15)" : "hsl(222 47% 10%)",
                      border: `1.5px solid ${isSelected ? "var(--teal)" : "hsl(var(--border))"}`,
                    }}
                  >
                    <div
                      className="flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center"
                      style={{ background: isSelected ? "var(--teal)" : "hsl(var(--border))", border: isSelected ? "none" : "1.5px solid hsl(var(--border))" }}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Amount — shown only once a month is selected */}
        {line.forMonth && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Amount (BDT)</span>
              {line.isPartial && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(38 92% 45% / 0.15)", color: "hsl(38 92% 45%)" }}>
                  Partial payment
                </span>
              )}
            </div>
            {/* Quick buttons */}
            {maxAmount > 0 && (
              <div className="flex gap-2 mb-2">
                {[
                  { label: `Full ৳${maxAmount.toLocaleString()}`, value: maxAmount },
                  ...(maxAmount > 500 ? [{ label: "Half", value: Math.floor(maxAmount / 2) }] : []),
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => handleAmountChange(q.value)}
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{
                      background: line.amountReceived === q.value ? "var(--teal)" : "hsl(var(--accent))",
                      color: line.amountReceived === q.value ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            {maxAmount > 0 && (
              <input
                type="range"
                min={1}
                max={maxAmount}
                step={50}
                value={line.amountReceived}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full mb-2"
                style={{ accentColor: "var(--teal)" }}
              />
            )}
            <input
              type="number"
              min={1}
              max={maxAmount > 0 ? maxAmount : undefined}
              value={line.amountReceived || ""}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              className="w-full h-10 px-4 rounded-xl text-sm font-medium"
              style={inputStyle}
              placeholder="Enter amount..."
            />
            {maxAmount > 0 && (
              <div className="flex justify-between text-xs mt-1 px-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span>Min: ৳1</span>
                <span>Max (outstanding): ৳{maxAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main DepositForm ─────────────────────────────────────────────────────────

export function DepositForm({ members, monthlyAmount }: { members: Member[]; monthlyAmount: number }) {
  const router = useRouter();
  const [lines, setLines] = useState<DepositLine[]>([]);
  // outstanding cache per member — loaded once per member pick
  const [outstandingCache, setOutstandingCache] = useState<Record<string, OutstandingMonth[]>>({});
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const currentMonth = format(new Date(), "yyyy-MM");

  function addLine(memberId: string, memberName: string, outstanding: OutstandingMonth[]) {
    // Cache outstanding for this member
    setOutstandingCache((prev) => ({ ...prev, [memberId]: outstanding }));

    const memberIdx = members.findIndex((m) => m.id === memberId);

    // Default: current month if outstanding, else oldest due month
    const dueMonths = outstanding.filter((m) => m.remaining > 0);
    const defaultMonth = dueMonths.find((m) => m.month === currentMonth) ?? dueMonths[0];

    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        memberId,
        memberName,
        forMonth: defaultMonth?.month ?? currentMonth,
        amountReceived: defaultMonth?.remaining ?? monthlyAmount,
        outstandingForMonth: defaultMonth?.remaining ?? monthlyAmount,
        isPartial: false,
      },
    ]);
  }

  function updateLine(id: string, patch: Partial<DepositLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function handlePreview() {
    if (lines.length === 0) { toast.error("Add at least one deposit entry"); return; }
    const invalid = lines.find((l) => !l.forMonth || l.amountReceived <= 0);
    if (invalid) { toast.error("Each entry needs a month and a valid amount"); return; }
    setStep(2);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const records = lines.map((l) => ({
        memberId: l.memberId,
        amountReceived: l.amountReceived,
        paymentDate,
        forMonth: l.forMonth,
        note,
      }));
      const res = await createBatchPayments(records);
      toast.success(`${res.paymentIds.length} deposit${res.paymentIds.length > 1 ? "s" : ""} recorded`);
      router.push("/deposits");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "hsl(222 47% 12%)",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
    outline: "none",
  };

  const totalAmount = lines.reduce((s, l) => s + l.amountReceived, 0);

  // ── Step 2: Confirm ───────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Confirm {lines.length} Payment{lines.length > 1 ? "s" : ""}
        </div>
        <div className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
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
              {lines.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <td className="px-4 py-2.5 text-sm font-medium">{l.memberName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{formatMonth(l.forMonth)}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: "var(--teal)" }}>৳{l.amountReceived.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    {l.isPartial ? (
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

  // ── Step 1: Form ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Member picker */}
      <MemberPicker members={members} onAddLine={addLine} />

      {/* Deposit line editors */}
      {lines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              Deposit Entries ({lines.length})
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--teal)" }}>
              Total: ৳{totalAmount.toLocaleString()}
            </span>
          </div>
          {lines.map((line) => {
            const memberIdx = members.findIndex((m) => m.id === line.memberId);
            return (
              <DepositLineEditor
                key={line.id}
                line={line}
                outstanding={outstandingCache[line.memberId] ?? []}
                memberIdx={memberIdx}
                onUpdate={updateLine}
                onRemove={removeLine}
              />
            );
          })}
        </div>
      )}

      {/* Shared date + note */}
      {lines.length > 0 && (
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
        disabled={lines.length === 0 || lines.some((l) => !l.forMonth || l.amountReceived <= 0)}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{
          background: lines.length > 0 && lines.every((l) => l.forMonth && l.amountReceived > 0)
            ? "var(--teal)"
            : "hsl(var(--muted))",
          color: lines.length > 0 && lines.every((l) => l.forMonth && l.amountReceived > 0)
            ? "hsl(222 47% 7%)"
            : "hsl(var(--muted-foreground))",
        }}
      >
        <ChevronRight size={15} />
        {lines.length > 1 ? `Preview ${lines.length} Deposits →` : "Preview & Confirm →"}
      </button>
    </div>
  );
}
