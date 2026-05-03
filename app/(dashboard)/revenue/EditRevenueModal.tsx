"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Edit, ShieldAlert, Trash2 } from "lucide-react";
import { updateRevenue, voidRevenue, deleteRevenue } from "@/lib/actions/finance";
import { toast } from "sonner";

const SOURCE_TYPES_INCOME = [
  { value: "bank_profit", label: "Bank Profit" },
  { value: "investment_return", label: "Investment Return" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

export function EditRevenueModal({
  isOpen,
  onClose,
  revenue,
  availableInvestments = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  revenue: any | null;
  availableInvestments?: any[];
}) {
  const [eventDate, setEventDate] = useState("");
  const [isLoss, setIsLoss] = useState(false);
  const [sourceType, setSourceType] = useState("");
  const [customSourceType, setCustomSourceType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedInvestmentId, setLinkedInvestmentId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (revenue) {
      setEventDate(revenue.eventDate);
      const isNegative = Number(revenue.amount) < 0;
      setIsLoss(isNegative);
      setAmount(Math.abs(Number(revenue.amount)).toString());
      setDescription(revenue.description);
      setLinkedInvestmentId(revenue.linkedInvestmentId || "");
      setIsConfirmed(false);

      if (isNegative) {
        setSourceType("loss");
        setCustomSourceType("");
      } else {
        const standardValues = SOURCE_TYPES_INCOME.map((s) => s.value);
        if (standardValues.includes(revenue.sourceType)) {
          setSourceType(revenue.sourceType);
          setCustomSourceType("");
        } else {
          setSourceType("other");
          setCustomSourceType(revenue.sourceType);
        }
      }
    }
  }, [revenue]);

  if (!isOpen || !revenue) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfirmed) {
      setIsConfirmed(true);
      toast.info("Please review the changes and click 'Confirm Changes' to save.");
      return;
    }

    try {
      setIsSubmitting(true);
      const finalSource = isLoss ? "loss" : sourceType === "other" ? customSourceType || "other" : sourceType;
      const finalAmount = isLoss ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

      const res = await updateRevenue(revenue.entryId, {
        eventDate,
        sourceType: finalSource,
        description,
        amount: finalAmount,
        linkedInvestmentId: linkedInvestmentId || undefined,
      });

      if (res?.success) {
        toast.success("Entry updated successfully!");
        onClose();
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update revenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoid() {
    if (!window.confirm("Are you sure you want to void this entry?")) return;
    try {
      setIsSubmitting(true);
      const res = await voidRevenue(revenue.entryId);
      if (res?.success) {
        toast.success("Entry marked as voided.");
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to void entry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to permanently delete this entry from both App and Google Sheets?")) return;
    try {
      setIsSubmitting(true);
      const res = await deleteRevenue(revenue.entryId);
      if (res?.success) {
        toast.success("Entry deleted successfully.");
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete entry.");
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
              <Edit size={18} /> Edit Revenue/Loss: {revenue.entryId}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Update financial records for this entry</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (৳)</label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Type</label>
            {isLoss ? (
              <input
                type="text"
                disabled
                className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none transition font-medium cursor-not-allowed opacity-75"
                value="loss"
              />
            ) : (
              <select
                className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                {SOURCE_TYPES_INCOME.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isLoss && sourceType === "other" && (
            <div className="space-y-1.5 animate-in slide-in-from-left-2 duration-200">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Source Type</label>
              <input
                type="text"
                required
                placeholder="e.g. Donation, Subsidy"
                className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
                value={customSourceType}
                onChange={(e) => setCustomSourceType(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linked Investment (Optional)</label>
            <select
              value={linkedInvestmentId}
              onChange={(e) => setLinkedInvestmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-muted focus:outline-none focus:border-teal transition font-medium"
            >
              <option value="">No linked investment</option>
              {availableInvestments.map((inv) => (
                <option key={inv.entryId} value={inv.entryId}>
                  {inv.entryId} - {inv.recipient} (৳{Number(inv.principal).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {isConfirmed && (
            <div
              className="flex items-start gap-3 p-3.5 rounded-lg text-xs"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--amber)" }}
            >
              <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Confirmation Required</p>
                <p className="mt-0.5 text-muted-foreground">This change is sensitive. Please confirm that the changes are correct.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-muted">
            {!revenue.voided && (
              <button
                type="button"
                onClick={handleVoid}
                disabled={isSubmitting}
                className="py-2 px-3 border border-red-600/30 hover:bg-red-600/10 text-red-500 rounded-lg text-xs font-semibold transition whitespace-nowrap"
              >
                Void Entry
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="py-2 px-3 border border-red-600/30 hover:bg-red-600/10 text-red-500 rounded-lg text-xs font-semibold transition whitespace-nowrap"
            >
              <Trash2 size={13} />
            </button>
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
              {isSubmitting ? "Saving Changes..." : isConfirmed ? "Confirm & Update" : "Update Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
