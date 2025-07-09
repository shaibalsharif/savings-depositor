// app/api/deposit-settings/effective/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { depositSettings } from "@/db/schema";
import { desc, and, lte, or, isNull, gt } from "drizzle-orm";



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json(
      { error: "Month parameter required" },
      { status: 400 }
    );
  }
 

  try {
    // Find the deposit setting effective for the given month:
    // effectiveMonth <= month AND (terminatedAt > month OR terminatedAt IS NULL)
    const setting = await db
      .select()
      .from(depositSettings)
      .where(
        and(
          lte(depositSettings.effectiveMonth, month),
          or(
            isNull(depositSettings.terminatedAt),
            gt(depositSettings.terminatedAt, month)
          )
        )
      )
      .orderBy(desc(depositSettings.effectiveMonth))
      .limit(1);

    return NextResponse.json(setting[0] || null);
  } catch (error) {
    console.error("Error fetching effective deposit setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit settings" },
      { status: 500 }
    );
  }
}
