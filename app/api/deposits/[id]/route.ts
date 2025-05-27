import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deposits } from "@/db/schema/logs";
import { eq } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const depositId = parseInt(id, 10);
  const body = await request.json(); // <-- Only once!
  const { status, fundId } = await request.json();

  const { getUser } = getKindeServerSession();

  const user = await getUser();
 // Fetch deposit and fund
  const deposit = await db.select().from(deposits).where(eq(deposits.id, depositId)).first();
  if (!deposit) return NextResponse.json({ error: "Deposit not found" }, { status: 404 });

  if (status === "verified") {
    // Update deposit and fund
    await db.transaction(async (trx) => {
      await trx.update(deposits)
        .set({
          status: "verified",
          fundId,
          approvedBy: user?.email,
          updatedAt: new Date(),
        })
        .where(eq(deposits.id, depositId));

      await trx.update(funds)
        .set({ balance: sql`${funds.balance} + ${deposit.amount}` })
        .where(eq(funds.id, fundId));

      await trx.insert(logs).values({
        userEmail: user?.email!,
        action: "approve_deposit",
        details: JSON.stringify({ depositId, fundId }),
      });
    });
  } else if (status === "rejected") {
    await db.update(deposits)
      .set({
        status: "rejected",
        approvedBy: user?.email,
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, depositId));

    await db.insert(logs).values({
      userEmail: user?.email!,
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
