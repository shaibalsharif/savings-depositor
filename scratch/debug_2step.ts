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
  const email = "two_step_" + Date.now() + "@example.com";

  console.log("Step 1: Creating user profile...");
  const createRes = await fetch(`${domain}/api/v1/user`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      profile: {
        given_name: "Two",
        family_name: "Step",
      }
    }),
  });

  const createData = await createRes.json();
  console.log("Create Status:", createRes.status);
  console.log("User ID:", createData.id);

  if (createData.id) {
    console.log("Step 2: Adding identity...");
    const identRes = await fetch(`${domain}/api/v1/user/identities`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        user_id: createData.id,
        type: "email",
        identity: email
      }),
    });

    const identData = await identRes.json();
    console.log("Ident Status:", identRes.status);
    console.log("Ident Response:", JSON.stringify(identData, null, 2));
  }
}

run().catch(console.error);
