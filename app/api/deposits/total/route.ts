import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deposits } from "@/db/schema/logs";
import { eq, lte, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month");

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (!month) return NextResponse.json({ error: "Missing month" }, { status: 400 });

  const result = await db.select({
    total: sql`COALESCE(SUM(${deposits.amount}), 0)`,
  })
  .from(deposits)
  .where(
    and(
      eq(deposits.userId, userId),
      lte(deposits.month, month)
    )
  );

  return NextResponse.json({ total: result[0]?.total ?? 0 });
}
