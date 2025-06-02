import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deposits, funds, logs } from "@/db/schema/logs";
import { eq, sql } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const depositId = parseInt(id, 10);
  const body = await request.json(); // <-- Only once!

  const { status, fundId } = body;

  const { getUser } = getKindeServerSession();

  const user = await getUser();
  // Fetch deposit and fund
  const deposit = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, depositId))
    .limit(1);
  if (!deposit)
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });

  if (status === "verified") {
    // 1. Update deposit status and fundId
    await db.transaction(async (trx) => {
      await trx
        .update(deposits)
        .set({
          status: "verified",
          fundId,
          updatedBy: user?.id,
          updatedAt: new Date(),
        })
        .where(eq(deposits.id, depositId));
      // 2. Fetch deposit amount (since deposits.amount is not available in funds update)
      const [depositRecord] = await trx
        .select({ amount: deposits.amount })
        .from(deposits)
        .where(eq(deposits.id, depositId));

      if (!depositRecord) {
        throw new Error("Deposit not found");
      }
      // 3. Update fund balance by adding deposit amount
      await trx
        .update(funds)
        .set({
          balance: sql`${funds.balance} + ${depositRecord.amount}`,
        })
        .where(eq(funds.id, fundId));

      // 4. Insert log
      await trx.insert(logs).values({
        userId: user?.id!,
        action: "approve_deposit",
        details: JSON.stringify({ depositId, fundId }),
      });
    });
  } else if (status === "rejected") {
    await db
      .update(deposits)
      .set({
        status: "rejected",
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

// // In your page component
// const fetchUserDeposits = async () => {
//   const res = await fetch(`/api/deposits/user?status=${filterStatus}&month=${filterMonth}`);
//   const data = await res.json();
//   setDeposits(data);
// };

// const fetchAllDeposits = async () => {
//   const res = await fetch(`/api/deposits/all?email=${selectedEmail}&status=${filterStatus}`);
//   const data = await res.json();
//   setDeposits(data);
// };

// const handleVerify = async (depositId: string) => {
//   await fetch(`/api/deposits/${depositId}`, {
//     method: "PATCH",
//     body: JSON.stringify({ status: "verified" })
//   });
//   refreshData();
// };
