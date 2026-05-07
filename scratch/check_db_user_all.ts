import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const { db } = await import("../db/client");
  const { personalInfo } = await import("../db/schema");
  const { ilike } = await import("drizzle-orm");

  const email = "Teletalkagami01521@gmail.com";
  console.log(`Searching for email: ${email}`);

  const members = await db.select().from(personalInfo).where(ilike(personalInfo.email, email));
  console.log("Found members (Total Count):", members.length);
  if (members.length > 0) {
    console.log("Detail:", JSON.stringify(members, null, 2));
  }
}

run().catch(console.error);
