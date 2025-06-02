import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your Drizzle instance
import { logs } from "@/db/schema/logs";
import { z } from "zod";
import { and, eq, gte, like, lte, or,desc, asc } from "drizzle-orm";

const logSchema = z.object({
  userId: z.string(),
  action: z.string().min(1),
  details: z.any(),
  timestamp: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")
    const action = url.searchParams.get("action")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const query = url.searchParams.get("query")

    // Build filters dynamically
    const filters = []

    if (userId && userId !== "all") {
      filters.push(eq(logs.userId, userId))
    }

    if (action && action !== "all") {
      filters.push(eq(logs.action, action))
    }

    if (startDate) {
      filters.push(gte(logs.createdAt, new Date(startDate)))
    }

    if (endDate) {
      filters.push(lte(logs.createdAt, new Date(endDate)))
    }

    if (query) {
      const q = `%${query.toLowerCase()}%`
      filters.push(
        or(
          like(logs.details, q),
          like(logs.action, q),
          // Add other searchable fields if any
        )
      )
    }

    // Query with combined filters (AND)
    const userLogs = await db
      .select()
      .from(logs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(logs.createdAt))  

    return NextResponse.json({ logs: userLogs })
  } catch (error) {
    console.error("Failed to fetch logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
