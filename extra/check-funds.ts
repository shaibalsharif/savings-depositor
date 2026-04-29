import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });
import { db } from "./db/client";
import { funds } from "./db/schema";

async function run() {
  const allFunds = await db.select().from(funds);
  console.log("Funds:", allFunds);
}
run();
