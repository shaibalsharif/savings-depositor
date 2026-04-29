"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvestment } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { format, addMonths } from "date-fns";

const fieldClass = "w-full h-11 px-4 rounded-xl text-sm";
const fieldStyle = {
  background: "hsl(222 47% 12%)",
  border: "1px solid hsl(var(--border))",
  color: "hsl(var(--foreground))",
  outline: "none",
} as React.CSSProperties;
const labelClass = "text-xs font-semibold uppercase tracking-widest block mb-2";
const labelStyle = { color: "hsl(var(--muted-foreground))" } as React.CSSProperties;

export default function InvestmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const [investDate, setInvestDate] = useState(today);
  const [expectedReturnDate, setExpectedReturnDate] = useState(format(addMonths(new Date(), 6), "yyyy-MM-dd"));
  const [recipient, setRecipient] = useState("");
  const [principal, setPrincipal] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!investDate || !recipient || !principal || !expectedReturnDate) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await createInvestment({ investDate, recipient, principal: Number(principal), expectedReturnDate, note });
      toast.success("Investment recorded");
      router.push("/investments");
    } catch (e: any) {
      toast.error(e.message || "Failed to record investment");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass} style={labelStyle}>Investment Date</label>
        <input type="date" value={investDate} onChange={(e) => setInvestDate(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>
      <div>
        <label className={labelClass} style={labelStyle}>Recipient</label>
        <input type="text" placeholder="Organization or person name" value={recipient} onChange={(e) => setRecipient(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>
      <div>
        <label className={labelClass} style={labelStyle}>Principal Amount (BDT)</label>
        <input type="number" min="1" value={principal} onChange={(e) => setPrincipal(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>
      <div>
        <label className={labelClass} style={labelStyle}>Expected Return Date</label>
        <input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} className={fieldClass} style={fieldStyle} required />
      </div>
      <div>
        <label className={labelClass} style={labelStyle}>Note (Optional)</label>
        <textarea
          placeholder="Details about this investment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{ background: "var(--teal)", color: "hsl(222 47% 7%)", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Investment
      </button>
    </form>
  );
}
