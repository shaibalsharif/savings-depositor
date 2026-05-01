"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // re-check every 5 min on focus (debounce)

export function SessionGuard() {
  const lastCheckRef = useRef<number>(0);
  const checkingRef = useRef(false);

  async function checkSession() {
    if (checkingRef.current) return;
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_INTERVAL_MS) return; // debounce

    checkingRef.current = true;
    lastCheckRef.current = now;

    try {
      const res = await fetch("/api/auth/check", { cache: "no-store" });
      if (res.status === 401) {
        // Session expired — redirect to login
        window.location.href = "/api/auth/login";
      }
    } catch {
      // Network error — don't redirect, user might just be offline
    } finally {
      checkingRef.current = false;
    }
  }

  useEffect(() => {
    const handleFocus = () => checkSession();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
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
