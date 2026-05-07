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
  const email = "shaibalsharif@gmail.com"; // Testing with manager email
  const domain = process.env.KINDE_ISSUER_URL;
  const token = await getKindeMgmtToken();

  console.log(`Searching for Kinde user: ${email}`);
  
  // 1. Search Users
  const userRes = await fetch(`${domain}/api/v1/users?email=${encodeURIComponent(email)}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const userData = await userRes.json();
  console.log("User Data Search Results:", JSON.stringify(userData, null, 2));

  // 2. Search Invitations (just in case they are pending)
  const orgCode = process.env.KINDE_ORG_CODE;
  const inviteRes = await fetch(`${domain}/api/v1/organization/${orgCode}/invites`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const inviteData = await inviteRes.json();
  const invite = inviteData.invites?.find((i: any) => i.email.toLowerCase() === email.toLowerCase());
  console.log("Invitation Search Result:", invite ? "Found" : "Not Found");
}

run().catch(console.error);
