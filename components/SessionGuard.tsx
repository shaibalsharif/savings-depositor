"use client";

import { useEffect, useRef } from "react";

// If the tab was hidden for longer than this, treat it as a "cold return"
// and check the session immediately (bypassing the normal debounce).
const LONG_IDLE_MS = 15 * 60 * 1000; // 15 minutes

// Normal debounce: don't check more than once per interval while the app
// is actively in use.
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function SessionGuard() {
  const lastCheckRef = useRef<number>(0);
  const lastHiddenAtRef = useRef<number>(0);
  const checkingRef = useRef(false);

  async function checkSession(force = false) {
    if (checkingRef.current) return;

    const now = Date.now();
    // Skip if within normal debounce window AND not a forced check
    if (!force && now - lastCheckRef.current < CHECK_INTERVAL_MS) return;

    checkingRef.current = true;
    lastCheckRef.current = now;

    try {
      const res = await fetch("/api/auth/check", { cache: "no-store" });
      if (res.status === 401) {
        // Session expired — hard-navigate to login (clears all JS state)
        window.location.href = "/api/auth/login";
      }
    } catch {
      // Network error — don't redirect, user might just be offline
    } finally {
      checkingRef.current = false;
    }
  }

  useEffect(() => {
    // ── Check once on mount (catches stale sessions on first render) ─────────
    checkSession(true);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Record when the tab was last hidden
        lastHiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState === "visible") {
        const hiddenDuration = Date.now() - lastHiddenAtRef.current;
        // If was hidden for a long time, force an immediate re-check
        const force = hiddenDuration >= LONG_IDLE_MS;
        checkSession(force);
      }
    };

    const handleFocus = () => {
      // Window focus (e.g. switching back from another app on Android)
      const hiddenDuration = Date.now() - lastHiddenAtRef.current;
      const force = hiddenDuration >= LONG_IDLE_MS;
      checkSession(force);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
