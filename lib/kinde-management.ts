import fetch from "node-fetch";

type KindeTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export async function getKindeManagementToken() {
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.KINDE_M2M_CLIENT_ID!,
      client_secret: process.env.KINDE_M2M_CLIENT_SECRET!,
      audience: `${process.env.KINDE_ISSUER_URL}/api`,
    }),
  });


  if (!res.ok) throw new Error("Failed to get Kinde token");

  const data: KindeTokenResponse = (await res.json()) as KindeTokenResponse;

  return data.access_token;
}
