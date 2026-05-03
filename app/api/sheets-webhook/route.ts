import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, expenses, investments, revenueLosses, syncLogs, depositAllocations, personalInfo, investmentShares } from "@/db/schema";
import { readSheet, SheetName } from "@/lib/sheets";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Date normalizer ─────────────────────────────────────────────────────────
// Google Sheets sends Date cell values as locale strings from Apps Script (e.g.
// "Sat Apr 04 2026 00:00:00 GMT+0600"). This converts any parseable date string
// to YYYY-MM-DD or YYYY-MM. If the value is already in the target format, it's
// returned unchanged.
function normalizeDate(value: string | undefined, type: "date" | "month"): string {
  if (!value) return "";
  // Already correct
  if (type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (type === "month" && /^\d{4}-\d{2}$/.test(value)) return value;
  // Try to parse as a date. Use UTC methods to extract the date portion that
  // corresponds to the calendar date in any timezone.
  const ts = Date.parse(value);
  if (!isNaN(ts)) {
    const d = new Date(ts);
    // We use the date string that was visible to the user in the sheet:
    // Apps Script formats dates in the spreadsheet's timezone, so we parse the
    // timezone offset from the string directly.
    const match = value.match(/GMT([+-]\d{4})/);
    const offsetMin = match
      ? (parseInt(match[1].slice(0, 3)) * 60 + parseInt(match[1].slice(3))) 
      : 0;
    const localMs = ts + offsetMin * 60000;
    const local = new Date(localMs);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, "0");
    const day = String(local.getUTCDate()).padStart(2, "0");
    if (type === "date") return `${y}-${m}-${day}`;
    if (type === "month") return `${y}-${m}`;
  }
  return value;
}

// ─── Zod validation schemas per sheet type ───────────────────────────────────

const PaymentSchema = z.object({
  "Payment ID": z.string().min(1),
  "Amount": z.coerce.number().positive("Amount must be a positive number"),
  "Date": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  "For Month": z.string().regex(/^\d{4}-\d{2}$/, "For Month must be YYYY-MM"),
  "Note": z.string().optional(),
  "Voided": z.string().transform((v) => v.toUpperCase() === "TRUE"),
});

const ExpenseSchema = z.object({
  "Entry ID": z.string().min(1),
  "Date": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  "Category": z.string().min(1),
  "Description": z.string().min(1),
  "Amount": z.coerce.number().positive("Amount must be a positive number"),
  "Linked Inv": z.string().optional(),
  "Voided": z.string().transform((v) => v.toUpperCase() === "TRUE"),
});

const InvestmentSchema = z.object({
  "Entry ID": z.string().min(1),
  "Date": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  "Recipient": z.string().min(1),
  "Principal": z.coerce.number().positive("Principal must be a positive number"),
  "Exp Return": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected return must be YYYY-MM-DD"),
  "Act Return": z.string().optional(),
  "Status": z.enum(["active", "matured", "defaulted"]),
  "Note": z.string().optional(),
});

const RevenueLossSchema = z.object({
  "Entry ID": z.string().min(1),
  "Date": z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  "Source Type": z.enum(["profit", "loss", "principal_return", "bank_profit", "other"]),
  "Description": z.string().min(1),
  "Amount": z.coerce.number().positive("Amount must be a positive number"),
  "Linked Inv": z.string().optional(),
  "Voided": z.string().transform((v) => v.toUpperCase() === "TRUE"),
});

// ─── Logging helper ──────────────────────────────────────────────────────────

async function log(opts: {
  direction: string;
  sheetName?: string;
  rowIndex?: number;
  entryId?: string;
  status: "success" | "error";
  errorMessage?: string;
  payload?: object;
}) {
  try {
    await db.insert(syncLogs).values({
      direction: opts.direction,
      sheetName: opts.sheetName ?? null,
      rowIndex: opts.rowIndex ?? null,
      entryId: opts.entryId ?? null,
      status: opts.status,
      errorMessage: opts.errorMessage ?? null,
      payload: opts.payload ?? null,
    });
  } catch (e) {
    console.error("Failed to write sync log:", e);
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Authenticate
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sheet, row, data } = body;

  if (!sheet || !row || !data) {
    return NextResponse.json({ error: "Bad Request: missing sheet, row, or data" }, { status: 400 });
  }

  const direction = "sheet_to_app";

  try {
    switch (sheet as SheetName) {
      case "Payments": {
        // Normalize date fields before validation (Google Sheets may send Date objects as locale strings)
        if (data["Date"]) data["Date"] = normalizeDate(data["Date"], "date");
        if (data["For Month"]) data["For Month"] = normalizeDate(data["For Month"], "month");
        console.log("[webhook] Payments payload after normalize:", JSON.stringify(data));
        const parsed = PaymentSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        const existingPayment = await db.query.payments.findFirst({
          where: eq(payments.paymentId, d["Payment ID"]),
        });

        let memberId = existingPayment?.memberId || null;

        if (!memberId && data["Member Name"]) {
          // Find matching member name in personalInfo table
          const allMembers = await db.select().from(personalInfo);
          const matched = allMembers.find(
            (m: any) => m.name.toLowerCase().trim() === data["Member Name"].toLowerCase().trim()
          );
          if (matched) {
            memberId = matched.userId;
          }
        }

        if (!memberId) {
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: `Cannot find or match member ID for payment ${d["Payment ID"]}`, payload: data });
          return NextResponse.json({ error: "Member not found" }, { status: 400 });
        }

        if (!existingPayment) {
          // Insert new payment
          await db.insert(payments).values({
            paymentId: d["Payment ID"],
            memberId,
            amountReceived: d["Amount"].toString(),
            paymentDate: d["Date"],
            forMonth: d["For Month"],
            amountForMonth: d["Amount"].toString(),
            note: d["Note"] ?? "",
            voided: d["Voided"],
            sheetsRowIndex: row,
            syncStatus: "synced",
            createdBy: "system_sheet_sync",
          });
        } else {
          // Update existing payment
          await db.update(payments).set({
            amountReceived: d["Amount"].toString(),
            paymentDate: d["Date"],
            forMonth: d["For Month"],
            amountForMonth: d["Amount"].toString(),
            note: d["Note"] ?? "",
            voided: d["Voided"],
            sheetsRowIndex: row,
            syncStatus: "synced",
          }).where(eq(payments.paymentId, d["Payment ID"]));
        }

        // Keep deposit_allocations in sync (1:1 mirror)
        await db.delete(depositAllocations).where(eq(depositAllocations.paymentId, d["Payment ID"]));
        const allocId = `alloc_sheet_${Date.now()}`;
        await db.insert(depositAllocations).values({
          allocId,
          paymentId: d["Payment ID"],
          memberId,
          forMonth: d["For Month"],
          amountAllocated: d["Amount"].toString(),
        });
        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Payment ID"], status: "success", payload: data });
        break;
      }

      case "Expenses": {
        // If data was cleared via backspace, Entry ID will be empty.
        if (data && (!data["Entry ID"] || data["Entry ID"].trim() === "")) {
          await db.update(expenses).set({ deleted: true }).where(eq(expenses.sheetsRowIndex, row));
          await log({ direction, sheetName: sheet, rowIndex: row, status: "success", payload: data });
          revalidatePath("/dashboard");
          revalidatePath("/expenses");
          return NextResponse.json({ success: true, message: "Row cleared via backspace" });
        }

        if (data["Date"]) data["Date"] = normalizeDate(data["Date"], "date");
        const parsed = ExpenseSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        const existing = await db.query.expenses.findFirst({
          where: eq(expenses.entryId, d["Entry ID"]),
        });

        if (!existing) {
          await db.insert(expenses).values({
            entryId: d["Entry ID"],
            expenseDate: d["Date"],
            category: d["Category"],
            description: d["Description"],
            amount: d["Amount"].toString(),
            linkedInvestmentId: d["Linked Inv"] || null,
            voided: d["Voided"],
            sheetsRowIndex: row,
            syncStatus: "synced",
            recordedBy: "system_sheet_sync",
          });
        } else {
          await db.update(expenses).set({
            expenseDate: d["Date"],
            category: d["Category"],
            description: d["Description"],
            amount: d["Amount"].toString(),
            linkedInvestmentId: d["Linked Inv"] || null,
            voided: d["Voided"],
            sheetsRowIndex: row,
            syncStatus: "synced",
          }).where(eq(expenses.entryId, d["Entry ID"]));
        }

        // Verify against all active entries in the Google Sheet for Expenses to detect any removed or cleared rows
        try {
          const sheetRows = await readSheet("Expenses");
          const validEntryIds = new Set(sheetRows.map((r) => r["Entry ID"]).filter(Boolean));
          const dbExpenses = await db.select().from(expenses);
          for (const e of dbExpenses) {
            const sheetRow = e.sheetsRowIndex ? sheetRows[e.sheetsRowIndex - 2] : null;
            const rowIsCleared = sheetRow && (!sheetRow["Entry ID"] || sheetRow["Entry ID"].trim() === "");

            if ((!validEntryIds.has(e.entryId) || rowIsCleared) && !e.deleted) {
              await db.update(expenses).set({ deleted: true }).where(eq(expenses.id, e.id));
            }
          }
        } catch (err: any) {
          console.error("Failed to sync removed expenses", err);
        }

        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Entry ID"], status: "success", payload: data });
        break;
      }

      case "Investments": {
        // If data was cleared via backspace, Entry ID will be empty.
        if (data && (!data["Entry ID"] || data["Entry ID"].trim() === "")) {
          const toDelete = await db.select().from(investments).where(eq(investments.sheetsRowIndex, row));
          for (const inv of toDelete) {
            await db.update(investments).set({ deleted: true }).where(eq(investments.id, inv.id));
            await db.delete(investmentShares).where(eq(investmentShares.investmentId, inv.entryId));
            await db.update(expenses).set({ linkedInvestmentId: null }).where(eq(expenses.linkedInvestmentId, inv.entryId));
            await db.update(revenueLosses).set({ linkedInvestmentId: null }).where(eq(revenueLosses.linkedInvestmentId, inv.entryId));
          }
          await log({ direction, sheetName: sheet, rowIndex: row, status: "success", payload: data });
          revalidatePath("/dashboard");
          revalidatePath("/investments");
          return NextResponse.json({ success: true, message: "Investment row cleared via backspace" });
        }

        if (data["Date"]) data["Date"] = normalizeDate(data["Date"], "date");
        if (data["Exp Return"]) data["Exp Return"] = normalizeDate(data["Exp Return"], "date");
        if (data["Act Return"]) data["Act Return"] = normalizeDate(data["Act Return"], "date");
        const parsed = InvestmentSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        const existing = await db.query.investments.findFirst({
          where: eq(investments.entryId, d["Entry ID"]),
        });

        if (!existing) {
          await db.insert(investments).values({
            entryId: d["Entry ID"],
            investDate: d["Date"],
            recipient: d["Recipient"],
            principal: d["Principal"].toString(),
            expectedReturnDate: d["Exp Return"],
            actualReturnDate: d["Act Return"] || null,
            status: d["Status"],
            note: d["Note"] ?? "",
            sheetsRowIndex: row,
            syncStatus: "synced",
            recordedBy: "system_sheet_sync",
          });
        } else {
          await db.update(investments).set({
            investDate: d["Date"],
            recipient: d["Recipient"],
            principal: d["Principal"].toString(),
            expectedReturnDate: d["Exp Return"],
            actualReturnDate: d["Act Return"] || null,
            status: d["Status"],
            note: d["Note"] ?? "",
            sheetsRowIndex: row,
            syncStatus: "synced",
          }).where(eq(investments.entryId, d["Entry ID"]));
        }

        // Verify against all active entries in the Google Sheet for Investments to detect any removed or cleared rows
        try {
          const sheetRows = await readSheet("Investments");
          const validEntryIds = new Set(sheetRows.map((r) => r["Entry ID"]).filter(Boolean));
          const dbInvestments = await db.select().from(investments);
          for (const i of dbInvestments) {
            const sheetRow = i.sheetsRowIndex ? sheetRows[i.sheetsRowIndex - 2] : null;
            const rowIsCleared = sheetRow && (!sheetRow["Entry ID"] || sheetRow["Entry ID"].trim() === "");

            if ((!validEntryIds.has(i.entryId) || rowIsCleared) && !i.deleted) {
              await db.update(investments).set({ deleted: true }).where(eq(investments.id, i.id));
              await db.delete(investmentShares).where(eq(investmentShares.investmentId, i.entryId));
              await db.update(expenses).set({ linkedInvestmentId: null }).where(eq(expenses.linkedInvestmentId, i.entryId));
              await db.update(revenueLosses).set({ linkedInvestmentId: null }).where(eq(revenueLosses.linkedInvestmentId, i.entryId));
            }
          }
        } catch (err: any) {
          console.error("Failed to sync removed investments", err);
        }

        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Entry ID"], status: "success", payload: data });
        break;
      }

      case "Revenue_Losses": {
        // If data was cleared via backspace, Entry ID will be empty.
        if (data && (!data["Entry ID"] || data["Entry ID"].trim() === "")) {
          const toDelete = await db.select().from(revenueLosses).where(eq(revenueLosses.sheetsRowIndex, row));
          for (const rev of toDelete) {
            await db.update(revenueLosses).set({ deleted: true }).where(eq(revenueLosses.id, rev.id));
          }
          await log({ direction, sheetName: sheet, rowIndex: row, status: "success", payload: data });
          revalidatePath("/dashboard");
          revalidatePath("/revenue");
          return NextResponse.json({ success: true, message: "Revenue row cleared via backspace" });
        }

        if (data["Date"]) data["Date"] = normalizeDate(data["Date"], "date");
        const parsed = RevenueLossSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        const existing = await db.query.revenueLosses.findFirst({
          where: eq(revenueLosses.entryId, d["Entry ID"]),
        });

        if (!existing) {
          await db.insert(revenueLosses).values({
            entryId: d["Entry ID"],
            eventDate: d["Date"],
            sourceType: d["Source Type"],
            description: d["Description"],
            amount: d["Amount"].toString(),
            linkedInvestmentId: d["Linked Inv"] || null,
            voided: d["Voided"] === true || d["Voided"] === "TRUE",
            sheetsRowIndex: row,
            syncStatus: "synced",
            recordedBy: "system_sheet_sync",
          });
        } else {
          await db.update(revenueLosses).set({
            eventDate: d["Date"],
            sourceType: d["Source Type"],
            description: d["Description"],
            amount: d["Amount"].toString(),
            linkedInvestmentId: d["Linked Inv"] || null,
            voided: d["Voided"] === true || d["Voided"] === "TRUE",
            sheetsRowIndex: row,
            syncStatus: "synced",
          }).where(eq(revenueLosses.entryId, d["Entry ID"]));
        }

        // Scan the whole sheet to detect any removed or cleared rows
        try {
          const sheetRows = await readSheet("Revenue_Losses");
          const validEntryIds = new Set(sheetRows.map((r) => r["Entry ID"]).filter(Boolean));
          const dbRevenue = await db.select().from(revenueLosses);
          for (const r of dbRevenue) {
            const sheetRow = r.sheetsRowIndex ? sheetRows[r.sheetsRowIndex - 2] : null;
            const rowIsCleared = sheetRow && (!sheetRow["Entry ID"] || sheetRow["Entry ID"].trim() === "");

            if ((!validEntryIds.has(r.entryId) || rowIsCleared) && !r.deleted) {
              await db.update(revenueLosses).set({ deleted: true }).where(eq(revenueLosses.id, r.id));
            }
          }
        } catch (err: any) {
          console.error("Failed to sync removed revenue entries", err);
        }

        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Entry ID"], status: "success", payload: data });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown sheet: ${sheet}` }, { status: 400 });
    }

    revalidatePath("/dashboard");
    revalidatePath("/deposits");
    revalidatePath("/expenses");
    revalidatePath("/investments");
    revalidatePath("/revenue");

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Webhook processing error:", e);
    await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: e.message, payload: data });
    return NextResponse.json({ error: "Internal server error", details: e.message }, { status: 500 });
  }
}
