"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Error — Project 13</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif", background: "hsl(222 47% 7%)", color: "hsl(210 40% 96%)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20, padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            ⚠️
          </div>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>Something went wrong</h1>
            <p style={{ margin: 0, color: "hsl(215 20% 55%)", fontSize: 14 }}>
              Your session may have expired, or an unexpected error occurred.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="/api/auth/login"
              style={{ background: "#2dd4bf", color: "hsl(222 47% 7%)", padding: "10px 24px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14 }}
            >
              Re-Login
            </a>
            <button
              onClick={reset}
              style={{ background: "rgba(255,255,255,0.08)", color: "hsl(210 40% 96%)", padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Try Again
            </button>
          </div>
          {error?.digest && (
            <p style={{ fontSize: 11, color: "hsl(215 20% 35%)", marginTop: 8 }}>Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
