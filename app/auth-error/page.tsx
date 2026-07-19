"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function AuthErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const [countdown, setCountdown] = useState(10);

  const isStateMismatch = reason === "state_mismatch";

  // Auto-retry after countdown
  useEffect(() => {
    if (countdown <= 0) {
      handleRetry();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function handleRetry() {
    // Full cycle: logout clears all Kinde cookies/state, then login restarts fresh
    window.location.href = "/api/auth/logout?post_logout_redirect_url=" + encodeURIComponent("/api/auth/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-6">
      <div className="max-w-sm w-full text-center space-y-6">

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Sign-in interrupted
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isStateMismatch
              ? "A security check failed during sign-in. This usually happens when switching Google accounts or returning from a long session."
              : "Something went wrong during the sign-in process. Please try again."}
          </p>
        </div>

        {/* Tips for state mismatch */}
        {isStateMismatch && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-left space-y-2">
            <p className="text-slate-300 text-xs font-medium uppercase tracking-wider">What happened?</p>
            <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
              <li>Your app opened Google login in a separate browser window</li>
              <li>The login state got out of sync between them</li>
              <li>Tapping &ldquo;Try Again&rdquo; below will clear everything and start fresh</li>
            </ul>
          </div>
        )}

        {/* Retry button */}
        <button
          onClick={handleRetry}
          className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-sm transition-all duration-150"
        >
          Try Again {countdown > 0 && <span className="opacity-60 ml-1">({countdown}s)</span>}
        </button>

        <p className="text-slate-600 text-xs">
          Retrying automatically in {countdown} second{countdown !== 1 ? "s" : ""}…
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
