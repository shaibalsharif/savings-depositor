import { NextResponse } from "next/server";
import { getKindeManagementToken } from "@/lib/kinde-management";

async function setUserPermissions(userId: string, permissions: string[], token: string) {
  // Kinde API: PUT /api/v1/users/{id}/permissions
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/users/${userId}/permissions`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) throw new Error("Failed to update permissions");
}

export async function POST(req: Request) {
  const { newManagerId, oldManagerId } = await req.json();
  const token = await getKindeManagementToken();

  // Assign "manager" permission to newManagerId
  await setUserPermissions(newManagerId, ["manager"], token);

  // Remove "manager" permission from oldManagerId (set to [])
  if (oldManagerId && oldManagerId !== newManagerId) {
    await setUserPermissions(oldManagerId, [], token);
  }

  return NextResponse.json({ success: true });
}
