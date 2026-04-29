import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running direct schema migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS "payments" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "payment_id" varchar(64) NOT NULL UNIQUE,
      "member_id" varchar(255) NOT NULL,
      "amount_received" numeric(10,2) NOT NULL,
      "payment_date" date NOT NULL,
      "note" varchar(200),
      "voided" boolean NOT NULL DEFAULT false,
      "created_by" varchar(255) NOT NULL,
      "updated_by" varchar(255),
      "sheets_row_index" integer,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ payments table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "deposit_allocations" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "alloc_id" varchar(64) NOT NULL UNIQUE,
      "payment_id" varchar(64) NOT NULL,
      "member_id" varchar(255) NOT NULL,
      "for_month" varchar(7) NOT NULL,
      "amount_allocated" numeric(10,2) NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ deposit_allocations table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "expenses" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "entry_id" varchar(64) NOT NULL UNIQUE,
      "expense_date" date NOT NULL,
      "category" varchar(32) NOT NULL,
      "description" varchar(255) NOT NULL,
      "amount" numeric(10,2) NOT NULL,
      "linked_investment_id" varchar(64),
      "recorded_by" varchar(255) NOT NULL,
      "voided" boolean NOT NULL DEFAULT false,
      "sheets_row_index" integer,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ expenses table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "investments" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "entry_id" varchar(64) NOT NULL UNIQUE,
      "invest_date" date NOT NULL,
      "recipient" varchar(255) NOT NULL,
      "principal" numeric(12,2) NOT NULL,
      "expected_return_date" date NOT NULL,
      "actual_return_date" date,
      "status" varchar(16) NOT NULL DEFAULT 'active',
      "note" varchar(255),
      "recorded_by" varchar(255) NOT NULL,
      "sheets_row_index" integer,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ investments table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "revenue_losses" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "entry_id" varchar(64) NOT NULL UNIQUE,
      "event_date" date NOT NULL,
      "source_type" varchar(32) NOT NULL,
      "description" varchar(255) NOT NULL,
      "amount" numeric(10,2) NOT NULL,
      "linked_investment_id" varchar(64),
      "recorded_by" varchar(255) NOT NULL,
      "voided" boolean NOT NULL DEFAULT false,
      "sheets_row_index" integer,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ revenue_losses table ready");

  // Add effectiveMonth + updatedBy to deposit_settings if missing
  await sql`
    ALTER TABLE "deposit_settings"
    ADD COLUMN IF NOT EXISTS "effective_month" varchar(7),
    ADD COLUMN IF NOT EXISTS "terminated_at" varchar(7),
    ADD COLUMN IF NOT EXISTS "updated_by" varchar(255)
  `;
  console.log("✓ deposit_settings columns updated");

  // Add logs table if missing
  await sql`
    CREATE TABLE IF NOT EXISTS "logs" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "user_id" varchar(255) NOT NULL,
      "action" varchar(255) NOT NULL,
      "details" varchar(2048) NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz
    )
  `;
  console.log("✓ logs table ready");

  console.log("\n✅ All tables created/verified successfully!");
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
