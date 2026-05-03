"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRevenue } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Loader2, Save, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

const SOURCE_TYPES_INCOME = [
  { value: "bank_profit", label: "Bank Profit" },
  { value: "investment_return", label: "Investment Return" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

const fieldClass = "w-full h-11 px-4 rounded-xl text-sm";
const fieldStyle = {
  background: "hsl(222 47% 12%)",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
  outline: "none",
} as React.CSSProperties;
const labelClass = "text-xs font-semibold uppercase tracking-widest block mb-2";
const labelStyle = { color: "hsl(var(--muted-foreground))" } as React.CSSProperties;

export default function RevenueForm({
  availableInvestments = [],
}: {
  availableInvestments?: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLoss, setIsLoss] = useState(false);
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sourceType, setSourceType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedInvestmentId, setLinkedInvestmentId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDate || !sourceType || !description || !amount) {
      toast.error("Please fill all required fields");
      return;
    }
    const finalAmount = isLoss ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    setLoading(true);
    try {
      await createRevenue({ eventDate, sourceType, description, amount: finalAmount, linkedInvestmentId: linkedInvestmentId || undefined });
      toast.success("Entry recorded");
      router.push("/revenue");
    } catch (e: any) {
      toast.error(e.message || "Failed to record entry");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Revenue / Loss toggle */}
      <div>
        <label className={labelClass} style={labelStyle}>Entry Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setIsLoss(false); setSourceType(""); }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: !isLoss ? "hsl(142 72% 29%)" : "hsl(222 47% 12%)",
              color: !isLoss ? "#fff" : "hsl(var(--muted-foreground))",
              border: `1px solid ${!isLoss ? "hsl(142 72% 29%)" : "hsl(var(--border))"}`,
            }}
          >
            <TrendingUp size={14} /> Income
          </button>
          <button
            type="button"
            onClick={() => { setIsLoss(true); setSourceType("loss"); }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: isLoss ? "hsl(0 72% 42%)" : "hsl(222 47% 12%)",
              color: isLoss ? "#fff" : "hsl(var(--muted-foreground))",
              border: `1px solid ${isLoss ? "hsl(0 72% 42%)" : "hsl(var(--border))"}`,
            }}
          >
            <TrendingDown size={14} /> Loss
          </button>
        </div>
      </div>

      {/* Source type picker */}
      {!isLoss && (
        <div>
          <label className={labelClass} style={labelStyle}>Source Type</label>
          <div className="grid grid-cols-2 gap-2">
            {SOURCE_TYPES_INCOME.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSourceType(s.value)}
                className="py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: sourceType === s.value ? "var(--teal)" : "hsl(222 47% 12%)",
                  color: sourceType === s.value ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
                  border: `1px solid ${sourceType === s.value ? "var(--teal)" : "hsl(var(--border))"}`,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} style={labelStyle}>Event Date</label>
        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Amount (BDT)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Positive number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
          required
        />
        <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isLoss ? "Will be recorded as a loss (negative)." : "Will be recorded as income (positive)."}
        </div>
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Linked Investment (Optional)</label>
        <select
          value={linkedInvestmentId}
          onChange={(e) => setLinkedInvestmentId(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
        >
          <option value="">No linked investment</option>
          {availableInvestments.map((inv) => (
            <option key={inv.entryId} value={inv.entryId}>
              {inv.entryId} - {inv.recipient} (৳{Number(inv.principal).toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{
          background: isLoss ? "hsl(0 72% 42%)" : "var(--teal)",
          color: "#fff",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Entry
      </button>
    </form>
  );
}
