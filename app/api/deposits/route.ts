import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your Drizzle instance
import { deposits } from "@/db/schema";
import { and, eq, like, desc, sql, gte, lte, not } from "drizzle-orm";
import { z } from "zod";
// Zod validation schema
const depositSchema = z.object({
  userId: z.string().min(1),
  month: z.string().min(1),
  amount: z.number().positive(),
  transactionId: z.string().optional().nullable(),
  depositType: z.enum(["full", "partial"]),
  imageUrl: z.string().url().optional().nullable(),
  status: z.string(),
});

const filterSchema = z.object({
  id: z.string().optional(),
  account: z.string().optional(), // or .nullable().optional()
  status: z.string().optional(),
  month: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate input
  const parsed = depositSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Prevent duplicate for same user/month
  const existing = await db
    .select()
    .from(deposits)
    .where(
      and(
        eq(deposits.userId, body.userId),
        eq(deposits.month, body.month),
        not(eq(deposits.status, "rejected"))
      )
    );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Deposit for this month already exists." },
      { status: 409 }
    );
  }

  // Insert deposit
  await db.insert(deposits).values({
    userId: body.userId,
    month: body.month,
    amount: body.amount,
    transactionId: body.transactionId,
    depositType: body.depositType,
    imageUrl: body.imageUrl,
    status: body.status,
    // fundId: null,
    //   createdAt: body.createdAt,
  });

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const filters = filterSchema.parse({
    id: searchParams.get("userId") ?? undefined,
    account: searchParams.get("account") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });


  // Build query conditions
  let conditions = [];
  if (filters.id) conditions.push(eq(deposits.userId, filters.id));
  if (filters.account)
    conditions.push(like(deposits.userId, `%${filters.account}%`));
  if (filters.status && filters.status !== "all")
    conditions.push(eq(deposits.status, filters.status));
  if (filters.month && filters.month !== "all")
    conditions.push(eq(deposits.month, filters.month));

  if (filters.startDate && filters.endDate) {
    conditions.push(
      and(
        gte(deposits.createdAt, new Date(filters.startDate)),
        lte(deposits.createdAt, new Date(filters.endDate))
      )
    );
  } else if (filters.startDate)
    conditions.push(gte(deposits.createdAt, new Date(filters.startDate)));
  else if (filters.endDate)
    conditions.push(lte(deposits.createdAt, new Date(filters.endDate)));


  
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");
  // Execute query
  const data = await db
    .select()
    .from(deposits)
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${deposits.createdAt} DESC`);

  return NextResponse.json({ data });
}
