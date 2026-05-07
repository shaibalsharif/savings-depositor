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
  const email = "two_step_global_" + Date.now() + "@example.com";

  console.log("Step 1: Creating Global User with Identity...");
  const createRes = await fetch(`${domain}/api/v1/user`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      profile: {
        given_name: "Step",
        family_name: "One",
      },
      identities: [
        {
          type: "email",
          identity: {
            email: email
          }
        }
      ]
    }),
  });

  const createData = await createRes.json();
  console.log("Create Status:", createRes.status);
  console.log("Create Response:", JSON.stringify(createData, null, 2));

  if (createData.id) {
    console.log("Step 2: Adding to Organization...");
    const orgRes = await fetch(`${domain}/api/v1/organizations/${orgCode}/users`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        users: [createData.id]
      }),
    });

    const orgData = await orgRes.json();
    console.log("Org Status:", orgRes.status);
    console.log("Org Response:", JSON.stringify(orgData, null, 2));
  }
}

run().catch(console.error);
