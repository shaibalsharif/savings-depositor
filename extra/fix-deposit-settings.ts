import "dotenv/config";
import { db } from "../db/client";
import { sql } from "drizzle-orm";

async function fixDepositSettings() {
  console.log("Adding updated_by to deposit_settings...");
  try {
    await db.execute(sql.raw(`ALTER TABLE "deposit_settings" ADD COLUMN IF NOT EXISTS "updated_by" varchar(255);`));
    console.log("Added updated_by successfully.");
  } catch (err: any) {
    console.error("Error adding updated_by:", err.message);
  }
}

fixDepositSettings();
