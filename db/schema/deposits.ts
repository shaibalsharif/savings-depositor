import { pgTable, serial, varchar, numeric, timestamp, text } from "drizzle-orm/pg-core";

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  month: varchar("month", { length: 32 }).notNull(), // E.g. "May 2024"
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  transactionId: varchar("transaction_id", { length: 128 }).notNull(),
  depositType: varchar("deposit_type", { length: 16 }).notNull(), // "full" or "partial"
  imageUrl: text("image_url").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
