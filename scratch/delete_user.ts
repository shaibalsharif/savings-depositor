import { db } from "../db/client";
import { personalInfo, payments, depositAllocations, investmentShares, nomineeInfo, logs, sentNotifications } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

async function deleteUsers(emails: string[]) {
  console.log(`Searching for users with emails: ${emails.join(", ")}`);
  
  const users = await db.select().from(personalInfo).where(inArray(personalInfo.email, emails));
  
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }
  
  for (const user of users) {
    const userId = user.userId;
    const email = user.email;
    console.log(`\nProcessing deletion for User: ${email} (ID: ${userId})`);

    // Delete associated data
    const d1 = await db.delete(depositAllocations).where(eq(depositAllocations.memberId, userId));
    console.log(`Deleted ${d1.rowCount} allocations.`);

    const d2 = await db.delete(payments).where(eq(payments.memberId, userId));
    console.log(`Deleted ${d2.rowCount} payments.`);

    const d3 = await db.delete(investmentShares).where(eq(investmentShares.memberId, userId));
    console.log(`Deleted ${d3.rowCount} investment shares.`);

    const d4 = await db.delete(nomineeInfo).where(eq(nomineeInfo.userId, userId));
    console.log(`Deleted ${d4.rowCount} nominee records.`);

    const d5 = await db.delete(logs).where(eq(logs.userId, userId));
    console.log(`Deleted ${d5.rowCount} logs.`);

    const d6 = await db.delete(sentNotifications).where(eq(sentNotifications.userId, userId));
    console.log(`Deleted ${d6.rowCount} notifications.`);

    const d7 = await db.delete(personalInfo).where(eq(personalInfo.userId, userId));
    console.log(`Deleted ${d7.rowCount} personal info records.`);
  }

  console.log("\nAll requested users and their associated data deleted successfully.");
}

deleteUsers(["shaibal.tiller@gmail.com", "teletalkagami01521@gmail.com"])
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
