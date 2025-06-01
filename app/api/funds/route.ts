import { funds, logs } from "@/db/schema/logs";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { title } = await request.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const newFund = await db
    .insert(funds)
    .values({
      title,
      createdBy: user?.id!,
      balance: "0",
      currency: "BDT",
    })
    .returning();
  await db.insert(logs).values({
    userId: user?.id!,
    action: "create_fund",
    details: JSON.stringify({ fundId: newFund[0].id, title }),
  });
  return NextResponse.json({ fund: newFund[0] });
}

export async function GET() {
  const data = await db.select().from(funds).where(eq(funds.deleted, false));
  return NextResponse.json({ funds: data });
}
