import "dotenv/config";
import { db } from "../db/client";
import { sql } from "drizzle-orm";

async function fixMissingTables() {
  console.log("Creating investment_shares and sync_logs tables...");
  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "investment_shares" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "investment_id" varchar(64) NOT NULL,
        "member_id" varchar(255) NOT NULL,
        "balance_at_investment" numeric(12, 2) NOT NULL,
        "share_percentage" numeric(8, 4) NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `));
    console.log("Created investment_shares successfully.");

    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS "sync_logs" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "direction" varchar(16) NOT NULL,
        "sheet_name" varchar(64),
        "row_index" integer,
        "entry_id" varchar(64),
        "status" varchar(16) NOT NULL,
        "error_message" text,
        "payload" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `));
    console.log("Created sync_logs successfully.");
  } catch (err: any) {
    console.error("Error creating tables:", err.message);
  }
}

fixMissingTables();
