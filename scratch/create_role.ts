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
  const domain = process.env.KINDE_ISSUER_URL;
  const token = await getKindeMgmtToken();

  console.log("Creating Admin Role...");
  const response = await fetch(`${domain}/api/v1/roles`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      name: "Admin",
      key: "admin",
      description: "Admin user role"
    }),
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
