import { NextResponse } from "next/server";
import { getKindeManagementToken } from "@/lib/kinde-management";

export async function POST(
  _: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = await params;
  
  const token = await getKindeManagementToken();

  const res = await fetch(
    `${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_suspended: false,
      }),
    }
  );

  if (!res.ok)
    return NextResponse.json(
      { error: "Failed to suspend user" },
      { status: 500 }
    );
  return NextResponse.json({ success: true });
}
