import { NextResponse } from "next/server";
import { getKindeManagementToken } from "@/lib/kinde-management";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const token = await getKindeManagementToken();
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/users/${params.id}/unarchive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return NextResponse.json({ error: "Failed to unarchive user" }, { status: 500 });
  return NextResponse.json({ success: true });
}
