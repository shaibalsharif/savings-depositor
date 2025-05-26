// scripts/add-admin.ts

import { db } from "../lib/db.js";
import { users } from "../db/schema.js";
import bcrypt from "bcryptjs";

async function main() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name: "Admin User",
    email: "admin@example.com",
    phone: "+8801234567890",
    passwordHash: hash,
    role: "admin",
  });

  console.log("Admin user created!");
  process.exit(0);
}

main();
