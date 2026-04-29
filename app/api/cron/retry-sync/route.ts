import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, expenses, investments, revenueLosses, syncLogs } from "@/db/schema";
import { appendRow, updateRow } from "@/lib/sheets";
import { eq, and, or } from "drizzle-orm";

/**
 * GET /api/cron/retry-sync
 *
 * Called by GitHub Actions on a schedule (every 15 min).
 * Authenticates via Authorization: Bearer <CRON_SECRET>.
 * Finds all rows with syncStatus='pending' and retries the Google Sheets push.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { retried: 0, synced: 0, failed: 0 };

  // ── Retry pending Payments ─────────────────────────────────────────────────
  const pendingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.syncStatus, "pending"));

  for (const p of pendingPayments) {
    results.retried++;
    try {
      const row = [p.paymentId, p.memberId, p.amountReceived, p.paymentDate, p.note ?? "", p.voided ? "TRUE" : "FALSE"];
      let rowIndex = p.sheetsRowIndex;
      if (!rowIndex) {
        rowIndex = await appendRow("Payments", row);
      } else {
        await updateRow("Payments", rowIndex, row);
      }
      await db.update(payments).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(payments.paymentId, p.paymentId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Payments", rowIndex, entryId: p.paymentId, status: "success" });
      results.synced++;
    } catch (e: any) {
      await db.update(payments).set({ syncStatus: "failed" }).where(eq(payments.paymentId, p.paymentId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Payments", entryId: p.paymentId, status: "error", errorMessage: e.message });
      results.failed++;
    }
  }

  // ── Retry pending Expenses ─────────────────────────────────────────────────
  const pendingExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.syncStatus, "pending"));

  for (const e of pendingExpenses) {
    results.retried++;
    try {
      const row = [e.entryId, e.expenseDate, e.category, e.description, e.amount, e.linkedInvestmentId ?? "", e.voided ? "TRUE" : "FALSE"];
      let rowIndex = e.sheetsRowIndex;
      if (!rowIndex) {
        rowIndex = await appendRow("Expenses", row);
      } else {
        await updateRow("Expenses", rowIndex, row);
      }
      await db.update(expenses).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(expenses.entryId, e.entryId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Expenses", rowIndex, entryId: e.entryId, status: "success" });
      results.synced++;
    } catch (err: any) {
      await db.update(expenses).set({ syncStatus: "failed" }).where(eq(expenses.entryId, e.entryId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Expenses", entryId: e.entryId, status: "error", errorMessage: err.message });
      results.failed++;
    }
  }

  // ── Retry pending Investments ──────────────────────────────────────────────
  const pendingInvestments = await db
    .select()
    .from(investments)
    .where(eq(investments.syncStatus, "pending"));

  for (const inv of pendingInvestments) {
    results.retried++;
    try {
      const row = [inv.entryId, inv.investDate, inv.recipient, inv.principal, inv.expectedReturnDate, inv.actualReturnDate ?? "", inv.status, inv.note ?? ""];
      let rowIndex = inv.sheetsRowIndex;
      if (!rowIndex) {
        rowIndex = await appendRow("Investments", row);
      } else {
        await updateRow("Investments", rowIndex, row);
      }
      await db.update(investments).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(investments.entryId, inv.entryId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Investments", rowIndex, entryId: inv.entryId, status: "success" });
      results.synced++;
    } catch (err: any) {
      await db.update(investments).set({ syncStatus: "failed" }).where(eq(investments.entryId, inv.entryId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Investments", entryId: inv.entryId, status: "error", errorMessage: err.message });
      results.failed++;
    }
  }

  // ── Retry pending Revenue/Losses ───────────────────────────────────────────
  const pendingRevenue = await db
    .select()
    .from(revenueLosses)
    .where(eq(revenueLosses.syncStatus, "pending"));

  for (const r of pendingRevenue) {
    results.retried++;
    try {
      const row = [r.entryId, r.eventDate, r.sourceType, r.description, r.amount, r.linkedInvestmentId ?? "", r.voided ? "TRUE" : "FALSE"];
      let rowIndex = r.sheetsRowIndex;
      if (!rowIndex) {
        rowIndex = await appendRow("Revenue_Losses", row);
      } else {
        await updateRow("Revenue_Losses", rowIndex, row);
      }
      await db.update(revenueLosses).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(revenueLosses.entryId, r.entryId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Revenue_Losses", rowIndex, entryId: r.entryId, status: "success" });
      results.synced++;
    } catch (err: any) {
      await db.update(revenueLosses).set({ syncStatus: "failed" }).where(eq(revenueLosses.entryId, r.entryId));
      await db.insert(syncLogs).values({ direction: "cron_retry", sheetName: "Revenue_Losses", entryId: r.entryId, status: "error", errorMessage: err.message });
      results.failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    ...results,
    message: `Retry complete: ${results.synced} synced, ${results.failed} failed out of ${results.retried} retried`,
  });
}
