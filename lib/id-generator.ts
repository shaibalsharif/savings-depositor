import { db } from "@/db/client";
import { payments, depositAllocations, expenses, investments, revenueLosses } from "@/db/schema";
import { sql } from "drizzle-orm";

async function generateId(table: any, column: any, prefix: string): Promise<string> {
  const result = await db
    .select({
      maxId: sql<string>`MAX(${column})`
    })
    .from(table);

  const maxId = result[0]?.maxId;
  let nextNum = 1;

  if (maxId) {
    // Expected format: PREFIX-000001
    const parts = maxId.split("-");
    if (parts.length === 2) {
      const numPart = parseInt(parts[1], 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }
  }

  const paddedNum = nextNum.toString().padStart(6, "0");
  return `${prefix}-${paddedNum}`;
}

export async function generatePaymentId(): Promise<string> {
  return generateId(payments, payments.paymentId, "PAY");
}

export async function generateAllocId(): Promise<string> {
  return generateId(depositAllocations, depositAllocations.allocId, "ALLOC");
}

export async function generateExpenseId(): Promise<string> {
  return generateId(expenses, expenses.entryId, "EXP");
}

export async function generateInvestmentId(): Promise<string> {
  return generateId(investments, investments.entryId, "INV");
}

export async function generateRevenueId(): Promise<string> {
  return generateId(revenueLosses, revenueLosses.entryId, "REV");
}
