import { Pool } from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  console.log("Running schema migrations...\n");

  const statements: [string, string][] = [
    ["ADD sync_status to payments", `ALTER TABLE payments ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'pending'`],
    ["ADD sync_status to expenses", `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'pending'`],
    ["ADD sync_status to investments", `ALTER TABLE investments ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'pending'`],
    ["ADD sync_status to revenue_losses", `ALTER TABLE revenue_losses ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) NOT NULL DEFAULT 'pending'`],
    ["CREATE investment_shares", `
      CREATE TABLE IF NOT EXISTS investment_shares (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        investment_id VARCHAR(64) NOT NULL,
        member_id VARCHAR(255) NOT NULL,
        balance_at_investment NUMERIC(12, 2) NOT NULL,
        share_percentage NUMERIC(8, 4) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `],
    ["CREATE sync_logs", `
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        direction VARCHAR(16) NOT NULL,
        sheet_name VARCHAR(64),
        row_index INTEGER,
        entry_id VARCHAR(64),
        status VARCHAR(16) NOT NULL,
        error_message TEXT,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `],
    ["Mark existing synced payments", `UPDATE payments SET sync_status = 'synced' WHERE sync_status = 'pending' AND sheets_row_index IS NOT NULL`],
    ["Mark existing synced expenses", `UPDATE expenses SET sync_status = 'synced' WHERE sync_status = 'pending' AND sheets_row_index IS NOT NULL`],
    ["Mark existing synced investments", `UPDATE investments SET sync_status = 'synced' WHERE sync_status = 'pending' AND sheets_row_index IS NOT NULL`],
    ["Mark existing synced revenue_losses", `UPDATE revenue_losses SET sync_status = 'synced' WHERE sync_status = 'pending' AND sheets_row_index IS NOT NULL`],
  ];

  try {
    for (const [label, sql] of statements) {
      try {
        await client.query(sql);
        console.log(`✅  ${label}`);
      } catch (err: any) {
        console.error(`❌  ${label}: ${err.message}`);
        throw err;
      }
    }
    console.log("\n✅  All migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
