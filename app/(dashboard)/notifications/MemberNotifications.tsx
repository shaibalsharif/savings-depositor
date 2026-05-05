"use client";

import { format } from "date-fns";
import { Bell, CheckCircle2, AlertCircle, Info, Mail } from "lucide-react";
import { markNotificationAsRead } from "@/lib/actions/notifications";

export function MemberNotifications({ notifications }: { notifications: any[] }) {
  const handleMarkRead = async (id: number) => {
    await markNotificationAsRead(id);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="text-primary" />
          My Notifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {unreadCount > 0 
            ? `You have ${unreadCount} unread notification(s).` 
            : "You're all caught up!"}
        </p>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="glass p-12 rounded-xl border flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold">No Notifications Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-2">
              When you receive deposit confirmations, reminders, or updates, they will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`glass p-5 rounded-xl border transition-all ${n.isRead ? 'opacity-70 bg-card/50' : 'border-primary/30 shadow-md bg-card/80'}`}
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
                    <h3 className={`font-bold ${!n.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                      {n.title}
                    </h3>
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
                      className="mt-4 text-xs font-semibold text-primary hover:text-primary/80 transition"
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
    </div>
  );
}
