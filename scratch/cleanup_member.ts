import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function getKindeMgmtToken(): Promise<string> {
  const domain = process.env.KINDE_ISSUER_URL;
  const clientId = process.env.KINDE_M2M_CLIENT_ID;
  const clientSecret = process.env.KINDE_M2M_CLIENT_SECRET;

  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId!,
      client_secret: clientSecret!,
      audience: `${domain}/api`,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function run() {
  const { db } = await import("../db/client");
  const { personalInfo, nomineeInfo } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const email = "Teletalkagami01521@gmail.com";
  console.log(`Cleaning up user: ${email}`);

  // 1. Delete from DB
  console.log("Deleting from Neon DB...");
  const member = await db.select().from(personalInfo).where(eq(personalInfo.email, email)).limit(1);
  if (member.length > 0) {
    await db.delete(nomineeInfo).where(eq(nomineeInfo.userId, member[0].userId));
    await db.delete(personalInfo).where(eq(personalInfo.email, email));
    console.log("Deleted from DB.");
  }

  // 2. Delete from Kinde (Invitation)
  console.log("Deleting from Kinde...");
  const domain = process.env.KINDE_ISSUER_URL;
  const token = await getKindeMgmtToken();
  const orgCode = process.env.KINDE_ORG_CODE;

  // Find invitations
  const inviteRes = await fetch(`${domain}/api/v1/organization/${orgCode}/invites`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const inviteData = await inviteRes.json();
  const invite = inviteData.invites?.find((i: any) => i.email.toLowerCase() === email.toLowerCase());

  if (invite) {
    console.log(`Found invite ${invite.id}. Revoking...`);
    const revokeRes = await fetch(`${domain}/api/v1/organization/${orgCode}/invites/${invite.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    console.log("Revoke Status:", revokeRes.status);
  } else {
    console.log("No active invite found in Kinde.");
    
    // Also check if they are already a user
    const userRes = await fetch(`${domain}/api/v1/users?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });
    const userData = await userRes.json();
    if (userData.users && userData.users.length > 0) {
      const userId = userData.users[0].id;
      console.log(`Found user ${userId} in Kinde. Deleting...`);
      const deleteRes = await fetch(`${domain}/api/v1/user?id=${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      console.log("Delete User Status:", deleteRes.status);
    }
  }

  console.log("Cleanup complete.");
}

run().catch(console.error);
