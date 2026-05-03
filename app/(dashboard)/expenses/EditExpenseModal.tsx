"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateExpense, voidExpense } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Loader2, Save, X, AlertTriangle } from "lucide-react";

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

export function EditExpenseModal({
  isOpen,
  onClose,
  expense,
}: {
  isOpen: boolean;
  onClose: () => void;
  expense: any | null;
}) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [actionType, setActionType] = useState<"save" | "void" | null>(null);

  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedInvestmentId, setLinkedInvestmentId] = useState("");

  useEffect(() => {
    if (expense) {
      setExpenseDate(expense.expenseDate);
      setCategory(expense.category);
      setDescription(expense.description);
      setAmount(expense.amount);
      setLinkedInvestmentId(expense.linkedInvestmentId || "");
      setConfirming(false);
      setActionType(null);
    }
  }, [expense]);

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !expense) return null;

  async function handleActionConfirm() {
    setLoading(true);
    try {
      if (actionType === "save") {
        await updateExpense(expense.entryId, {
          expenseDate,
          category,
          description,
          amount: Number(amount),
          linkedInvestmentId: linkedInvestmentId || undefined,
        });
        toast.success("Expense updated successfully");
      } else if (actionType === "void") {
        await voidExpense(expense.entryId);
        toast.success("Expense voided successfully");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to process request");
      setLoading(false);
      setConfirming(false);
    }
  }

  function triggerConfirmation(type: "save" | "void") {
    if (type === "save" && (!expenseDate || !category || !description || !amount)) {
      toast.error("Please fill all required fields");
      return;
    }
    setActionType(type);
    setConfirming(true);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background text-foreground flex items-center justify-center p-5 overflow-y-auto backdrop-blur-md" style={{ background: "hsl(222 47% 7% / 90%)" }}>
      <div className="glass max-w-md w-full p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <h2 className="text-base font-bold tracking-tight">Edit Expense ({expense.entryId})</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage sensitive expense details.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {confirming ? (
          /* Confirmation Step */
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border" style={{ borderColor: "var(--amber)", background: "rgba(245,158,11,0.08)" }}>
              <AlertTriangle size={20} className="text-amber-500 shrink-0" style={{ color: "var(--amber)" }} />
              <div>
                <h4 className="text-sm font-bold" style={{ color: "var(--amber)" }}>Confirmation Required</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  You are making changes to financial records. Please ensure accuracy before continuing.
                  {actionType === "void" && " Voiding this expense cannot be undone."}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleActionConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2"
                style={{ background: actionType === "void" ? "var(--red)" : "var(--teal)", color: "hsl(222 47% 7%)" }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Yes, Proceed
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border text-xs font-semibold bg-muted/60 text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form Fields */
          <div className="space-y-4">
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
              <label className={labelClass} style={labelStyle}>Linked Investment ID (Optional)</label>
              <input
                type="text"
                placeholder="INV-000001"
                value={linkedInvestmentId}
                onChange={(e) => setLinkedInvestmentId(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              />
            </div>

            <div className="flex gap-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              {!expense.voided && (
                <button
                  type="button"
                  onClick={() => triggerConfirmation("void")}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs border bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                >
                  Void Expense
                </button>
              )}
              <button
                type="button"
                onClick={() => triggerConfirmation("save")}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2"
                style={{ background: "var(--teal)", color: "hsl(222 47% 7%)" }}
              >
                <Save size={14} /> Update Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
