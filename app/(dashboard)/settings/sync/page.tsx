import { db } from "@/db/client";
import { syncLogs, payments, expenses, investments, revenueLosses } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { desc, eq, count } from "drizzle-orm";
import { format } from "date-fns";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SyncRetryButton } from "./retry-button";

import Link from "next/link";

export default async function SyncDashboardPage() {
  await requireManager();

  const [logs, pendingCounts] = await Promise.all([
    db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(100),
    Promise.all([
      db.select({ c: count() }).from(payments).where(eq(payments.syncStatus, "pending")),
      db.select({ c: count() }).from(expenses).where(eq(expenses.syncStatus, "pending")),
      db.select({ c: count() }).from(investments).where(eq(investments.syncStatus, "pending")),
      db.select({ c: count() }).from(revenueLosses).where(eq(revenueLosses.syncStatus, "pending")),
    ]),
  ]);

  const totalPending =
    (pendingCounts[0][0]?.c ?? 0) +
    (pendingCounts[1][0]?.c ?? 0) +
    (pendingCounts[2][0]?.c ?? 0) +
    (pendingCounts[3][0]?.c ?? 0);

  const errorLogs = logs.filter((l) => l.status === "error");
  const successToday = logs.filter(
    (l) => l.status === "success" && l.createdAt > new Date(Date.now() - 86400000)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-3 text-sm select-none">
        <Link
          href="/settings/deposits"
          className="text-muted-foreground hover:text-foreground"
        >
          Deposit Settings
        </Link>
        <Link
          href="/settings/sync"
          className="font-bold text-[var(--teal)] border-b-2 border-[var(--teal)] pb-2.5 -mb-3.5"
        >
          Google Sheets Sync
        </Link>
        <Link
          href="/settings/reports"
          className="text-muted-foreground hover:text-foreground"
        >
          Monthly Reports
        </Link>
      </div>

      <Breadcrumbs
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", href: "/settings" },
          { label: "Sync Dashboard" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sync Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor Google Sheets ↔ Database synchronization health
          </p>
        </div>
        <SyncRetryButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Sync",
            value: totalPending.toString(),
            color: totalPending > 0 ? "var(--amber)" : "var(--green)",
            desc: "rows waiting to sync",
          },
          {
            label: "Errors",
            value: errorLogs.length.toString(),
            color: errorLogs.length > 0 ? "var(--red)" : "var(--green)",
            desc: "in last 100 events",
          },
          {
            label: "Synced Today",
            value: successToday.toString(),
            color: "var(--teal)",
            desc: "successful syncs",
          },
          {
            label: "Total Events",
            value: logs.length.toString(),
            color: "var(--purple)",
            desc: "last 100 logged",
          },
        ].map((s) => (
          <div key={s.label} className="glass p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{s.label}</div>
            <div className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Pending breakdown */}
      {totalPending > 0 && (
        <div
          className="glass p-4 flex items-center gap-3"
          style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--amber)" }}>
              {totalPending} row{totalPending !== 1 ? "s" : ""} pending sync
            </p>
            <p className="text-xs text-muted-foreground">
              Payments: {Number(pendingCounts[0][0]?.c ?? 0)} · Expenses: {Number(pendingCounts[1][0]?.c ?? 0)} ·
              Investments: {Number(pendingCounts[2][0]?.c ?? 0)} · Revenue: {Number(pendingCounts[3][0]?.c ?? 0)}
              {" "}— GitHub Actions will retry within 15 minutes, or use the &quot;Force Retry&quot; button above.
            </p>
          </div>
        </div>
      )}

      {/* Sync log table */}
      <div className="glass overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-base font-bold">Sync Event Log</h2>
          <span className="text-xs text-muted-foreground">Last 100 events</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Direction</th>
              <th>Sheet</th>
              <th>Entry ID</th>
              <th>Row</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="text-muted-foreground text-xs whitespace-nowrap">
                  {format(new Date(log.createdAt), "dd MMM HH:mm:ss")}
                </td>
                <td>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{
                      background:
                        log.direction === "app_to_sheet"
                          ? "rgba(20,184,166,0.15)"
                          : log.direction === "cron_retry"
                          ? "rgba(139,92,246,0.15)"
                          : "rgba(59,130,246,0.15)",
                      color:
                        log.direction === "app_to_sheet"
                          ? "var(--teal)"
                          : log.direction === "cron_retry"
                          ? "var(--purple)"
                          : "#3b82f6",
                    }}
                  >
                    {log.direction.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="text-muted-foreground text-xs">{log.sheetName ?? "—"}</td>
                <td className="font-mono text-xs text-muted-foreground">{log.entryId ?? "—"}</td>
                <td className="text-muted-foreground text-xs">{log.rowIndex ?? "—"}</td>
                <td>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        log.status === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: log.status === "success" ? "var(--green)" : "var(--red)",
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td
                  className="text-xs max-w-xs truncate"
                  style={{ color: log.errorMessage ? "var(--red)" : "var(--muted-foreground)" }}
                  title={log.errorMessage ?? ""}
                >
                  {log.errorMessage ?? "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No sync events logged yet. Events will appear here once syncing begins.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
