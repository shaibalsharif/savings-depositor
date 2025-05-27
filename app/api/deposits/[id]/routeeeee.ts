import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deposits } from "@/db/schema/logs";
import { eq } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const depositId = parseInt(id, 10);
  const body = await request.json(); // <-- Only once!
  const { status } = body;

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const [updatedDeposit] = await db
    .update(deposits)
    .set({
      status,
      updatedAt: new Date(),
      updatedBy: user?.email,
    })
    .where(eq(deposits.id, depositId))
    .returning();

  return NextResponse.json({ data: updatedDeposit });
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