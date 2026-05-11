import { db } from "../db/client";
import { payments, personalInfo } from "../db/schema";
import { appendRow, readSheet } from "../lib/sheets";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

// Reuse the auth logic from lib/sheets but we need a custom clear for the whole range
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

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

async function cleanAndRebuildSheet() {
  console.log("Starting full sheet rebuild...");

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Clear the entire Payments sheet (except headers)
  console.log("Clearing 'Payments' sheet...");
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: "Payments!A2:Z1000",
  });

  // 2. Fetch all payments from DB
  const dbPayments = await db.select().from(payments);
  console.log(`Found ${dbPayments.length} payments in database to re-sync.`);

  // 3. Batch sync back to sheets
  // We'll do it one by one to get individual row indices, 
  // or we can use batchUpdate if we calculate indices manually.
  // Using appendRow is safer for getting the correct index.
  
  for (const p of dbPayments) {
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
      
    console.log(`Re-synced ${p.paymentId} to row ${rowIndex}`);
  }

  console.log("Full rebuild complete.");
}

cleanAndRebuildSheet()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
