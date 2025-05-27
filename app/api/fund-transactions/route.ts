import { funds, fundTransactions, logs } from "@/db/schema/logs";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { fromFundId, toFundId, amount, description } = await request.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  await db.transaction(async (trx) => {
    await trx
      .update(funds)
      .set({ balance: sql`${funds.balance} - ${amount}` })
      .where(eq(funds.id, fromFundId));
    await trx
      .update(funds)
      .set({ balance: sql`${funds.balance} + ${amount}` })
      .where(eq(funds.id, toFundId));
    await trx.insert(fundTransactions).values({
      fromFundId,
      toFundId,
      amount,
      createdBy: user?.email!,
      description,
    });
    await trx.insert(logs).values({
      userEmail: user?.email!,
      action: "fund_transfer",
      details: JSON.stringify({ fromFundId, toFundId, amount, description }),
    });
  });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const data = await db
    .select()
    .from(fundTransactions)
    .orderBy(sql`${fundTransactions.createdAt} DESC`);
  return NextResponse.json({ transactions: data });
}
