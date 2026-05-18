"use server";

import { db } from "@/db/client";
import { payments, depositAllocations, logs, personalInfo, pendingNotifications } from "@/db/schema";
import { generatePaymentId, generateAllocId } from "@/lib/id-generator";
import { appendRow, updateRow, markVoided } from "@/lib/sheets";
import { requireManager } from "@/lib/auth";
import { z } from "zod";
import { CreateDepositSchema } from "../validators/deposit";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getManagerDashboardStats } from "@/lib/queries/dashboard";
import { notifyDepositConfirmed } from "@/lib/notifications/service";

// ─── helpers ─────────────────────────────────────────────────────────────────

function toSheetRow(
  paymentId: string,
  memberName: string,
  amount: number | string,
  date: string,
  forMonth: string,
  note: string,
  voided: boolean
) {
  return [paymentId, memberName, amount, date, forMonth, note, voided ? "TRUE" : "FALSE", "synced"];
}

async function getMemberName(memberId: string): Promise<string> {
  const member = await db.query.personalInfo.findFirst({
    where: eq(personalInfo.userId, memberId),
  });
  return member?.name || memberId;
}


// ─── createPayment ────────────────────────────────────────────────────────────

export async function createPayment(data: z.infer<typeof CreateDepositSchema>) {
  const user = await requireManager();
  const parsed = CreateDepositSchema.parse(data);

  const paymentId = await generatePaymentId();
  const allocId = await generateAllocId();

    // One payment row — manager explicitly chose forMonth and amount
    await db.insert(payments).values({
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
    await db.insert(depositAllocations).values({
      allocId,
      paymentId,
      memberId: parsed.memberId,
      forMonth: parsed.forMonth,
      amountAllocated: parsed.amountReceived.toString(),
    });

    await db.insert(logs).values({
      userId: user.id,
      action: "CREATE_PAYMENT",
      details: JSON.stringify({
        paymentId,
        memberId: parsed.memberId,
        amountReceived: parsed.amountReceived,
        forMonth: parsed.forMonth,
      }),
    });

  // Sync to Google Sheets (single Payments tab — no separate Allocations tab)
  try {
    const memberName = await getMemberName(parsed.memberId);
    const pRow = toSheetRow(
      paymentId,
      memberName,
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

    // After success, send notifications asynchronously without blocking the user
    getManagerDashboardStats().then((stats) => {
      const memberPending = stats.memberPendings.find(m => m.memberId === parsed.memberId);
      // Wait, getManagerDashboardStats returns memberPendings which calculates total expected vs paid.
      // But we just need their total balance which is total payments.
      // Let's just do a quick calculation of the member's paid amount here instead of the whole dashboard stats.
      // Actually, I can compute memberBalance by summing their depositAllocations.
    }).catch(console.error);

  } catch (e) {
    console.error("Failed to sync to sheets", e);
    await db
      .update(payments)
      .set({ syncStatus: "pending" })
      .where(eq(payments.paymentId, paymentId));
  }

  // Quick balance calculation for the notification
  try {
    const memberName = await getMemberName(parsed.memberId);
    
    // Member balance = sum of all their depositAllocations
    const allMemberAllocs = await db.select().from(depositAllocations).where(eq(depositAllocations.memberId, parsed.memberId));
    const memberBalance = allMemberAllocs.reduce((sum, a) => sum + Number(a.amountAllocated), 0);

    // Total fund balance = simple sum of all valid payments - valid expenses - active investments + net revenue
    // But maybe it's simpler to just use getManagerDashboardStats() for fund balance
    const stats = await getManagerDashboardStats();
    await notifyDepositConfirmed(parsed.memberId, {
      paymentId,
      memberName,
      amount: parsed.amountReceived,
      forMonth: parsed.forMonth,
      paymentDate: parsed.paymentDate,
      memberBalance,
      totalFundBalance: stats.balance,
    });
  } catch (e) {
    console.error("Failed to trigger deposit notification", e);
  }

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  revalidateTag("dashboard-stats");
  revalidateTag("dashboard-stats");
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

  // Fetch baseline stats BEFORE the operation
  const stats = await getManagerDashboardStats();
  let runningFundBalance = stats.balance;
  
  // Map to track running balance for each member in this batch
  const memberRunningBalances = new Map<string, number>();

  // To store data for sheet sync after transaction
  const syncData: Array<{
    paymentId: string;
    memberId: string;
    amountReceived: number;
    paymentDate: string;
    forMonth: string;
    note?: string;
  }> = [];

  try {
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

      // Get current balance of the member if not in map
      if (!memberRunningBalances.has(parsed.memberId)) {
        const existingAllocs = await db.select().from(depositAllocations).where(eq(depositAllocations.memberId, parsed.memberId));
        const currentBal = existingAllocs.reduce((sum, a) => sum + Number(a.amountAllocated), 0);
        memberRunningBalances.set(parsed.memberId, currentBal);
      }

      const prevMemberBal = memberRunningBalances.get(parsed.memberId)!;
      const newMemberBal = prevMemberBal + parsed.amountReceived;
      runningFundBalance += parsed.amountReceived;
      
      // Update the map for next iteration
      memberRunningBalances.set(parsed.memberId, newMemberBal);

      await db.insert(payments).values({
        paymentId,
        memberId: parsed.memberId,
        amountReceived: parsed.amountReceived.toString(),
        paymentDate: parsed.paymentDate,
        forMonth: parsed.forMonth,
        amountForMonth: parsed.amountReceived.toString(),
        note: parsed.note || "",
        createdBy: user.id,
        syncStatus: "pending",
      });

      await db.insert(depositAllocations).values({
        allocId,
        paymentId,
        memberId: parsed.memberId,
        forMonth: parsed.forMonth,
        amountAllocated: parsed.amountReceived.toString(),
      });

      await db.insert(logs).values({
        userId: user.id,
        action: "CREATE_PAYMENT",
        details: JSON.stringify({ paymentId, memberId: parsed.memberId, forMonth: parsed.forMonth }),
      });

      const memberName = await getMemberName(parsed.memberId);
      
      // Queue notification (using 3 minutes delay)
      const scheduledFor = new Date(Date.now() + 3 * 60 * 1000); 
      
      await db.insert(pendingNotifications).values({
        userId: parsed.memberId,
        paymentId,
        type: "deposit",
        payload: {
          paymentId,
          memberName,
          amount: parsed.amountReceived,
          forMonth: parsed.forMonth,
          paymentDate: parsed.paymentDate,
          memberBalance: newMemberBal,
          totalFundBalance: runningFundBalance,
          recordedAt: new Date().toISOString(),
        },
        scheduledFor,
        status: "pending",
      });

      results.push(paymentId);
      syncData.push({
        paymentId,
        memberId: parsed.memberId,
        amountReceived: parsed.amountReceived,
        paymentDate: parsed.paymentDate,
        forMonth: parsed.forMonth,
        note: parsed.note,
      });
    }

    // 2. Sync to Google Sheets AFTER transaction succeeds (so we don't hold locks)
    for (const data of syncData) {
      try {
        const memberName = await getMemberName(data.memberId);
        const pRow = toSheetRow(
          data.paymentId,
          memberName,
          data.amountReceived,
          data.paymentDate,
          data.forMonth,
          data.note || "",
          false
        );
        const rowIndex = await appendRow("Payments", pRow);
        await db
          .update(payments)
          .set({ sheetsRowIndex: rowIndex, syncStatus: "synced" })
          .where(eq(payments.paymentId, data.paymentId));
      } catch (e) {
        console.error("Failed to sync to sheets for payment", data.paymentId, e);
        // It stays as 'pending' in DB, which is correct
      }
    }

  } catch (e: any) {
    console.error("Batch payment failed:", e);
    throw new Error(e.message || "Failed to process batch payments");
  }

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
  revalidateTag("dashboard-stats");
  revalidateTag("dashboard-stats");
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

    await db
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

    await db.insert(depositAllocations).values({
      allocId,
      paymentId,
      memberId: parsed.memberId,
      forMonth: parsed.forMonth,
      amountAllocated: parsed.amountReceived.toString(),
    });

    await db.insert(logs).values({
      userId: user.id,
      action: "UPDATE_PAYMENT",
      details: JSON.stringify({ paymentId, before: existing, after: parsed }),
    });

  if (existing.sheetsRowIndex) {
    try {
      const memberName = await getMemberName(parsed.memberId);
      const pRow = toSheetRow(
        paymentId,
        memberName,
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
  revalidateTag("dashboard-stats");
  revalidateTag("dashboard-stats");
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
  revalidateTag("dashboard-stats");
  return { success: true };
}

// ─── previewAllocation (kept for outstanding display only — no longer used for recording) ───

export async function previewAllocation(memberId: string, amount: number, paymentDate: string) {
  await requireManager();
  // This is no longer used for actual recording — just kept for any future reference.
  // Outstanding months are calculated via getMemberOutstandingMonths in outstanding.ts
  return [];
}
