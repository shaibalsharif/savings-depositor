import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  uuid,
  numeric,
  timestamp,
  jsonb,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";

// import { pgTable, serial, varchar, numeric, timestamp, text } from "drizzle-orm/pg-core";
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  month: varchar("month", { length: 32 }).notNull(), // E.g. "2024-05"
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  transactionId: varchar("transaction_id", { length: 128 }),
  depositType: varchar("deposit_type", { length: 16 })
    .notNull()
    .default("full"), // "full" or "partial"
  fundId: integer("fund_id").references(() => funds.id),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBalance: numeric("updated_balance", {
    precision: 10,
    scale: 2,
  }).default(sql`NULL`),
  note: varchar("note", { length: 200 }).default(sql`NULL`),

  updatedAt: timestamp("updated_at", { withTimezone: true }),
  updatedBy: varchar("updated_by", { length: 255 }),
});

// --- Funds Table ---
export const funds = pgTable("funds", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  currency: varchar("currency", { length: 10 }).default("BDT").notNull(), // Default to BDT
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deleted: boolean("deleted").default(false).notNull(), // soft delete
});

// --- Fund Transactions Table ---
export const fundTransactions = pgTable("fund_transactions", {
  id: serial("id").primaryKey(),
  fromFundId: integer("from_fund_id").references(() => funds.id),
  toFundId: integer("to_fund_id").references(() => funds.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  description: varchar("description", { length: 255 }),
});

// export const depositSettings = pgTable("deposit_settings", {
//   id: serial("id").primaryKey(),
//   monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }).notNull(),
//   dueDay: integer("due_day").notNull(),
//   reminderDay: integer("reminder_day").notNull(),
//   effectiveMonth: varchar("effective_month", { length: 16 }).notNull(), // e.g., "2025-05"
//   createdBy: varchar("created_by", { length: 255 }).notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
// });

export const personalInfo = pgTable("personal_info", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // always required

  // Only `name` is required now
  name: varchar("name", { length: 255 }),

  nameBn: varchar("name_bn", { length: 255 }),
  father: varchar("father", { length: 255 }),
  dob: date("dob"),
  profession: varchar("profession", { length: 255 }),
  religion: varchar("religion", { length: 255 }),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  mobile: varchar("mobile", { length: 20 }),
  nidNumber: varchar("nid_number", { length: 17 }),
  nidFront: text("nid_front"),
  nidBack: text("nid_back"),
  signature: text("signature"),
  position: varchar("position", { length: 50 }).notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nomineeInfo = pgTable("nominee_info", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  relation: varchar("relation", { length: 255 }),
  dob: date("dob"),
  mobile: varchar("mobile", { length: 20 }),
  nidNumber: varchar("nid_number", { length: 17 }),
  address: text("address"),
  photo: text("photo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const depositSettings = pgTable("deposit_settings", {
  id: serial("id").primaryKey(),
  monthlyAmount: varchar("monthly_amount", { length: 50 }).notNull(),
  dueDay: varchar("due_day", { length: 2 }).notNull(),
  reminderDay: varchar("reminder_day", { length: 2 }).notNull(),
  effectiveMonth: varchar("effective_month", { length: 7 }).notNull(), // e.g. "2025-06"
  // terminatedAt: varchar("terminated_at", { length: 7 }).nullable(), // nullable, defaults to NULL
  terminatedAt: varchar("terminated_at", { length: 7 }).default(sql`NULL`),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// export const logs = pgTable("logs", {
//   id: serial("id").primaryKey(),
//   userEmail: varchar("user_email", { length: 255 }).notNull(),
//   action: varchar("action", { length: 255 }).notNull(),
//   details: text("details"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// })

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientUserId: text("recipient_user_id").notNull(),
  senderUserId: text("sender_user_id"),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  relatedEntityId: text("related_entity_id"),
  roleTarget: varchar("role_target", { length: 50 }),
  actionRequired: boolean("action_required").default(false),
});

export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- withdrawals Table (for actions) ---
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  // Who is requesting
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Amount requested
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  // Which fund/account is being withdrawn from
  fundId: integer("fund_id").references(() => funds.id),
  // Purpose/category (e.g., Emergency Fund, Medical Expenses)
  purpose: varchar("purpose", { length: 128 }).notNull(),
  // Details/description of the request
  details: text("details"),
  // Status: pending, approved, rejected, etc.
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  // Who approved/rejected (optional, for audit)
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  // When requested
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  // When status changed
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  // For future extensibility (e.g., attachment, receipt, etc.)
  attachmentUrl: text("attachment_url"),
  rejectionReason: text("rejection_reason"),
});

// --- Logs Table (for actions) ---
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: varchar("details", { length: 2048 }), // Can be JSON stringified
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
