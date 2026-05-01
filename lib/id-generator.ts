import { db } from "@/db/client";
import { payments, depositAllocations, expenses, investments, revenueLosses } from "@/db/schema";

async function generateId(table: any, column: any, prefix: string): Promise<string> {
  const records = await db.select({ id: column }).from(table);
  let nextNum = 1;

  const validNums = records
    .map((r: any) => r.id)
    .filter((id) => id && id.startsWith(`${prefix}-`))
    .map((id) => {
      const parts = id.split("-");
      return parts.length === 2 ? parseInt(parts[1], 10) : 0;
    })
    .filter((num) => !isNaN(num) && num > 0);

  if (validNums.length > 0) {
    nextNum = Math.max(...validNums) + 1;
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
