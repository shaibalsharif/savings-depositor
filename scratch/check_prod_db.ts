import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const { db } = await import("../db/client");
  const { personalInfo } = await import("../db/schema");
  const { ilike } = await import("drizzle-orm");
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");

  const email = "Teletalkagami01521@gmail.com";
  
  // Test current DB (ep-green-field)
  console.log("Searching in ep-green-field...");
  const members1 = await db.select().from(personalInfo).where(ilike(personalInfo.email, email));
  console.log("ep-green-field Results:", members1.length);

  // Test potential Prod DB (ep-noisy-cherry)
  const prodUrl = "postgresql://neondb_owner:npg_69dqmWwkXYgc@ep-noisy-cherry-a8y9vnui-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
  console.log("Searching in ep-noisy-cherry...");
  const sql = neon(prodUrl);
  const dbProd = drizzle(sql);
  const members2 = await dbProd.select().from(personalInfo).where(ilike(personalInfo.email, email));
  console.log("ep-noisy-cherry Results:", members2.length);
  
  if (members2.length > 0) {
    console.log("Detail from ep-noisy-cherry:", JSON.stringify(members2, null, 2));
  }
}

run().catch(console.error);
