import {
  pgTable,
  integer,
  varchar,
  numeric,
  timestamp,
  boolean,
  text,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Reusable timestamp columns with updatedAt auto-update
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }).notNull(),
};

// --- NEW TABLES FOR REDESIGN ---

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  paymentId: varchar("payment_id", { length: 64 }).notNull().unique(), // PAY-{padded number}
  memberId: varchar("member_id", { length: 255 }).notNull(), // FK to users (Kinde)
  amountReceived: numeric("amount_received", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  forMonth: varchar("for_month", { length: 7 }), // YYYY-MM — which month this payment covers
  amountForMonth: numeric("amount_for_month", { precision: 10, scale: 2 }), // amount credited to forMonth
  note: varchar("note", { length: 200 }),
  voided: boolean("voided").default(false).notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(), // always the manager
  updatedBy: varchar("updated_by", { length: 255 }),
  sheetsRowIndex: integer("sheets_row_index"), // stores row number in Google Sheet
  syncStatus: varchar("sync_status", { length: 20 }).default("pending").notNull(), // synced | pending | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const depositAllocations = pgTable("deposit_allocations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  allocId: varchar("alloc_id", { length: 64 }).notNull().unique(), // ALLOC-{padded number}
  paymentId: varchar("payment_id", { length: 64 }).notNull(), // FK to payments.payment_id (handled in app logic or standard FK)
  memberId: varchar("member_id", { length: 255 }).notNull(),
  forMonth: varchar("for_month", { length: 7 }).notNull(), // YYYY-MM
  amountAllocated: numeric("amount_allocated", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entryId: varchar("entry_id", { length: 64 }).notNull().unique(), // EXP-{number}
  expenseDate: date("expense_date").notNull(),
  category: varchar("category", { length: 32 }).notNull(), // "expense"
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  linkedInvestmentId: varchar("linked_investment_id", { length: 64 }),
  recordedBy: varchar("recorded_by", { length: 255 }).notNull(),
  voided: boolean("voided").default(false).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  sheetsRowIndex: integer("sheets_row_index"),
  syncStatus: varchar("sync_status", { length: 20 }).default("pending").notNull(), // synced | pending | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const investments = pgTable("investments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entryId: varchar("entry_id", { length: 64 }).notNull().unique(), // INV-{number}
  investDate: date("invest_date").notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  principal: numeric("principal", { precision: 12, scale: 2 }).notNull(),
  expectedReturnDate: date("expected_return_date").notNull(),
  actualReturnDate: date("actual_return_date"),
  status: varchar("status", { length: 16 }).default("active").notNull(), // active / matured / defaulted
  note: varchar("note", { length: 255 }),
  recordedBy: varchar("recorded_by", { length: 255 }).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  sheetsRowIndex: integer("sheets_row_index"),
  syncStatus: varchar("sync_status", { length: 20 }).default("pending").notNull(), // synced | pending | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const revenueLosses = pgTable("revenue_losses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entryId: varchar("entry_id", { length: 64 }).notNull().unique(), // REV-{number}
  eventDate: date("event_date").notNull(),
  // sourceType: "profit" | "loss" | "principal_return" | "bank_profit" | "other"
  // "principal_return" means the invested principal came back — adds to available balance
  sourceType: varchar("source_type", { length: 32 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // always positive; sourceType drives sign logic
  linkedInvestmentId: varchar("linked_investment_id", { length: 64 }),
  recordedBy: varchar("recorded_by", { length: 255 }).notNull(),
  voided: boolean("voided").default(false).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  sheetsRowIndex: integer("sheets_row_index"),
  syncStatus: varchar("sync_status", { length: 20 }).default("pending").notNull(), // synced | pending | failed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});

// Snapshot of each member's proportional stake at the moment an investment was recorded.
// Immutable once created — represents financial exposure at investment time.
export const investmentShares = pgTable("investment_shares", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  investmentId: varchar("investment_id", { length: 64 }).notNull(), // FK to investments.entryId
  memberId: varchar("member_id", { length: 255 }).notNull(),
  balanceAtInvestment: numeric("balance_at_investment", { precision: 12, scale: 2 }).notNull(),
  sharePercentage: numeric("share_percentage", { precision: 8, scale: 4 }).notNull(), // e.g. 33.3333
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Audit log for every App→Sheet and Sheet→App sync event.
export const syncLogs = pgTable("sync_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  direction: varchar("direction", { length: 16 }).notNull(), // app_to_sheet | sheet_to_app | cron_retry
  sheetName: varchar("sheet_name", { length: 64 }),
  rowIndex: integer("row_index"),
  entryId: varchar("entry_id", { length: 64 }),
  status: varchar("status", { length: 16 }).notNull(), // success | error
  errorMessage: text("error_message"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- EXISTING TABLES ---

export const funds = pgTable("funds", {
  id: integer("id")
    .primaryKey()
    .generatedAlwaysAsIdentity({ startWith: 1, increment: 1 }),
  title: varchar("title", { length: 255 }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  currency: varchar("currency", { length: 10 }).default("BDT").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  deleted: boolean("deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const personalInfo = pgTable("personal_info", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameBn: varchar("name_bn", { length: 255 }).notNull(),
  father: varchar("father", { length: 255 }).notNull(),
  mother: varchar("mother", { length: 255 }),
  dob: date("dob").notNull(),
  profession: varchar("profession", { length: 255 }).notNull(),
  religion: varchar("religion", { length: 255 }).notNull(),
  presentAddress: text("present_address").notNull(),
  permanentAddress: text("permanent_address").notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  nidNumber: varchar("nid_number", { length: 17 }).notNull(),
  nidFront: text("nid_front"),
  nidBack: text("nid_back"),
  signature: text("signature"),
  photo: text("photo"),
  position: varchar("position", { length: 50 }).notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nomineeInfo = pgTable("nominee_info", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  relation: varchar("relation", { length: 100 }).notNull(),
  dob: date("dob"),
  mobile: varchar("mobile", { length: 20 }),
  nidNumber: varchar("nid_number", { length: 20 }),
  address: text("address"),
  photo: text("photo"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});



export const depositSettings = pgTable("deposit_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  monthlyAmount: varchar("monthly_amount", { length: 50 }).notNull(),
  dueDay: varchar("due_day", { length: 2 }).notNull(),
  reminderDay: varchar("reminder_day", { length: 2 }).notNull(),
  effectiveMonth: varchar("effective_month", { length: 7 }).notNull(), // e.g. "2025-06"
  terminatedAt: varchar("terminated_at", { length: 7 }),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});



export const logs = pgTable("logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: varchar("details", { length: 2048 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

