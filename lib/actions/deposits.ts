"use server";

import { db } from "@/db/client";
import { payments, depositAllocations, logs } from "@/db/schema";
import { generatePaymentId, generateAllocId } from "@/lib/id-generator";
import { appendRow, updateRow, markVoided } from "@/lib/sheets";
import { requireManager } from "@/lib/auth";
import { z } from "zod";
import { CreateDepositSchema } from "../validators/deposit";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the Payments sheet row array.
 * Columns must match the header in the Google Sheet exactly:
 * Payment ID | Member ID | Amount | Date | For Month | Note | Voided | Sync Status
 */
function toSheetRow(
  paymentId: string,
  memberId: string,
  amount: number | string,
  date: string,
  forMonth: string,
  note: string,
  voided: boolean
) {
  return [paymentId, memberId, amount, date, forMonth, note, voided ? "TRUE" : "FALSE", "synced"];
}

// ─── createPayment ────────────────────────────────────────────────────────────

export async function createPayment(data: z.infer<typeof CreateDepositSchema>) {
  const user = await requireManager();
  const parsed = CreateDepositSchema.parse(data);

  const paymentId = await generatePaymentId();
  const allocId = await generateAllocId();

  await db.transaction(async (tx) => {
    // One payment row — manager explicitly chose forMonth and amount
    await tx.insert(payments).values({
      paymentId,
      memberId: parsed.memberId,
      amountReceived: parsed.amountReceived.toString(),
      paymentDate: parsed.paymentDate,
      forMonth: parsed.forMonth,
      amountForMonth: parsed.amountReceived.toString(),
      note: parsed.note || "",
      createdBy: user.id,
    });

    // One allocation row — derived 1:1 from payment, never auto-FIFO
    await tx.insert(depositAllocations).values({
      allocId,
      paymentId,
      memberId: parsed.memberId,
      forMonth: parsed.forMonth,
      amountAllocated: parsed.amountReceived.toString(),
    });

    await tx.insert(logs).values({
      userId: user.id,
      action: "CREATE_PAYMENT",
      details: JSON.stringify({
        paymentId,
        memberId: parsed.memberId,
        amountReceived: parsed.amountReceived,
        forMonth: parsed.forMonth,
      }),
    });
  });

  // Sync to Google Sheets (single Payments tab — no separate Allocations tab)
  try {
    const pRow = toSheetRow(
      paymentId,
      parsed.memberId,
      parsed.amountReceived,
      parsed.paymentDate,
      parsed.forMonth,
      parsed.note || "",
      false
    );
    const rowIndex = await appendRow("Payments", pRow);
    await db
      .update(payments)
      .set({ sheetsRowIndex: rowIndex, syncStatus: "synced" })
      .where(eq(payments.paymentId, paymentId));
  } catch (e) {
    console.error("Failed to sync to sheets", e);
    await db
      .update(payments)
      .set({ syncStatus: "pending" })
      .where(eq(payments.paymentId, paymentId));
  }

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  return { success: true, paymentId };
}

// ─── createBatchPayments ──────────────────────────────────────────────────────

export async function createBatchPayments(
  records: Array<{
    memberId: string;
    amountReceived: number;
    paymentDate: string;
    forMonth: string;
    note?: string;
  }>
) {
  const user = await requireManager();
  const results: string[] = [];

  for (const record of records) {
    const parsed = CreateDepositSchema.parse({
      memberId: record.memberId,
      amountReceived: record.amountReceived,
      paymentDate: record.paymentDate,
      forMonth: record.forMonth,
      note: record.note,
    });

    const paymentId = await generatePaymentId();
    const allocId = await generateAllocId();

    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        paymentId,
        memberId: parsed.memberId,
        amountReceived: parsed.amountReceived.toString(),
        paymentDate: parsed.paymentDate,
        forMonth: parsed.forMonth,
        amountForMonth: parsed.amountReceived.toString(),
        note: parsed.note || "",
        createdBy: user.id,
      });

      await tx.insert(depositAllocations).values({
        allocId,
        paymentId,
        memberId: parsed.memberId,
        forMonth: parsed.forMonth,
        amountAllocated: parsed.amountReceived.toString(),
      });

      await tx.insert(logs).values({
        userId: user.id,
        action: "CREATE_PAYMENT",
        details: JSON.stringify({ paymentId, memberId: parsed.memberId, forMonth: parsed.forMonth }),
      });
    });

    try {
      const pRow = toSheetRow(
        paymentId,
        parsed.memberId,
        parsed.amountReceived,
        parsed.paymentDate,
        parsed.forMonth,
        parsed.note || "",
        false
      );
      const rowIndex = await appendRow("Payments", pRow);
      await db
        .update(payments)
        .set({ sheetsRowIndex: rowIndex, syncStatus: "synced" })
        .where(eq(payments.paymentId, paymentId));
    } catch (e) {
      console.error("Failed to sync to sheets", e);
      await db
        .update(payments)
        .set({ syncStatus: "pending" })
        .where(eq(payments.paymentId, paymentId));
    }

    results.push(paymentId);
  }

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  return { success: true, paymentIds: results };
}

// ─── updatePayment ────────────────────────────────────────────────────────────

export async function updatePayment(
  paymentId: string,
  data: z.infer<typeof CreateDepositSchema>
) {
  const user = await requireManager();
  const parsed = CreateDepositSchema.parse(data);

  const existing = await db.query.payments.findFirst({
    where: eq(payments.paymentId, paymentId),
  });
  if (!existing) throw new Error("Payment not found");

  // Delete old allocation, insert fresh one for the new forMonth
  await db
    .delete(depositAllocations)
    .where(eq(depositAllocations.paymentId, paymentId));

  const allocId = await generateAllocId();

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        memberId: parsed.memberId,
        amountReceived: parsed.amountReceived.toString(),
        paymentDate: parsed.paymentDate,
        forMonth: parsed.forMonth,
        amountForMonth: parsed.amountReceived.toString(),
        note: parsed.note || "",
        updatedBy: user.id,
      })
      .where(eq(payments.paymentId, paymentId));

    await tx.insert(depositAllocations).values({
      allocId,
      paymentId,
      memberId: parsed.memberId,
      forMonth: parsed.forMonth,
      amountAllocated: parsed.amountReceived.toString(),
    });

    await tx.insert(logs).values({
      userId: user.id,
      action: "UPDATE_PAYMENT",
      details: JSON.stringify({ paymentId, before: existing, after: parsed }),
    });
  });

  if (existing.sheetsRowIndex) {
    try {
      const pRow = toSheetRow(
        paymentId,
        parsed.memberId,
        parsed.amountReceived,
        parsed.paymentDate,
        parsed.forMonth,
        parsed.note || "",
        false
      );
      await updateRow("Payments", existing.sheetsRowIndex, pRow);
    } catch (e) {
      console.error("Failed to update sheet row", e);
    }
  }

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── voidPayment ──────────────────────────────────────────────────────────────

export async function voidPayment(paymentId: string) {
  const user = await requireManager();

  const payment = await db.query.payments.findFirst({
    where: eq(payments.paymentId, paymentId),
  });
  if (!payment) throw new Error("Not found");

  await db
    .update(payments)
    .set({ voided: true, updatedBy: user.id })
    .where(eq(payments.paymentId, paymentId));
  await db
    .delete(depositAllocations)
    .where(eq(depositAllocations.paymentId, paymentId));

  await db.insert(logs).values({
    userId: user.id,
    action: "VOID_PAYMENT",
    details: JSON.stringify({ paymentId }),
  });

  if (payment.sheetsRowIndex) {
    try {
      await markVoided("Payments", payment.sheetsRowIndex);
    } catch (e) {
      console.error(e);
    }
  }

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── previewAllocation (kept for outstanding display only — no longer used for recording) ───

export async function previewAllocation(memberId: string, amount: number, paymentDate: string) {
  await requireManager();
  // This is no longer used for actual recording — just kept for any future reference.
  // Outstanding months are calculated via getMemberOutstandingMonths in outstanding.ts
  return [];
}
