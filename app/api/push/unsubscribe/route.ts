import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM push_subscriptions WHERE user_id = ${user.id} AND endpoint = ${endpoint}
    `);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to remove push subscription:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
