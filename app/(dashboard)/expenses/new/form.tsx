"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = ["Food", "Event", "Materials", "Bank Charge", "Conveyance", "Other"];

const fieldClass = "w-full h-11 px-4 rounded-xl text-sm";
const fieldStyle = {
  background: "hsl(222 47% 12%)",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
  outline: "none",
} as React.CSSProperties;
const labelClass = "text-xs font-semibold uppercase tracking-widest block mb-2";
const labelStyle = { color: "hsl(var(--muted-foreground))" } as React.CSSProperties;

export default function ExpenseForm({ availableInvestments = [] }: { availableInvestments?: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedInvestmentId, setLinkedInvestmentId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseDate || !category || !description || !amount) {
      toast.error("Please fill all required fields");
      return;
    }

    let finalCategory = category;
    if (category === "Other") {
      finalCategory = customCategory.trim() || "Other";
    }

    setLoading(true);
    try {
      await createExpense({
        expenseDate,
        category: finalCategory,
        description,
        amount: Number(amount),
        linkedInvestmentId: linkedInvestmentId || undefined,
      });
      toast.success("Expense recorded");
      router.push("/expenses");
    } catch (e: any) {
      toast.error(e.message || "Failed to record expense");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass} style={labelStyle}>Date</label>
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Category</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: category === c ? "var(--teal)" : "hsl(222 47% 12%)",
                color: category === c ? "hsl(222 47% 7%)" : "hsl(var(--muted-foreground))",
                border: `1px solid ${category === c ? "var(--teal)" : "hsl(var(--border))"}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        {category === "Other" && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Enter custom category name (e.g. Travel)"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
        )}
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Amount (BDT)</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
          required
        />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
          required
        />
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
              {inv.entryId} ({inv.recipient}) — ৳{Number(inv.principal).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{ background: "var(--teal)", color: "hsl(222 47% 7%)", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Expense
      </button>
    </form>
  );
}
