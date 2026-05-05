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

    const subscription = await req.json();
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const { endpoint, keys: { p256dh, auth } } = subscription;

    await db.execute(sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${user.id}, ${endpoint}, ${p256dh}, ${auth})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        created_at = NOW()
    `);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to save push subscription:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
