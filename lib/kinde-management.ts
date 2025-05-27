import fetch from "node-fetch";

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
  const data = await res.json();
  return data.access_token as string;
}
