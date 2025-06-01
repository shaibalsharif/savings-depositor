import { funds, fundTransactions, logs } from "@/db/schema/logs";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { fromFundId, toFundId, amount, description } = await request.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  try {
    await db.transaction(async (trx) => {
      // 1. Lock rows for both funds to prevent concurrent balance updates
      const [fromFund] = await trx
        .select()
        .from(funds)
        .where(eq(funds.id, fromFundId))
        .for("update");

      const [toFund] = await trx
        .select()
        .from(funds)
        .where(eq(funds.id, toFundId))
        .for("update");

      if (!fromFund || !toFund) {
        throw new Error("One or both fund IDs are invalid.");
      }

      const fromBalance = Number(fromFund.balance);
      const transferAmount = Number(amount);

      if (fromBalance < transferAmount) {
        throw new Error("Insufficient funds in the source fund.");
      }

      // 2. Update balances safely
      await trx
        .update(funds)
        .set({ balance: sql`${funds.balance} - ${transferAmount}` })
        .where(eq(funds.id, fromFundId));

      await trx
        .update(funds)
        .set({ balance: sql`${funds.balance} + ${transferAmount}` })
        .where(eq(funds.id, toFundId));

      // 3. Log the transaction
      await trx.insert(fundTransactions).values({
        fromFundId,
        toFundId,
        amount: transferAmount?.toString(),
        createdBy: user?.id!,
        description,
      });

      await trx.insert(logs).values({
        userId: user?.id!,
        action: "fund_transfer",
        details: JSON.stringify({ fromFundId, toFundId, amount, description }),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Fund transfer error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Fund transfer failed." },
      { status: 400 }
    );
  }
}

export async function GET() {
  const data = await db
    .select()
    .from(fundTransactions)
    .orderBy(sql`${fundTransactions.createdAt} DESC`);
  return NextResponse.json({ transactions: data });
}
