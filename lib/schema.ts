import { pgTable, serial, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 100 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  photoUrl: varchar('photo_url', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 20 }), // 'admin', 'manager', 'member'
  archived: boolean('archived').default(false),
  joinedAt: timestamp('joined_at').defaultNow()
});

export const deposits = pgTable('deposits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  amount: integer('amount'),
  proofUrl: varchar('proof_url', { length: 255 }),
  month: integer('month'),
  year: integer('year'),
  status: varchar('status', { length: 20 }), // 'pending', 'approved'
  flag: varchar('flag', { length: 30 }), // 'advance', 'late', 'partial', null
  createdAt: timestamp('created_at').defaultNow()
});

export const withdrawals = pgTable('withdrawals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  amount: integer('amount'),
  account: varchar('account', { length: 20 }),
  purpose: varchar('purpose', { length: 100 }),
  details: varchar('details', { length: 255 }),
  status: varchar('status', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 20 }),
  balance: integer('balance')
});

export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 50 }),
  description: varchar('description', { length: 255 }),
  userId: varchar('user_id').references(() => users.id),
  amount: integer('amount'),
  performedBy: varchar('performed_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  message: varchar('message', { length: 255 }),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});
