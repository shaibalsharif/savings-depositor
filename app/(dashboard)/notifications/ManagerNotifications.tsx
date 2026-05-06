"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Send, Users, AlertCircle, Info, Search, Mail, Loader2, Check, ChevronDown, ChevronUp, Bell, CheckCircle2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { sendManualNotification, markNotificationAsRead } from "@/lib/actions/notifications";
import Image from "next/image";

export function ManagerNotifications({ quota, history, allMembers, membersWithDues, myNotifications, currentUserId }: any) {
  const [targetMode, setTargetMode] = useState<"broadcast" | "specific">("broadcast");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [msgType, setMsgType] = useState<"info" | "reminder">("info");
  
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGridExpanded, setIsGridExpanded] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [activeTab, setActiveTab] = useState<"compose" | "inbox">("compose");
  const [myNotifsState, setMyNotifsState] = useState<any[]>(myNotifications || []);

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
      // Subscribe THIS device so the manager receives push on Mac Chrome too
      try {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey && "serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const existing = await reg.pushManager.getSubscription();
          let sub = existing;
          if (!sub) {
            const padding = "=".repeat((4 - vapidKey.length % 4) % 4);
            const b64 = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
            const raw = window.atob(b64);
            const key = Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
          }
          const json = sub.toJSON();
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
          });
          toast.success("Push notifications enabled for this device!");
        }
      } catch (e) {
        console.warn("Push subscription failed:", e);
        toast.success("Permission granted — reload to activate push on this device.");
      }
    } else {
      toast.error("Notification permission denied");
    }
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationAsRead(id);
    setMyNotifsState(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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

  const handleTestPush = async () => {
    setLoading(true);
    try {
      const res = await sendManualNotification({
        userIds: [currentUserId],
        type: "info",
        title: "🔔 Test Notification",
        message: "This is a test notification to verify delivery on this device.",
      });
      if (res.success) toast.success("Test notification sent!");
    } catch (err: any) {
      toast.error("Test failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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
  const unreadCount = myNotifsState.filter((n: any) => !n.isRead).length;

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
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleEnableNotifications}
              className={`text-[11px] px-3 py-1.5 rounded-full border flex items-center gap-2 transition font-bold ${
                pushPermission === "granted" 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${pushPermission === "granted" ? "bg-emerald-500" : "bg-rose-500"}`} />
              {pushPermission === "granted" ? "Browser Alerts Active" : "Enable Browser Alerts"}
            </button>
            
            {pushPermission === "granted" && (
              <button
                onClick={handleTestPush}
                className="text-[11px] px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition font-bold"
              >
                Test This Device
              </button>
            )}
          </div>
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

      {/* Tab switcher: Compose vs My Inbox */}
      <div className="flex gap-1 bg-muted/30 border p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("compose")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "compose"
              ? "bg-card shadow text-foreground border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send size={14} /> Compose
        </button>
        <button
          onClick={() => setActiveTab("inbox")}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "inbox"
              ? "bg-card shadow text-foreground border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox size={14} /> My Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* My Received Notifications (Manager's own inbox) */}
      {activeTab === "inbox" && (
        <div className="space-y-4">
          {myNotifsState.length === 0 ? (
            <div className="glass p-12 rounded-xl border flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <Bell size={32} />
              </div>
              <h3 className="text-lg font-bold">No Notifications Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-2">
                When deposit confirmations, reminders, or updates are sent to you, they will appear here.
              </p>
            </div>
          ) : (
            myNotifsState.map((n: any) => (
              <div
                key={n.id}
                className={`glass p-5 rounded-xl border transition-all ${
                  n.isRead ? "opacity-70 bg-card/50" : "border-primary/30 shadow-md bg-card/80"
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-1 ${
                    n.type === "deposit" ? "bg-emerald-500/10 text-emerald-500" :
                    n.type === "reminder" ? "bg-rose-500/10 text-rose-500" :
                    n.type === "summary" ? "bg-purple-500/10 text-purple-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {n.type === "deposit" ? <CheckCircle2 size={20} /> :
                     n.type === "reminder" ? <AlertCircle size={20} /> :
                     n.type === "summary" ? <Bell size={20} /> :
                     <Info size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className={`font-bold ${!n.isRead ? "text-foreground" : "text-foreground/80"}`}>{n.title}</h3>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(n.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {n.message}
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="mt-3 text-xs font-semibold text-primary hover:text-primary/80 transition"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "compose" && <div className="grid lg:grid-cols-2 gap-8">
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
      </div>}

      {activeTab === "compose" && (
        <>
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
        </>
      )}
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
        onError={() => {
          console.error(`[AvatarImage] Failed to load: ${src}`);
          setError(true);
        }}
        unoptimized
        referrerPolicy="no-referrer"
      />
      {isSelected && (
        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
          <Check size={20} className="text-white" />
        </div>
      )}
    </div>
  );
}
