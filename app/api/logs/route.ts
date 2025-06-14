import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logs } from "@/db/schema/logs";
import { eq, desc, and, gte, lte, or, like } from "drizzle-orm";
import { z } from "zod";

const logSchema = z.object({
  userId: z.string(),
  action: z.string().min(1),
  details: z.any(),
  timestamp: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "";
    const action = url.searchParams.get("action");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const query = url.searchParams.get("query");
    const limit = Number(url.searchParams.get("limit")) || 10;
    const cursor = url.searchParams.get("cursor"); // cursor = last createdAt from previous page

    const filters = [];

    if (userId && userId !== "all") {
      filters.push(eq(logs.userId, userId));
    }

    if (action && action !== "all") {
      filters.push(eq(logs.action, action));
    }

    if (startDate) {
      filters.push(gte(logs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      filters.push(lte(logs.createdAt, new Date(endDate)));
    }

    if (query) {
      const q = `%${query.toLowerCase()}%`;
      filters.push(
        or(
          like(logs.details, q),
          like(logs.action, q)
        )
      );
    }

    // For cursor pagination: fetch logs with createdAt < cursor (assuming descending order)
    if (cursor) {
      filters.push(lte(logs.createdAt, new Date(cursor)));
    }

    const logsResult = await db
      .select()
      .from(logs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(logs.createdAt))
      .limit(limit + 1); // fetch one extra to check if more pages exist

    // Determine next cursor
    let nextCursor = null;
    if (logsResult.length > limit) {
      const nextItem = logsResult[limit];
      nextCursor = nextItem.createdAt.toISOString();
      logsResult.pop(); // remove extra item
    }

    return NextResponse.json({ logs: logsResult, nextCursor });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await db.insert(logs).values({
      userId: body.userId,
      action: body.action,
      details: body.details,
      //   timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
