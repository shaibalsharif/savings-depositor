import { db } from "../db/client";
import { payments } from "../db/schema";
import { readSheet } from "../lib/sheets";

async function listExtraSheetRows() {
  console.log("Fetching data for comparison...");
  
  const dbPayments = await db.select().from(payments);
  const dbPaymentIds = new Set(dbPayments.map(p => p.paymentId));
  
  const sheetRows = await readSheet("Payments");
  console.log(`Sheet has ${sheetRows.length} total rows.`);

  const extraRows: any[] = [];
  
  sheetRows.forEach((row, index) => {
    const paymentId = row["Payment ID"];
    if (paymentId && !dbPaymentIds.has(paymentId)) {
      extraRows.push({
        rowIndex: index + 2, // +1 for header, +1 for 1-based indexing
        paymentId,
        memberName: row["Member Name"],
        forMonth: row["For Month"],
        amount: row["Amount"]
      });
    }
  });

  console.log(`Found ${extraRows.length} rows in Sheet that are NOT in Database.`);
  
  extraRows.slice(0, 20).forEach(r => {
    console.log(`Row ${r.rowIndex}: ${r.paymentId} | ${r.memberName} | ${r.forMonth} | ${r.amount}`);
  });
  
  if (extraRows.length > 20) {
    console.log(`... and ${extraRows.length - 20} more.`);
  }

  return extraRows;
}

listExtraSheetRows().then(() => process.exit(0));
