/**
 * Kinde Management API Utility
 * Used for creating and managing users via Machine-to-Machine (M2M) authentication.
 */

export interface KindeUserCreateRequest {
  email: string;
  first_name: string;
  last_name?: string;
  connection_id?: string;
  is_suspended?: boolean;
}

export async function getKindeMgmtToken(): Promise<string> {
  const domain = process.env.KINDE_ISSUER_URL;
  const clientId = process.env.KINDE_M2M_CLIENT_ID;
  const clientSecret = process.env.KINDE_M2M_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error("Missing Kinde M2M credentials in environment variables");
  }

  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `${domain}/api`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Kinde M2M token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createKindeUser(userData: KindeUserCreateRequest) {
  const domain = process.env.KINDE_ISSUER_URL;
  const orgCode = process.env.KINDE_ORG_CODE;
  const token = await getKindeMgmtToken();

  // We'll use the Passwordless (OTP) connection by default for email identities
  // ID: conn_0196d7fcb27c328580350fdcafbcd119
  const connectionId = "conn_0196d7fcb27c328580350fdcafbcd119";

  const response = await fetch(`${domain}/api/v1/user`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      profile: {
        given_name: userData.first_name,
        family_name: userData.last_name || "",
      },
      organization_code: orgCode,
      identities: [
        {
          type: "email",
          identity: {
            email: userData.email,
          },
          connection_id: connectionId
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[KindeMgmt] Creation Error Response:", JSON.stringify(errorData));
    throw new Error(`Kinde User Creation Failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data;
}

export async function getKindeUserByEmail(email: string) {
  const domain = process.env.KINDE_ISSUER_URL;
  const token = await getKindeMgmtToken();

  const response = await fetch(`${domain}/api/v1/users?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.users?.[0] || null;
}
