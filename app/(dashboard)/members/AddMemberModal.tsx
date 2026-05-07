"use client";

import { useState } from "react";
import {
  Plus,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";

export function AddMemberModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameBn: "",
    email: "",
    mobile: "",
    depositStartDate: format(new Date(), "yyyy-MM"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      toast.success("Member Added Successfully", {
        description: `${formData.name} has been synced with Kinde, DB, and Sheets.`,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });

      setIsOpen(false);
      setFormData({
        name: "",
        nameBn: "",
        email: "",
        mobile: "",
        depositStartDate: format(new Date(), "yyyy-MM"),
      });

      // Refresh page to show new member
      window.location.reload();

    } catch (err: any) {
      toast.error("Operation Failed", {
        description: err.message,
        icon: <AlertCircle className="w-5 h-5 text-destructive" />,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate month options: Last 8 Months to Current + 3 Months
  const generateMonthOptions = () => {
    const options = [];
    const current = startOfMonth(new Date());
    
    // Past: last 8 months
    let runner = current;
    for (let i = 0; i < 9; i++) {
      options.push(format(runner, "yyyy-MM"));
      runner = subMonths(runner, 1);
    }
    
    // Future: next 3 months
    runner = addMonths(current, 1);
    for (let i = 0; i < 3; i++) {
      options.unshift(format(runner, "yyyy-MM"));
      runner = addMonths(runner, 1);
    }
    
    return Array.from(new Set(options)).sort();
  };

  const monthOptions = generateMonthOptions();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Add New Member
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-xl font-bold tracking-tight">New Member</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Setup Kinde, Sheets, and Financials</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-3 h-3" /> Full Name (English)
            </label>
            <input
              required
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Name Bengali */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-3 h-3" /> Full Name (Bengali)
            </label>
            <input
              placeholder="উদাঃ জন ডো"
              className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.nameBn}
              onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <input
              required
              type="email"
              placeholder="john@example.com"
              className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground italic">Used for Kinde authentication sync</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mobile */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Phone className="w-3 h-3" /> Mobile
              </label>
              <input
                placeholder="017..."
                className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            {/* Deposit Start Month (Custom Calendar View) */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Deposit Start Month
              </label>
              
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-2xl border border-dashed">
                {monthOptions.map(opt => {
                  const isSelected = formData.depositStartDate === opt;
                  const date = new Date(opt + "-01");
                  const isFuture = opt > format(new Date(), "yyyy-MM");
                  const isPast = opt < format(new Date(), "yyyy-MM");
                  
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({ ...formData, depositStartDate: opt })}
                      className={`
                        flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all
                        ${isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]" 
                          : "bg-background hover:border-primary/50 text-foreground"
                        }
                      `}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-70">
                        {format(date, "yyyy")}
                      </span>
                      <span className="text-sm font-bold">
                        {format(date, "MMM")}
                      </span>
                      {opt === format(new Date(), "yyyy-MM") && (
                        <div className={`mt-1 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-primary"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Select the month when this member's first deposit is expected.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synchronizing Trinity...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm & Sync All
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              This will create a Kinde account, append to Google Sheets, and initialize DB records.
              Financial dues will be calculated from the selected month.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
