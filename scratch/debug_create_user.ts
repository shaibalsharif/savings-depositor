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
  const orgCode = process.env.KINDE_ORG_CODE;
  const email = "only_ident_" + Date.now() + "@example.com";

  console.log("Creating user (Only Identities):", email);

  const body = {
    identities: [
      {
        type: "email:otp",
        identity: {
          email: email
        }
      }
    ],
    organization_code: orgCode
  };

  const response = await fetch(`${domain}/api/v1/user`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
