"use client";

import { useState } from "react";
import { Check, Loader2, Bell, Mail } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings({ 
  initialPrefs, 
  userId 
}: { 
  initialPrefs: any; 
  userId: string 
}) {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    notificationEmail: initialPrefs?.notificationEmail || "",
    notifyOnDeposit: initialPrefs?.notifyOnDeposit ?? true,
    notifyOnReminder: initialPrefs?.notifyOnReminder ?? true,
    notifyOnSummary: initialPrefs?.notifyOnSummary ?? true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Notification settings saved");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-xl space-y-4 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={18} className="text-primary" />
        <h3 className="text-base font-semibold tracking-wider text-foreground">Notification Preferences</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notification Email (optional)</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="email" 
              className="w-full bg-muted/40 border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Leave blank to use your default login email"
              value={prefs.notificationEmail}
              onChange={(e) => setPrefs({ ...prefs, notificationEmail: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-muted"
              checked={prefs.notifyOnDeposit}
              onChange={(e) => setPrefs({ ...prefs, notifyOnDeposit: e.target.checked })}
            />
            <span className="text-sm">Deposit Confirmations (Instant)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-muted"
              checked={prefs.notifyOnReminder}
              onChange={(e) => setPrefs({ ...prefs, notifyOnReminder: e.target.checked })}
            />
            <span className="text-sm">End-of-Month Pending Reminders</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-muted"
              checked={prefs.notifyOnSummary}
              onChange={(e) => setPrefs({ ...prefs, notifyOnSummary: e.target.checked })}
            />
            <span className="text-sm">Monthly Summary (1st of Month)</span>
          </label>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
