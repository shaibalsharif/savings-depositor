"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Edit, ShieldAlert } from "lucide-react";
import { updateInvestment } from "@/lib/actions/finance";
import { toast } from "sonner";

export function EditInvestmentModal({
  isOpen,
  onClose,
  investment,
}: {
  isOpen: boolean;
  onClose: () => void;
  investment: any | null;
}) {
  const [investDate, setInvestDate] = useState("");
  const [recipient, setRecipient] = useState("");
  const [principal, setPrincipal] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [actualReturnDate, setActualReturnDate] = useState("");
  const [status, setStatus] = useState("active");
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (investment) {
      setInvestDate(investment.investDate);
      setRecipient(investment.recipient);
      setPrincipal(investment.principal.toString());
      setExpectedReturnDate(investment.expectedReturnDate);
      setActualReturnDate(investment.actualReturnDate || "");
      setStatus(investment.status);
      setNote(investment.note || "");
      setIsConfirmed(false);
    }
  }, [investment]);

  if (!isOpen || !investment) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfirmed) {
      setIsConfirmed(true);
      toast.info("Please review the changes and click 'Confirm Changes' to save.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateInvestment(investment.entryId, {
        investDate,
        recipient,
        principal: parseFloat(principal),
        expectedReturnDate,
        actualReturnDate: actualReturnDate || undefined,
        status,
        note,
      });

      if (res?.success) {
        toast.success("Investment updated successfully!");
        onClose();
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update investment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden p-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between border-b border-muted pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--teal)" }}>
              <Edit size={18} /> Edit Investment: {investment.entryId}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Update financial data for this investment entry</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invest Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                  value={investDate}
                  onChange={(e) => setInvestDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principal (৳)</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expected Return Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual Return Date (Optional)</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="matured">Matured</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note (Optional)</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {isConfirmed && (
            <div
              className="flex items-start gap-3 p-3.5 rounded-lg text-xs"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--amber)" }}
            >
              <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Confirmation Required</p>
                <p className="mt-0.5 text-muted-foreground">Changes to this investment are sensitive and could recalculate proportional stakes. Please confirm that the changes are correct.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-muted">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-muted rounded-lg text-sm font-semibold hover:bg-muted/40 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 select-none cursor-pointer"
              style={{
                background: isConfirmed ? "var(--green)" : "var(--teal)",
              }}
            >
              {isSubmitting ? "Saving Changes..." : isConfirmed ? "Confirm & Update" : "Update Investment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
