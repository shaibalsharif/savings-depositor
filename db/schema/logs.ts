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
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameBn: varchar("name_bn", { length: 255 }).notNull(),
  father: varchar("father", { length: 255 }).notNull(),
  dob: date("dob").notNull(),
  profession: varchar("profession", { length: 255 }).notNull(),
  religion: varchar("religion", { length: 255 }).notNull(),
  presentAddress: text("present_address").notNull(),
  permanentAddress: text("permanent_address").notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  nidNumber: varchar("nid_number", { length: 17 }).notNull(),
  nidFront: text("nid_front").notNull(),
  nidBack: text("nid_back").notNull(),
  signature: text("signature").notNull(),
  photo: text("photo").notNull(),
  position: varchar("position", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nomineeInfo = pgTable("nominee_info", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  relation: varchar("relation", { length: 255 }).notNull(),
  dob: date("dob").notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  nidNumber: varchar("nid_number", { length: 17 }).notNull(),
  address: text("address").notNull(),
  photo: text("photo").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
});

export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
