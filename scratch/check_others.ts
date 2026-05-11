import { db } from "../db/client";
import { expenses, investments } from "../db/schema";
import { readSheet } from "../lib/sheets";

async function checkOtherSheets() {
  const check = async (name: "Expenses" | "Investments", table: any, idField: string) => {
    const dbData = await db.select().from(table);
    const dbIds = new Set(dbData.map((d: any) => d[idField]));
    
    let sheetRows: any[] = [];
    try {
      sheetRows = await readSheet(name);
    } catch(e) {}
    
    const extra = sheetRows.filter(r => r["Entry ID"] && !dbIds.has(r["Entry ID"]));
    console.log(`${name}: DB has ${dbData.length}, Sheet has ${sheetRows.length}. Extra in Sheet: ${extra.length}`);
  };

  await check("Expenses", expenses, "entryId");
  await check("Investments", investments, "entryId");
}

checkOtherSheets().then(() => process.exit(0));
