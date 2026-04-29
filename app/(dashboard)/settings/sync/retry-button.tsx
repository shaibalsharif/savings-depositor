"use client";

import { useState } from "react";

export function SyncRetryButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRetry = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/retry-sync", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setResult(`❌ Network error: ${e.message}`);
    } finally {
      setLoading(false);
      // Reload after 2s to show fresh data
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRetry}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "var(--purple)", color: "white" }}
      >
        {loading ? "Retrying…" : "⟳ Force Retry Now"}
      </button>
      {result && (
        <p className="text-xs" style={{ color: result.startsWith("✅") ? "var(--green)" : "var(--red)" }}>
          {result}
        </p>
      )}
    </div>
  );
}
