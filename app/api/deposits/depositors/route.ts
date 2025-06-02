// app/api/kinde/users/batch/route.ts (or pages/api/kinde/users/batch.ts)

import { getKindeManagementToken } from "@/lib/kinde-management";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const token = await getKindeManagementToken();

    // 2. Fetch user details for each userId in parallel
    const userDetails = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const res = await fetch(
            `${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) return { userId, error: "Failed to fetch user" };
          const data = await res.json();
          return { userId, data };
        } catch {
          return { userId, error: "Fetch error" };
        }
      })
    );

    // Format response as { userId: userData }
    const userMap = userDetails.reduce((acc, curr) => {
      acc[curr.userId] = curr.data || null;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(userMap);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
