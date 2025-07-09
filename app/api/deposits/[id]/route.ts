import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deposits, funds, logs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const depositId = parseInt(id, 10);
  const body = await request.json();

  const { status, fundId, note } = body;
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const deposit = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, depositId))
    .limit(1);

  if (!deposit || deposit.length === 0)
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });

  if (status === "verified") {
    await db.transaction(async (trx) => {
      // 1. Get deposit amount
      const [depositRecord] = await trx
        .select({ amount: deposits.amount })
        .from(deposits)
        .where(eq(deposits.id, depositId));

      if (!depositRecord) throw new Error("Deposit not found");

      // 2. Get current fund balance
      const fundRecord = (
        await trx.execute(
          sql`SELECT balance FROM ${funds} WHERE ${funds.id} = ${fundId} FOR UPDATE`
        )
      ).rows[0];

      if (!fundRecord) throw new Error("Fund not found");

      // 3. Calculate updated balance
      const newBalance =
        Number(fundRecord.balance) + Number(depositRecord.amount);

      // 4. Update fund balance
      await trx
        .update(funds)
        .set({
          balance: sql`${funds.balance} + ${depositRecord.amount}`,
        })
        .where(eq(funds.id, fundId));

      // 5. Update deposit with status, fundId, updated balance, updatedBy
      await trx
        .update(deposits)
        .set({
          status: "verified",
          fundId,
          updatedBy: user?.id,
          updatedAt: new Date(),
          note: note,
          updatedBalance: newBalance.toString(),
        })
        .where(eq(deposits.id, depositId));

      // 6. Log action
      await trx.insert(logs).values({
        userId: user?.id!,
        action: "approve_deposit",
        details: JSON.stringify({ depositId, fundId, newBalance }),
      });
    });
  } else if (status === "rejected") {
    await db
      .update(deposits)
      .set({
        status: "rejected",
        note: note,

        updatedBy: user?.id,

        updatedAt: new Date(),
      })
      .where(eq(deposits.id, depositId));

    await db.insert(logs).values({
      userId: user?.id!,
      action: "reject_deposit",
      details: JSON.stringify({ depositId }),
    });
  }

  return NextResponse.json({ success: true });
}
