"use client";

import { useEffect, useRef } from "react";

/**
 * PwaInit — runs once after the user is authenticated.
 *
 * 1. Registers the service worker (sw.js).
 * 2. Subscribes the current device to push notifications (if permission granted).
 *    → Saves subscription to DB via POST /api/push/subscribe.
 *    → This must run on EVERY device/browser independently.
 * 3. After SW is active, tells it to warm-cache the key data pages so they
 *    are available offline even on the first authenticated session.
 */

const PAGES_TO_CACHE = [
  "/dashboard",
  "/my-deposits",
  "/expenses",
  "/investments",
  "/my-profile",
  "/monthly-reports",
  "/settings/deposits",
];

export function PwaInit() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    registered.current = true;
    initPwa();
  }, []);

  return null;
}

async function initPwa() {
  try {
    // ── 1. Register service worker ─────────────────────────────────────────
    const reg = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none", // always check for SW updates
    });
    console.log("[PwaInit] SW registered, scope:", reg.scope);

    // Wait for the SW to be in a usable state (installed or active)
    const sw = reg.installing ?? reg.waiting ?? reg.active;
    if (sw && sw.state !== "activated") {
      await new Promise<void>(resolve => {
        const listener = () => {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", listener);
            resolve();
          }
        };
        sw.addEventListener("statechange", listener);
        // Fallback: resolve after 3s regardless
        setTimeout(resolve, 3000);
      });
    }

    // ── 2. Warm page cache ─────────────────────────────────────────────────
    // Tell the SW (via postMessage) to pre-fetch key pages now that we know
    // the user is authenticated. The SW will cache these responses.
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_PAGES",
        urls: PAGES_TO_CACHE,
      });
      console.log("[PwaInit] Sent CACHE_PAGES message to SW");
    } else {
      // SW just activated — wait for it to claim this page, then message
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        navigator.serviceWorker.controller?.postMessage({
          type: "CACHE_PAGES",
          urls: PAGES_TO_CACHE,
        });
      }, { once: true });
    }

    // ── 3. Push subscription ───────────────────────────────────────────────
    await subscribeToPush(reg);

  } catch (err) {
    console.error("[PwaInit] Initialization error:", err);
  }
}

async function subscribeToPush(reg: ServiceWorkerRegistration) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("[PwaInit] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — skipping push subscription");
    return;
  }

  if (!("PushManager" in window)) {
    console.warn("[PwaInit] Push not supported in this browser");
    return;
  }

  try {
    // Check if already subscribed on this device
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      // Re-save to DB in case it was cleared (idempotent upsert on server)
      await saveSubscription(existing);
      console.log("[PwaInit] Push already subscribed for this device — refreshed DB record");
      return;
    }

    // Only auto-subscribe if permission was previously granted
    // (Don't ask for permission here — that's done by the PushPermissionBanner)
    const permission = Notification.permission;
    if (permission !== "granted") {
      console.log("[PwaInit] Push permission not granted yet — skipping auto-subscribe");
      return;
    }

    // Subscribe this device
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    await saveSubscription(subscription);
    console.log("[PwaInit] New push subscription created and saved for this device");

  } catch (err) {
    // Non-fatal: permission denied, private mode, etc.
    console.warn("[PwaInit] Push subscription skipped:", err);
  }
}

async function saveSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
    }),
  });
  if (!response.ok) {
    console.error("[PwaInit] Failed to save subscription to server:", response.status);
  }
}

/** Convert VAPID public key from base64url to Uint8Array for PushManager */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
