import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { terms } from "@/db/schema/logs";

function checkAdminOrManager(user: any) {
  return user?.role === "admin" || user?.role === "manager";
}

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [currentTerms] = await db
    .select()
    .from(terms)
    .orderBy(terms.createdAt,) // <-- Use column reference here
    .limit(1);
  return NextResponse.json({ terms: currentTerms?.content || "" });
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

  await db.insert(terms).values({
    content,
    createdBy: user?.id,
  });

  return NextResponse.json({ success: true });
}
