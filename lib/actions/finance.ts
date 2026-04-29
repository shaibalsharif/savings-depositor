"use server";

import { db } from "@/db/client";
import { expenses, investments, revenueLosses, logs } from "@/db/schema";
import { generateExpenseId, generateInvestmentId, generateRevenueId } from "@/lib/id-generator";
import { appendRow, updateRow, markVoided } from "@/lib/sheets";
import { requireManager } from "@/lib/auth";
import { ExpenseSchema, InvestmentSchema, RevenueLossSchema } from "../validators/finance";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { calculateAndSaveShares } from "@/lib/queries/investment";

export async function createExpense(data: any) {
  const user = await requireManager();
  const parsed = ExpenseSchema.parse(data);
  const entryId = await generateExpenseId();

  await db.transaction(async (tx) => {
    await tx.insert(expenses).values({
      entryId,
      expenseDate: parsed.expenseDate,
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount.toString(),
      linkedInvestmentId: parsed.linkedInvestmentId || null,
      recordedBy: user.id,
    });
    await tx.insert(logs).values({
      userId: user.id,
      action: "CREATE_EXPENSE",
      details: JSON.stringify({ entryId, amount: parsed.amount }),
    });
  });

  try {
    const row = [entryId, parsed.expenseDate, parsed.category, parsed.description, parsed.amount, parsed.linkedInvestmentId || "", "FALSE"];
    const rowIndex = await appendRow("Expenses", row);
    await db.update(expenses).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(expenses.entryId, entryId));
  } catch (e) {
    console.error("Failed to sync expense to sheets", e);
    await db.update(expenses).set({ syncStatus: "pending" }).where(eq(expenses.entryId, entryId));
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, entryId };
}

export async function createInvestment(data: any) {
  const user = await requireManager();
  const parsed = InvestmentSchema.parse(data);
  const entryId = await generateInvestmentId();

  await db.transaction(async (tx) => {
    await tx.insert(investments).values({
      entryId,
      investDate: parsed.investDate,
      recipient: parsed.recipient,
      principal: parsed.principal.toString(),
      expectedReturnDate: parsed.expectedReturnDate,
      note: parsed.note || "",
      recordedBy: user.id,
    });
    await tx.insert(logs).values({
      userId: user.id,
      action: "CREATE_INVESTMENT",
      details: JSON.stringify({ entryId, principal: parsed.principal }),
    });
  });

  // Snapshot each member's proportional stake at this investment's date
  try {
    await calculateAndSaveShares(entryId, parsed.investDate);
  } catch (e) {
    console.error("Failed to calculate investment shares", e);
  }

  try {
    const row = [entryId, parsed.investDate, parsed.recipient, parsed.principal, parsed.expectedReturnDate, "", "active", parsed.note || ""];
    const rowIndex = await appendRow("Investments", row);
    await db.update(investments).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(investments.entryId, entryId));
  } catch (e) {
    console.error("Failed to sync investment to sheets", e);
    await db.update(investments).set({ syncStatus: "pending" }).where(eq(investments.entryId, entryId));
  }

  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return { success: true, entryId };
}

export async function markInvestmentMatured(entryId: string, actualReturnDate: string) {
  const user = await requireManager();
  
  const existing = await db.query.investments.findFirst({ where: eq(investments.entryId, entryId) });
  if (!existing) throw new Error("Not found");

  await db.update(investments).set({
    status: "matured",
    actualReturnDate,
  }).where(eq(investments.entryId, entryId));

  await db.insert(logs).values({
    userId: user.id,
    action: "MATURE_INVESTMENT",
    details: JSON.stringify({ entryId, actualReturnDate }),
  });

  if (existing.sheetsRowIndex) {
    try {
      const row = [entryId, existing.investDate, existing.recipient, existing.principal, existing.expectedReturnDate, actualReturnDate, "matured", existing.note || ""];
      await updateRow("Investments", existing.sheetsRowIndex, row);
    } catch (e) {
      console.error(e);
    }
  }

  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createRevenue(data: any) {
  const user = await requireManager();
  const parsed = RevenueLossSchema.parse(data);
  const entryId = await generateRevenueId();

  await db.transaction(async (tx) => {
    await tx.insert(revenueLosses).values({
      entryId,
      eventDate: parsed.eventDate,
      sourceType: parsed.sourceType,
      description: parsed.description,
      amount: parsed.amount.toString(),
      linkedInvestmentId: parsed.linkedInvestmentId || null,
      recordedBy: user.id,
    });
    await tx.insert(logs).values({
      userId: user.id,
      action: "CREATE_REVENUE",
      details: JSON.stringify({ entryId, amount: parsed.amount }),
    });
  });

  // If this is a principal_return, mark the linked investment as matured
  if (parsed.sourceType === "principal_return" && parsed.linkedInvestmentId) {
    try {
      await db.update(investments)
        .set({ status: "matured", actualReturnDate: parsed.eventDate })
        .where(eq(investments.entryId, parsed.linkedInvestmentId));
    } catch (e) {
      console.error("Failed to auto-mature investment on principal_return", e);
    }
  }

  try {
    const row = [entryId, parsed.eventDate, parsed.sourceType, parsed.description, parsed.amount, parsed.linkedInvestmentId || "", "FALSE"];
    const rowIndex = await appendRow("Revenue_Losses", row);
    await db.update(revenueLosses).set({ sheetsRowIndex: rowIndex, syncStatus: "synced" }).where(eq(revenueLosses.entryId, entryId));
  } catch (e) {
    console.error("Failed to sync revenue to sheets", e);
    await db.update(revenueLosses).set({ syncStatus: "pending" }).where(eq(revenueLosses.entryId, entryId));
  }

  revalidatePath("/revenue");
  revalidatePath("/dashboard");
  return { success: true, entryId };
}
