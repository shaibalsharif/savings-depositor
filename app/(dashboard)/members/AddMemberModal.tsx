"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, addYears, subYears, setMonth } from "date-fns";

export function AddMemberModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Hydration-safe initial state
  const [formData, setFormData] = useState({
    name: "",
    nameBn: "",
    email: "",
    mobile: "",
    depositStartDate: "", // Will be set on mount
  });

  // Calendar state
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    setFormData(prev => ({
      ...prev,
      depositStartDate: format(new Date(), "yyyy-MM")
    }));
    setViewDate(new Date());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.depositStartDate) return;
    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

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

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  if (!mounted) return null;

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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Name & Email Group */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" /> Full Name (English)
              </label>
              <input
                required
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <input
                required
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Premium Month Picker */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="w-3 h-3" /> Select Start Month
            </label>
            
            <div className="bg-muted/30 rounded-2xl border p-4 space-y-4">
              {/* Year Navigation */}
              <div className="flex items-center justify-between">
                <button 
                  type="button" 
                  disabled={format(viewDate, "yyyy") === "2024"}
                  onClick={() => setViewDate(subYears(viewDate, 1))}
                  className="p-1 hover:bg-background rounded-md border shadow-sm transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold tracking-tight">{format(viewDate, "yyyy")}</span>
                  <span className="text-[9px] uppercase tracking-tighter opacity-50 font-bold">Year Selection</span>
                </div>
                <button 
                  type="button" 
                  disabled={format(viewDate, "yyyy") === format(addMonths(new Date(), 3), "yyyy")}
                  onClick={() => setViewDate(addYears(viewDate, 1))}
                  className="p-1 hover:bg-background rounded-md border shadow-sm transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-2">
                {months.map((month, idx) => {
                  const currentMonthStr = format(setMonth(viewDate, idx), "yyyy-MM");
                  const isSelected = formData.depositStartDate === currentMonthStr;
                  const isToday = currentMonthStr === format(new Date(), "yyyy-MM");
                  
                  // Restraints: Global Start (2024-01) to Current + 3 Months
                  const monthDate = startOfMonth(setMonth(viewDate, idx));
                  const systemStart = startOfMonth(new Date(2024, 0, 1));
                  const futureLimit = startOfMonth(addMonths(new Date(), 3));
                  const isDisabled = monthDate < systemStart || monthDate > futureLimit;

                  return (
                    <button
                      key={month}
                      type="button"
                      disabled={isDisabled}
                      title={isDisabled ? (monthDate < systemStart ? "Before System Start" : "Limit: +3 Months") : ""}
                      onClick={() => setFormData({ ...formData, depositStartDate: currentMonthStr })}
                      className={`
                        relative py-3 text-xs font-bold rounded-xl border transition-all
                        ${isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.05] z-10" 
                          : isToday 
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-background text-foreground hover:border-primary/40 shadow-sm"
                        }
                        ${isDisabled ? "opacity-10 cursor-not-allowed bg-muted/50 border-transparent" : "hover:scale-[1.02]"}
                      `}
                    >
                      {month}
                      {isToday && !isSelected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 p-2 bg-primary/5 rounded-lg border border-dashed border-primary/20">
               <span className="text-[10px] font-semibold text-primary">Selected:</span>
               <span className="text-xs font-bold text-primary">
                 {formData.depositStartDate ? format(new Date(formData.depositStartDate + "-01"), "MMMM yyyy") : "None"}
               </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !formData.depositStartDate}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Sync
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
