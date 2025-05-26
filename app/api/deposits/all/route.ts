import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deposits } from "@/db/schema/logs";
import { and, eq, sql, gte, lte, ilike } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request: Request) {
  const { getPermissions } = getKindeServerSession();
  const permissions = await getPermissions();

  if (!permissions?.permissions?.includes("view:all-deposits")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account");
  const status = searchParams.get("status");
  const month = searchParams.get("month");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build query conditions (same as above)
  let conditions = [];
  if (account) conditions.push(eq(deposits.userEmail, account));
  if (status && status !== "all") conditions.push(eq(deposits.status, status));
  if (month && month !== "all") conditions.push(eq(deposits.month, month));
  if (startDate && endDate) {
    conditions.push(
      and(
        gte(deposits.createdAt, new Date(startDate)),
        lte(deposits.createdAt, new Date(endDate))
      )
    );
  }
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  const data = await db
    .select()
    .from(deposits)
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${deposits.createdAt} DESC`);

  return NextResponse.json({ data });
}
