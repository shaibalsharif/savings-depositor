import "dotenv/config";
import { db } from "../db/client";
import { sql } from "drizzle-orm";

const REDUNDANT_TABLES = [
  "deposits",
  "fund_transactions",
  "nominee_info",
  "notification_recipients",
  "notification_settings",
  "notifications",
  "terms",
  "users",
];

async function dropRedundantTables() {
  for (const table of REDUNDANT_TABLES) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
      console.log(`✅ Dropped: ${table}`);
    } catch (err: any) {
      console.error(`❌ Failed to drop ${table}:`, err.message);
    }
  }

  // Verify remaining tables
  const result = await db.execute(sql.raw(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name;
  `));
  console.log("\nRemaining tables:");
  for (const row of result.rows) {
    console.log(`  - ${row.table_name}`);
  }
}

dropRedundantTables();
