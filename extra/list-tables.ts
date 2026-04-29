import "dotenv/config";
import { db } from "../db/client";
import { sql } from "drizzle-orm";

async function listTables() {
  const result = await db.execute(sql.raw(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `));
  console.log("Tables in database:");
  for (const row of result.rows) {
    console.log(`  - ${row.table_name}`);
  }
}

listTables();
