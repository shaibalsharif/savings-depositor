import { NextResponse } from "next/server";
import { getKindeManagementToken } from "@/lib/kinde-management";

export async function GET() {
  const token = await getKindeManagementToken();

  // Get all users
  const usersRes = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!usersRes.ok) return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  const { users } = await usersRes.json();

  // For each user, fetch their permissions and status
  const detailedUsers = await Promise.all(
    users.map(async (user: any) => {
      // Get permissions
      const permsRes = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/users/${user.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const permsData = permsRes.ok ? await permsRes.json() : { permissions: [] };

      return {
        id: user.id,
        name: user.given_name ? `${user.given_name} ${user.family_name || ""}` : user.email,
        email: user.email,
        avatar: user.picture,
        permissions: permsData.permissions?.map((p: any) => p.code) || [],
        status: user.archived ? "archived" : "active",
      };
    })
  );

  return NextResponse.json({ users: detailedUsers });
}
