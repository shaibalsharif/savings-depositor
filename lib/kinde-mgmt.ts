/**
 * Kinde Management API Utility (M2M)
 * Used for administrative actions like searching for users.
 */

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
  if (!response.ok) {
    throw new Error(`Failed to get Kinde M2M token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/**
 * Finds a user in Kinde by email.
 * Checks both the active user list and the organization's invitation list.
 */
export async function getKindeUserByEmail(email: string) {
  const token = await getKindeMgmtToken();
  const domain = process.env.KINDE_ISSUER_URL;
  const orgCode = process.env.KINDE_ORG_CODE;

  console.log(`[KindeMgmt] Searching for user by email: ${email}`);

  // 1. Search Active Users
  const userRes = await fetch(`${domain}/api/v1/users?email=${encodeURIComponent(email)}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (!userRes.ok) {
    const errorData = await userRes.json();
    console.error("[KindeMgmt] User search failed:", errorData);
    throw new Error(`Kinde API Error: ${errorData.message || userRes.statusText}`);
  }

  const userData = await userRes.json();
  if (userData.users && userData.users.length > 0) {
    const user = userData.users[0];
    console.log(`[KindeMgmt] Found active user: ${user.id}`);
    return {
      id: user.id,
      email: user.email,
      status: "active" as const
    };
  }

  // 2. Search Invitations (in case they haven't accepted yet)
  console.log(`[KindeMgmt] User not found in active list. Searching invitations...`);
  const inviteRes = await fetch(`${domain}/api/v1/organization/${orgCode}/invites`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (inviteRes.ok) {
    const inviteData = await inviteRes.json();
    const invite = inviteData.invites?.find((i: any) => i.email.toLowerCase() === email.toLowerCase());
    if (invite) {
      console.log(`[KindeMgmt] Found pending invitation: ${invite.id}`);
      return {
        id: invite.id, // Using invite ID as the temporary userId
        email: invite.email,
        status: "invited" as const
      };
    }
  }

  console.log(`[KindeMgmt] No user or invitation found for: ${email}`);
  return null;
}
