import { db } from "../db/client";
import { payments, personalInfo, expenses, investments } from "../db/schema";
import { appendRow } from "../lib/sheets";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

// Reuse the auth logic
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

async function rebuildAllSheets() {
  console.log("Starting full sheets rebuild (Payments, Expenses, Investments)...");

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const tables = [
    { 
      name: "Payments", 
      table: payments, 
      toRow: async (p: any) => [
        p.paymentId, 
        await getMemberName(p.memberId), 
        p.amountReceived, 
        p.paymentDate, 
        p.forMonth || "", 
        p.note || "", 
        p.voided ? "TRUE" : "FALSE", 
        "synced"
      ] 
    },
    { 
      name: "Expenses", 
      table: expenses, 
      toRow: async (e: any) => [
        e.entryId, 
        e.expenseDate, 
        e.category, 
        e.description, 
        e.amount, 
        e.recordedBy, 
        e.voided ? "TRUE" : "FALSE", 
        "synced"
      ] 
    },
    { 
      name: "Investments", 
      table: investments, 
      toRow: async (i: any) => [
        i.entryId, 
        i.investDate, 
        i.recipient, 
        i.principal, 
        i.expectedReturnDate, 
        i.status, 
        i.recordedBy, 
        "synced"
      ] 
    }
  ];

  for (const t of tables) {
    console.log(`\nRebuilding '${t.name}'...`);
    
    // 1. Clear
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${t.name}!A2:Z1000`,
    });
    console.log(`Cleared '${t.name}' sheet.`);

    // 2. Fetch
    const dbData = await db.select().from(t.table);
    console.log(`Found ${dbData.length} records in DB.`);

    // 3. Re-sync
    for (const item of dbData) {
      const row = await t.toRow(item);
      const rowIndex = await appendRow(t.name as any, row);
      
      await db.update(t.table)
        .set({ sheetsRowIndex: rowIndex, syncStatus: "synced" })
        .where(eq((t.table as any).id, item.id));
        
      console.log(`Synced ${item.entryId || item.paymentId} to row ${rowIndex}`);
    }
  }

  console.log("\nFull sheets rebuild complete.");
}

rebuildAllSheets()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
