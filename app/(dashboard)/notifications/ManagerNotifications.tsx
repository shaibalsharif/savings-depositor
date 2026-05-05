"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Send, Users, AlertCircle, Info, Search, Mail, Loader2, Check, ChevronDown, ChevronUp, BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import { sendManualNotification } from "@/lib/actions/notifications";
import Image from "next/image";
import { useEffect } from "react";

export function ManagerNotifications({ quota, history, allMembers, membersWithDues }: any) {
  const [targetMode, setTargetMode] = useState<"broadcast" | "specific">("broadcast");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [msgType, setMsgType] = useState<"info" | "reminder">("info");
  
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser does not support notifications");
      return;
    }
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission === "granted") {
      toast.success("Notifications enabled! You may need to refresh.");
    } else {
      toast.error("Notification permission denied");
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Derived preview logic
  let previewTitle = customTitle;
  let previewMessage = customMessage;

  if (msgType === "reminder") {
    if (selectedUserIds.length === 1) {
      const memberDue = membersWithDues.find((m: any) => m.id === selectedUserIds[0]);
      if (memberDue) {
        previewTitle = "⚠️ Payment Reminder — Project 13";
        previewMessage = `Dear ${memberDue.name},\n\nYou have an outstanding deposit balance of ৳${memberDue.totalDue.toLocaleString()}.\n\nPlease clear your dues at your earliest convenience.\n\nThank you,\nProject 13 Management`;
      }
    } else if (selectedUserIds.length > 1) {
      previewTitle = "⚠️ Payment Reminder — Project 13";
      previewMessage = "Dear Member,\n\nYou have an outstanding deposit balance with Project 13. Please check your dashboard and clear any pending dues.\n\nThank you,\nProject 13 Management";
    } else {
      previewTitle = "⚠️ Payment Reminder";
      previewMessage = "Please select member(s) to preview the reminder.";
    }
  }

  const handleSend = async () => {
    if (targetMode === "specific" && selectedUserIds.length === 0) {
      toast.error("Please select at least one member.");
      return;
    }
    if (!previewTitle || !previewMessage) {
      toast.error("Please provide a title and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendManualNotification({
        userIds: targetMode === "broadcast" ? [] : selectedUserIds,
        type: msgType,
        title: previewTitle,
        message: previewMessage,
      });

      if (res.success) {
        toast.success(`Notification sent to ${res.count} member(s)!`);
        setCustomTitle("");
        setCustomMessage("");
        if (targetMode === "specific") setSelectedUserIds([]);
      } else {
        toast.error(res.error || "Failed to send notification.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const pctUsed = Math.min(100, Math.round((quota.used / quota.total) * 100));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Send className="text-primary" />
            Notification Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dispatch manual alerts and monitor notification history.
          </p>
        </div>
        
        <div className="glass px-4 py-3 rounded-xl border flex items-center gap-4">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Mail size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Monthly Email Quota
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold leading-none">{quota.used}</span>
              <span className="text-sm text-muted-foreground leading-none mb-0.5">/ {quota.total}</span>
            </div>
            <div className="w-32 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pctUsed}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Compose Panel */}
        <div className="glass p-6 rounded-xl border space-y-6">
          <h2 className="text-lg font-bold border-b pb-2">Compose Notification</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Target Audience
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetMode("broadcast")}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition ${targetMode === "broadcast" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
                >
                  <Users size={16} /> Broadcast All
                </button>
                <button
                  onClick={() => setTargetMode("specific")}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition ${targetMode === "specific" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
                >
                  <Search size={16} /> Select Members
                </button>
              </div>
            </div>

            {targetMode === "specific" && (
              <div className="animate-in slide-in-from-top-2 fade-in space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-semibold text-muted-foreground uppercase">Select Members ({selectedUserIds.length})</label>
                   <div className="flex gap-3">
                     <button 
                       onClick={() => setIsGridExpanded(!isGridExpanded)}
                       className="text-[10px] text-primary hover:underline flex items-center gap-1"
                     >
                       {isGridExpanded ? <><ChevronUp size={12}/> Fold</> : <><ChevronDown size={12}/> Unfold</>}
                     </button>
                     <button 
                       onClick={() => setSelectedUserIds([])}
                       className="text-[10px] text-primary hover:underline"
                     >
                       Clear
                     </button>
                   </div>
                </div>
                <div className={`grid grid-cols-4 sm:grid-cols-5 gap-3 pr-2 custom-scrollbar transition-all duration-300 ${isGridExpanded ? 'max-h-[500px]' : 'max-h-[140px] overflow-hidden'}`}>
                  {allMembers.map((m: any) => {
                    const isSelected = selectedUserIds.includes(m.id);
                    const due = membersWithDues.find((d: any) => d.id === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMemberSelection(m.id)}
                        className={`relative group flex flex-col items-center gap-1.5 p-1 rounded-lg transition-all ${isSelected ? 'bg-primary/10' : 'hover:bg-muted'}`}
                      >
                        <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent bg-muted'}`}>
                          <AvatarImage src={m.photo} name={m.name} isSelected={isSelected} />
                        </div>
                        <span className={`text-[10px] truncate w-full text-center font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          {m.name.split(" ")[0]}
                        </span>
                        {due && due.totalDue > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-background rounded-full" title={`Due: ৳${due.totalDue.toLocaleString()}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Message Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMsgType("info")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition ${msgType === "info" ? "bg-[var(--teal)] text-white border-[var(--teal)]" : "bg-card hover:bg-muted"}`}
                >
                  <Info size={16} /> Information
                </button>
                <button
                  onClick={() => setMsgType("reminder")}
                  disabled={targetMode === "broadcast"}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition ${msgType === "reminder" ? "bg-rose-500 text-white border-rose-500" : "bg-card hover:bg-muted disabled:opacity-50"}`}
                  title={targetMode === "broadcast" ? "Reminders can only be sent to specific members" : ""}
                >
                  <AlertCircle size={16} /> Payment Reminder
                </button>
              </div>
            </div>

            {msgType === "info" && (
              <div className="space-y-3 animate-in fade-in">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notification Title</label>
                  <input
                    type="text"
                    className="w-full bg-card border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. Important Fund Update"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Message Body</label>
                  <textarea
                    className="w-full bg-card border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[120px]"
                    placeholder="Type your message here..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="glass p-6 rounded-xl border flex flex-col">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Message Preview</h2>
          
          <div className="flex-1 bg-muted/40 border rounded-xl p-4 overflow-auto">
            {!previewTitle && !previewMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Mail size={40} className="mb-2" />
                <p className="text-sm">Preview will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="font-semibold text-foreground text-lg">{previewTitle}</div>
                <div className="text-sm text-foreground whitespace-pre-wrap">{previewMessage}</div>
                <div className="pt-4 border-t text-xs text-muted-foreground mt-4">
                  Sent via Email & Push Notification
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={loading || (!previewTitle && !previewMessage)}
            className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {loading ? "Sending..." : targetMode === "broadcast" ? "Broadcast to All Members" : `Send to ${selectedUserIds.length} Members`}
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="glass rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
          <h2 className="font-bold">Sent History (Last 100)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Recipient</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Channels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No notifications sent yet.
                  </td>
                </tr>
              ) : (
                history.map((row: any) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(row.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {row.userName || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.type === "reminder" ? "bg-rose-500/10 text-rose-500" :
                        row.type === "deposit" ? "bg-emerald-500/10 text-emerald-500" :
                        row.type === "summary" ? "bg-purple-500/10 text-purple-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-[250px]" title={row.title}>
                      {row.title}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {row.channels?.map((ch: string) => (
                          <span key={ch} className="px-1.5 py-0.5 bg-muted rounded text-[10px] uppercase font-bold text-muted-foreground">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Push Status Debug */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleEnableNotifications}
          className={`p-3 rounded-full shadow-lg flex items-center gap-2 transition ${
            pushPermission === "granted" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white animate-bounce"
          }`}
          title={pushPermission === "granted" ? "Notifications Enabled" : "Notifications Disabled - Click to Enable"}
        >
          {pushPermission === "granted" ? <BellRing size={20} /> : <BellOff size={20} />}
          <span className="text-xs font-bold pr-1">{pushPermission === "granted" ? "Active" : "Enable Alerts"}</span>
        </button>
      </div>
    </div>
  );
}

function AvatarImage({ src, name, isSelected }: { src?: string; name: string; isSelected: boolean }) {
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
        {initials}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
            <Check size={20} className="text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image 
        src={src} 
        alt={name} 
        fill
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
      {isSelected && (
        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
          <Check size={20} className="text-white" />
        </div>
      )}
    </div>
  );
}
