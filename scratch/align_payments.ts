import { db } from "../db/client";
import { payments, personalInfo } from "../db/schema";
import { readSheet, appendRow } from "../lib/sheets";
import { eq } from "drizzle-orm";

async function getMemberName(memberId: string): Promise<string> {
  const member = await db.query.personalInfo.findFirst({
    where: eq(personalInfo.userId, memberId),
  });
  return member?.name || memberId;
}

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

async function alignPayments() {
  console.log("Starting payment alignment...");

  // 1. Fetch all payments from DB
  const dbPayments = await db.select().from(payments);
  console.log(`Found ${dbPayments.length} payments in database.`);

  // 2. Fetch all payments from Google Sheets
  let sheetPayments: any[] = [];
  try {
    sheetPayments = await readSheet("Payments");
    console.log(`Found ${sheetPayments.length} rows in 'Payments' sheet.`);
  } catch (error) {
    console.error("Error reading sheet:", error);
    // If sheet is empty or error, we assume 0
  }

  // 3. Map existing payment IDs from sheet (assumes Payment ID is the first column/header "ID" or similar)
  // Actually, readSheet returns objects based on headers. Let's see the headers.
  const sheetPaymentIds = new Set(sheetPayments.map(p => p["Payment ID"] || p["ID"] || p["id"]));
  
  // 4. Identify missing payments
  const missingPayments = dbPayments.filter(p => !sheetPaymentIds.has(p.paymentId));
  console.log(`${missingPayments.length} payments are missing from the sheet.`);

  if (missingPayments.length === 0) {
    console.log("Everything is up to date.");
    return;
  }

  // 5. Append missing payments
  for (const p of missingPayments) {
    console.log(`Syncing ${p.paymentId}...`);
    try {
      const memberName = await getMemberName(p.memberId);
      const row = toSheetRow(
        p.paymentId,
        memberName,
        p.amountReceived,
        p.paymentDate,
        p.forMonth || "",
        p.note || "",
        p.voided
      );

      const rowIndex = await appendRow("Payments", row);
      
      await db.update(payments)
        .set({ sheetsRowIndex: rowIndex, syncStatus: "synced" })
        .where(eq(payments.paymentId, p.paymentId));
        
      console.log(`Successfully synced ${p.paymentId} to row ${rowIndex}`);
    } catch (err) {
      console.error(`Failed to sync ${p.paymentId}:`, err);
    }
  }

  console.log("Alignment complete.");
}

alignPayments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
