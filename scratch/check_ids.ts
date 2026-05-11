import { db } from "../db/client";
import { payments } from "../db/schema";
import { inArray } from "drizzle-orm";

async function checkIds(ids: string[]) {
  const results = await db.select().from(payments).where(inArray(payments.paymentId, ids));
  console.log(JSON.stringify(results, null, 2));
}

checkIds(["PAY-713385", "PAY-252925"]).then(() => process.exit(0));
