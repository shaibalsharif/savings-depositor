import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const { db } = await import("../db/client");
  const { personalInfo } = await import("../db/schema");

  console.log("Listing last 10 members in DB...");
  const members = await db.select().from(personalInfo).limit(10);
  console.log("Members:", JSON.stringify(members, null, 2));
}

run().catch(console.error);
