import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth";

export async function GET() {
  const user = await requireMember();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // This endpoint is primarily for the Service Worker to ping
  // to ensure its network-first cache strategy stays warm.
  return NextResponse.json({
    cachedAt: new Date().toISOString(),
    status: "ok",
    userId: user.id
  });
}
