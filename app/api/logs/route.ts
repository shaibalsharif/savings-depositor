import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your Drizzle instance
import { logs } from "@/db/schema/logs";
import { z } from "zod";

const logSchema = z.object({
  userEmail: z.string().email(),
  action: z.string().min(1),
  details: z.any(),
  timestamp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await db.insert(logs).values({
      userEmail: body.userEmail,
      action: body.action,
      details: body.details,
    //   timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
