import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, expenses, investments, revenueLosses } from "@/db/schema";
import { readSheet, SheetName } from "@/lib/sheets";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sheet, row } = body;

    if (!sheet || !row) {
      return NextResponse.json({ error: "Bad Request: missing sheet or row" }, { status: 400 });
    }

    const rows = await readSheet(sheet as SheetName);
    
    // row from Apps Script is 1-based.
    // readSheet returns data rows only (row 2 is index 0).
    const dataRow = rows[row - 2];
    
    if (!dataRow) {
      return NextResponse.json({ error: "Row not found in sheet data" }, { status: 404 });
    }

    switch (sheet) {
      case "Payments": {
        // Assume headers map to exactly these or similar based on our append logic:
        // [paymentId, memberId, amountReceived, paymentDate, note, voided]
        const pId = Object.values(dataRow)[0];
        const amount = Object.values(dataRow)[2];
        const date = Object.values(dataRow)[3];
        const note = Object.values(dataRow)[4];
        const voided = Object.values(dataRow)[5];

        if (pId) {
          await db.update(payments).set({
            amountReceived: amount,
            paymentDate: date,
            note: note,
            voided: String(voided).toUpperCase() === "TRUE"
          }).where(eq(payments.paymentId, pId));
        }
        break;
      }
      case "Expenses": {
        // [entryId, expenseDate, category, description, amount, linkedInvestmentId, voided]
        const eId = Object.values(dataRow)[0];
        if (eId) {
          await db.update(expenses).set({
            expenseDate: Object.values(dataRow)[1],
            category: Object.values(dataRow)[2],
            description: Object.values(dataRow)[3],
            amount: Object.values(dataRow)[4],
            linkedInvestmentId: Object.values(dataRow)[5] || null,
            voided: String(Object.values(dataRow)[6]).toUpperCase() === "TRUE"
          }).where(eq(expenses.entryId, eId));
        }
        break;
      }
      case "Investments": {
        // [entryId, investDate, recipient, principal, expectedReturnDate, actualReturnDate, status, note]
        const iId = Object.values(dataRow)[0];
        if (iId) {
          await db.update(investments).set({
            investDate: Object.values(dataRow)[1],
            recipient: Object.values(dataRow)[2],
            principal: Object.values(dataRow)[3],
            expectedReturnDate: Object.values(dataRow)[4],
            actualReturnDate: Object.values(dataRow)[5] || null,
            status: Object.values(dataRow)[6],
            note: Object.values(dataRow)[7]
          }).where(eq(investments.entryId, iId));
        }
        break;
      }
      case "Revenue_Losses": {
        // [entryId, eventDate, sourceType, description, amount, linkedInvestmentId, voided]
        const rId = Object.values(dataRow)[0];
        if (rId) {
          await db.update(revenueLosses).set({
            eventDate: Object.values(dataRow)[1],
            sourceType: Object.values(dataRow)[2],
            description: Object.values(dataRow)[3],
            amount: Object.values(dataRow)[4],
            linkedInvestmentId: Object.values(dataRow)[5] || null,
            voided: String(Object.values(dataRow)[6]).toUpperCase() === "TRUE"
          }).where(eq(revenueLosses.entryId, rId));
        }
        break;
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/deposits");
    revalidatePath("/expenses");
    revalidatePath("/investments");
    revalidatePath("/revenue");
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
