import { pgTable, serial, varchar, text,numeric, timestamp, jsonb ,boolean,integer} from "drizzle-orm/pg-core";


// import { pgTable, serial, varchar, numeric, timestamp, text } from "drizzle-orm/pg-core";
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  month: varchar("month", { length: 32 }).notNull(), // E.g. "May 2024"
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  transactionId: varchar("transaction_id", { length: 128 }).notNull(),
  depositType: varchar("deposit_type", { length: 16 }).notNull(), // "full" or "partial"
   fundId: integer("fund_id").references(() => funds.id),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  updatedBy: varchar("updated_by", { length: 255 })
});

// --- Funds Table ---
export const funds = pgTable("funds", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deleted: boolean("deleted").default(false).notNull(), // soft delete
});

// --- Fund Transactions Table ---
export const fundTransactions = pgTable("fund_transactions", {
  id: serial("id").primaryKey(),
  fromFundId: integer("from_fund_id").references(() => funds.id),
  toFundId: integer("to_fund_id").references(() => funds.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  description: varchar("description", { length: 255 }),
});


export const depositSettings = pgTable("deposit_settings", {
  id: serial("id").primaryKey(),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(),
  reminderDay: integer("reminder_day").notNull(),
  effectiveMonth: varchar("effective_month", { length: 16 }).notNull(), // e.g., "2025-05"
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});



// --- Logs Table (for actions) ---
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: varchar("details", { length: 2048 }), // Can be JSON stringified
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});