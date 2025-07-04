import { funds, logs } from "@/db/schema/logs";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const fundId = parseInt(params.id, 10);
  const fund = await db
    .select()
    .from(funds)
    .where(eq(funds.id, fundId))
    .limit(1);
    
  if (!fund) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (Number(fund[0].balance) !== 0)
    return NextResponse.json(
      { error: "Balance must be 0 to delete" },
      { status: 400 }
    );

  await db.update(funds).set({ deleted: true }).where(eq(funds.id, fundId));
  await db.insert(logs).values({
    userId: fund[0].createdBy,
    action: "remove_fund",
    details: JSON.stringify({ fundId }),
  });
  return NextResponse.json({ success: true });
}
