import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { terms } from "@/db/schema";

function checkAdminOrManager(user: any) {
  return true //user?.role === "admin" || user?.role === "manager";
}

import { desc } from "drizzle-orm"; // make sure this is imported

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [latestTerm] = await db
    .select()
    .from(terms)
    .orderBy(desc(terms.createdAt)) // <-- Get the most recent entry
    .limit(1);

  return NextResponse.json({ terms: latestTerm?.content || "" });
}

export async function POST(request: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { terms: content } = await request.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.insert(terms).values({
    content,
    createdBy: user?.id,
  });

  return NextResponse.json({ success: true });
}
