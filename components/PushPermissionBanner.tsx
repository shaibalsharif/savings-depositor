"use client";

import { useEffect, useState } from "react";
import { BellRing, X, CheckCircle2 } from "lucide-react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPermissionBanner() {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    if (sessionStorage.getItem("push-banner-dismissed") === "true") {
      return;
    }

    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) {
            setShow(true);
          } else {
            setSubscribed(true);
          }
        });
      });
    } else if (Notification.permission === "default") {
      setShow(true);
    }
  }, [isLoading, isAuthenticated]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          throw new Error("Missing VAPID public key");
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(publicVapidKey),
        });

        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });

        if (res.ok) {
          setSubscribed(true);
          setTimeout(() => setShow(false), 2000);
        } else {
          console.error("Failed to save subscription to server");
          toast.error("Failed to sync with server. Please try again.");
        }
      } else {
        handleDismiss();
      }
    } catch (err: any) {
      console.error("Push subscription failed:", err);
      toast.error(err.message || "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("push-banner-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card border shadow-lg rounded-xl p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-10 -mt-10 rounded-full" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition"
        >
          <X size={16} />
        </button>

        {subscribed ? (
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-500">Notifications Enabled</p>
              <p className="text-xs text-muted-foreground">You will now receive alerts.</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                <BellRing size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable Notifications</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Get instant alerts for your deposits and monthly reminders.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? "Enabling..." : "Allow Push Alerts"}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
