import { NextResponse } from "next/server";
import { getKindeManagementToken } from "@/lib/kinde-management";

export async function POST(req: Request) {
  const { newManagerId, oldManagerId } = await req.json();
 
  
  const orgCode = process.env.KINDE_ORG_CODE!;
  const token = await getKindeManagementToken();

  // 1. Fetch all permissions for the org
  const permsRes = await fetch(
    `${process.env.KINDE_ISSUER_URL}/api/v1/permissions`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  
  if (!permsRes.ok) {
    
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
  const permsData = await permsRes.json();

  // Find the manager permission object (case-insensitive match)  
  const managerPerm = permsData.permissions.find(
    (p: any) => p.key.toLowerCase() === "manager"
  );
  if (!managerPerm) {
    return NextResponse.json({ error: "Manager permission not found" }, { status: 500 });
  }

  
  // 2. Assign "manager" permission to new manager
  const assignRes = await fetch(
    `${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${orgCode}/users/${newManagerId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ permission_id: managerPerm.id }),
    }
  );
  if (!assignRes.ok) {    
    return NextResponse.json({ error: "Failed to assign manager" }, { status: 500 });
  }


  

  // 3. Remove "manager" permission from old manager (if exists and not the new one)
  if (oldManagerId && oldManagerId !== newManagerId) {
    await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${orgCode}/users/${oldManagerId}/permissions/${managerPerm.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  return NextResponse.json({ success: true });
}
