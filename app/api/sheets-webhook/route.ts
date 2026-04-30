import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, expenses, investments, revenueLosses, syncLogs, depositAllocations } from "@/db/schema";
import { readSheet, SheetName } from "@/lib/sheets";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

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
        const parsed = PaymentSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        // Look up existing payment to get member_id (not in sheet anymore)
        const existingPayment = await db.query.payments.findFirst({
          where: eq(payments.paymentId, d["Payment ID"]),
        });
        if (!existingPayment) {
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: `Payment ${d["Payment ID"]} not found in DB`, payload: data });
          return NextResponse.json({ error: `Payment ${d["Payment ID"]} not found` }, { status: 404 });
        }
        await db.update(payments).set({
          amountReceived: d["Amount"].toString(),
          paymentDate: d["Date"],
          forMonth: d["For Month"],
          amountForMonth: d["Amount"].toString(),
          note: d["Note"] ?? "",
          voided: d["Voided"],
          syncStatus: "synced",
        }).where(eq(payments.paymentId, d["Payment ID"]));
        // Keep deposit_allocations in sync (1:1 mirror) using member_id from DB record
        await db.delete(depositAllocations).where(eq(depositAllocations.paymentId, d["Payment ID"]));
        const allocId = `alloc_sheet_${Date.now()}`;
        await db.insert(depositAllocations).values({
          allocId,
          paymentId: d["Payment ID"],
          memberId: existingPayment.memberId,   // from DB — not from sheet
          forMonth: d["For Month"],
          amountAllocated: d["Amount"].toString(),
        });
        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Payment ID"], status: "success", payload: data });
        break;
      }

      case "Expenses": {
        const parsed = ExpenseSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        await db.update(expenses).set({
          expenseDate: d["Date"],
          category: d["Category"],
          description: d["Description"],
          amount: d["Amount"].toString(),
          linkedInvestmentId: d["Linked Inv"] || null,
          voided: d["Voided"],
          syncStatus: "synced",
        }).where(eq(expenses.entryId, d["Entry ID"]));
        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Entry ID"], status: "success", payload: data });
        break;
      }

      case "Investments": {
        const parsed = InvestmentSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        await db.update(investments).set({
          investDate: d["Date"],
          recipient: d["Recipient"],
          principal: d["Principal"].toString(),
          expectedReturnDate: d["Exp Return"],
          actualReturnDate: d["Act Return"] || null,
          status: d["Status"],
          note: d["Note"] ?? "",
          syncStatus: "synced",
        }).where(eq(investments.entryId, d["Entry ID"]));
        await log({ direction, sheetName: sheet, rowIndex: row, entryId: d["Entry ID"], status: "success", payload: data });
        break;
      }

      case "Revenue_Losses": {
        const parsed = RevenueLossSchema.safeParse(data);
        if (!parsed.success) {
          const msg = parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ");
          await log({ direction, sheetName: sheet, rowIndex: row, status: "error", errorMessage: msg, payload: data });
          return NextResponse.json({ error: "Validation failed", details: msg }, { status: 422 });
        }
        const d = parsed.data;
        await db.update(revenueLosses).set({
          eventDate: d["Date"],
          sourceType: d["Source Type"],
          description: d["Description"],
          amount: d["Amount"].toString(),
          linkedInvestmentId: d["Linked Inv"] || null,
          voided: d["Voided"],
          syncStatus: "synced",
        }).where(eq(revenueLosses.entryId, d["Entry ID"]));
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
