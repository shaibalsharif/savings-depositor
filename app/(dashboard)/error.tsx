"use client";

import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 20,
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        ⚠️
      </div>
      <div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "hsl(210 40% 96%)" }}>
          Session expired or error occurred
        </h2>
        <p style={{ margin: 0, color: "hsl(215 20% 55%)", fontSize: 14 }}>
          Please re-login or try again.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/api/auth/login"
          style={{
            background: "#2dd4bf",
            color: "hsl(222 47% 7%)",
            padding: "9px 20px",
            borderRadius: 9,
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          Re-Login
        </a>
        <button
          onClick={() => reset()}
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "hsl(210 40% 96%)",
            padding: "9px 20px",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "hsl(215 20% 55%)",
            padding: "9px 20px",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.07)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ← Go to Dashboard
        </button>
      </div>
    </div>
  );
}
