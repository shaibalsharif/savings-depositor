"use client";

import { useEffect, useState } from "react";

/**
 * DesktopModeWarning
 *
 * Detects when Chrome's "Desktop site" toggle is active for this origin
 * and shows a dismissible banner guiding the user to fix it.
 *
 * Detection method: Chrome desktop mode forces a desktop User-Agent string
 * (contains "X11" or removes "Mobile" from the UA). We check for the
 * absence of mobile indicators alongside a non-touch viewport width.
 */
export function DesktopModeWarning() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run in a PWA standalone context (not regular browser tab)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (!isStandalone) return;

    // Check if previously dismissed in this session
    if (sessionStorage.getItem("desktop-mode-warning-dismissed") === "1") return;

    const ua = navigator.userAgent;

    // A real mobile UA contains "Mobile" or "Android" alongside typical mobile tokens.
    // Chrome desktop mode spoofs a desktop UA — it removes "Mobile" and adds "X11" or "Win".
    const hasMobileUA = /Mobile|Android|iPhone|iPad/i.test(ua);

    // Also check: if the viewport width exactly matches screen.width it may be
    // desktop-mode (no mobile scaling). On real mobile the browser chrome adjusts these.
    const viewportMatchesScreen = window.innerWidth === screen.width && screen.width > 600;

    if (!hasMobileUA && viewportMatchesScreen) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("desktop-mode-warning-dismissed", "1");
  }

  if (!show || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-start gap-3 px-4 py-3"
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        borderBottom: "1px solid rgba(251,191,36,0.3)",
      }}
    >
      {/* Warning icon */}
      <div className="shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-yellow-300 text-xs font-semibold leading-tight">
          Desktop mode is on
        </p>
        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
          Open Chrome &rarr; tap the <span className="text-slate-200 font-medium">⋮ menu</span> &rarr; uncheck{" "}
          <span className="text-slate-200 font-medium">&ldquo;Desktop site&rdquo;</span>, then return here and refresh.
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss desktop mode warning"
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 -m-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
