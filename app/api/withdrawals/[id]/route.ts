import { NextResponse } from "next/server";
import { withdrawals, funds, logs } from "@/db/schema";
import { eq } from "drizzle-orm"; // No need for 'sql' if not using sql`${column} + ${value}`
import { db } from "@/lib/db"; // Make sure this path is correct for your Drizzle DB instance

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // CORRECTED LINE: Removed 'await' before params.id
    const { id } = await params;
    const withdrawalId = parseInt(id, 10);
    const body = await request.json();
    const { status, fundId, rejectionReason, reviewedBy } = body;

    if (isNaN(withdrawalId)) {
      return NextResponse.json(
        { error: "Invalid Withdrawal ID" },
        { status: 400 }
      );
    }
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected".' },
        { status: 400 }
      );
    }
    if (!reviewedBy) {
      return NextResponse.json(
        { error: "Reviewer ID is required." },
        { status: 400 }
      );
    }

    let updatedWithdrawal;

    await db.transaction(async (tx) => {
      // 1. Fetch the withdrawal request and lock it
      const [withdrawalRequest] = await tx
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, withdrawalId))
        .for("update"); // Lock the withdrawal row

      if (!withdrawalRequest) {
        tx.rollback();
        // Return a new NextResponse object here, as the transaction is rolled back
        throw new Error("Withdrawal request not found"); // Throw to propagate error outside transaction
      }

      if (withdrawalRequest.status !== "pending") {
        tx.rollback();
        throw new Error(
          `Withdrawal request is already ${withdrawalRequest.status}.`
        );
      }

      if (status === "approved") {
        if (!fundId) {
          tx.rollback();
          throw new Error("Fund ID is required for approval.");
        }

        const amountToWithdraw = parseFloat(withdrawalRequest.amount);

        // 2. Fetch the fund and lock it for debit
        const [targetFund] = await tx
          .select()
          .from(funds)
          .where(eq(funds.id, fundId))
          .for("update"); // Lock the fund row

        if (!targetFund) {
          tx.rollback();
          throw new Error("Selected fund not found");
        }

        let currentFundBalance = parseFloat(targetFund.balance);

        if (currentFundBalance < amountToWithdraw) {
          tx.rollback();
          throw new Error("Insufficient funds in the selected fund.");
        }

        // 3. Deduct amount from the fund
        const newFundBalance = currentFundBalance - amountToWithdraw;
        await tx
          .update(funds)
          .set({
            balance: newFundBalance.toFixed(2),
            // updatedAt: new Date(), // Add updatedAt and updatedBy
            // updatedBy: reviewedBy,
          })
          .where(eq(funds.id, fundId));

        // 4. Update the withdrawal status to approved
        [updatedWithdrawal] = await tx
          .update(withdrawals)
          .set({
            status: "approved",
            reviewedBy: reviewedBy,
            reviewedAt: new Date(),
            fundId: fundId, // Associate the fund used for withdrawal
          })
          .where(eq(withdrawals.id, withdrawalId))
          .returning();

        // 5. Log the approval and fund debit
        await tx.insert(logs).values([
          {
            userId: reviewedBy,
            action: "APPROVE_WITHDRAWAL",
            details: JSON.stringify({
              withdrawalId: withdrawalRequest.id,
              userId: withdrawalRequest.userId,
              amount: amountToWithdraw,
              approvedFromFund: fundId,
            }),
            createdAt: new Date(),
          },
          {
            userId: reviewedBy, // The admin/reviewer performing the action
            action: "DEBIT_FUND_FOR_WITHDRAWAL",
            details: JSON.stringify({
              fundId: fundId,
              amount: amountToWithdraw,
              oldBalance: targetFund.balance,
              newBalance: newFundBalance.toFixed(2),
              withdrawalId: withdrawalRequest.id,
            }),
            createdAt: new Date(),
          },
        ]);
      } else if (status === "rejected") {
        // 1. Update the withdrawal status to rejected
        [updatedWithdrawal] = await tx
          .update(withdrawals)
          .set({
            status: "rejected",
            rejectionReason: rejectionReason || null,
            reviewedBy: reviewedBy,
            reviewedAt: new Date(),
          })
          .where(eq(withdrawals.id, withdrawalId))
          .returning();

        // 2. Log the rejection
        await tx.insert(logs).values({
          userId: reviewedBy,
          action: "REJECT_WITHDRAWAL",
          details: JSON.stringify({
            withdrawalId: withdrawalRequest.id,
            userId: withdrawalRequest.userId,
            reason: rejectionReason || "No reason provided",
          }),
          createdAt: new Date(),
        });
      }
    });

    if (!updatedWithdrawal) {
      // This should ideally be caught by `tx.rollback()` through the thrown errors,
      // but as an extra safeguard for unexpected transaction failures.
      return NextResponse.json(
        { error: "Transaction failed, withdrawal not updated." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { withdrawal: updatedWithdrawal },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating withdrawal status:", error);
    // Handle errors thrown from within the transaction (e.g., specific error messages)
    if (error.message.includes("Withdrawal request not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    } else if (
      error.message.includes("Withdrawal request is already") ||
      error.message.includes("Fund ID is required for approval") ||
      error.message.includes("Selected fund not found") ||
      error.message.includes("Insufficient funds")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update withdrawal status", details: error.message },
      { status: 500 }
    );
  }
}
