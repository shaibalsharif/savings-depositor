import { pgTable, serial, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 100 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 20 }), // 'admin', 'finance_manager', 'member'
  archived: boolean('archived').default(false),
  joinedAt: timestamp('joined_at').defaultNow()
});
