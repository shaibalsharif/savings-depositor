import "dotenv/config";
import { db } from "../db/client";
import { investments } from "../db/schema";
import { calculateAndSaveShares } from "../lib/queries/investment";

async function main() {
  const allInvestments = await db.select().from(investments);
  
  console.log(`Found ${allInvestments.length} investments.`);
  
  for (const inv of allInvestments) {
    console.log(`Calculating shares for ${inv.entryId}...`);
    try {
      await calculateAndSaveShares(inv.entryId, inv.investDate);
      console.log(`✅ Computed and saved member shares for ${inv.entryId}`);
    } catch (e) {
      console.error(`❌ Failed for ${inv.entryId}:`, e);
    }
  }
  console.log("Done.");
}

main().catch(console.error);
