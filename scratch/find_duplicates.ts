import { db } from "../db/client";
import { payments } from "../db/schema";
import { sql } from "drizzle-orm";

async function findDuplicates() {
  console.log("Searching for logical duplicates in database...");

  const allPayments = await db.select().from(payments);
  
  const seen = new Map<string, any>();
  const duplicates: any[] = [];

  for (const p of allPayments) {
    // Unique key: memberId + amount + forMonth + note (optional: + paymentDate)
    const key = `${p.memberId}|${p.amountReceived}|${p.forMonth}|${p.note}|${p.paymentDate}`;
    
    if (seen.has(key)) {
      duplicates.push({
        duplicate: p,
        original: seen.get(key)
      });
    } else {
      seen.set(key, p);
    }
  }

  console.log(`Found ${duplicates.length} duplicate groups.`);
  
  for (const group of duplicates) {
    console.log(`Duplicate: ${group.duplicate.paymentId} (Row: ${group.duplicate.sheetsRowIndex})`);
    console.log(`Original:  ${group.original.paymentId} (Row: ${group.original.sheetsRowIndex})`);
    console.log(`Data: Member ${group.duplicate.memberId}, Month ${group.duplicate.forMonth}, Amount ${group.duplicate.amountReceived}`);
    console.log("---");
  }

  return duplicates;
}

findDuplicates().then(() => process.exit(0));
