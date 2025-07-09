import { funds, logs } from "@/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fundId = parseInt(params.id, 10);

    if (isNaN(fundId)) {
      return NextResponse.json({ error: 'Invalid Fund ID' }, { status: 400 });
    }

    const [fund] = await db.select().from(funds).where(eq(funds.id, fundId));

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    }

    return NextResponse.json({ fund }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching fund:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fundId = parseInt(params.id, 10);
    const body = await request.json();
    const { amount, type, description, userId } = body; // `type` could be 'credit' or 'debit'

    if (isNaN(fundId)) {
      return NextResponse.json({ error: 'Invalid Fund ID' }, { status: 400 });
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type. Must be "credit" or "debit".' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required for logging.' }, { status: 400 });
    }


    let updatedFund;
    await db.transaction(async (tx) => {
      // 1. Fetch the current balance and lock the row to prevent race conditions
      const [currentFund] = await tx.select()
        .from(funds)
        .where(eq(funds.id, fundId))
        .for("update"); // This locks the row for the duration of the transaction

      if (!currentFund) {
        tx.rollback(); // Rollback if fund not found
        return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
      }

      let newBalance = parseFloat(currentFund.balance);

      if (type === 'credit') {
        newBalance += amount;
      } else { // type === 'debit'
        if (newBalance < amount) {
          tx.rollback(); // Rollback if insufficient funds
          return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }
        newBalance -= amount;
      }

      // 2. Update the balance using SQL expression for atomic update
      // This is generally more robust than fetching, calculating, then updating
      [updatedFund] = await tx.update(funds)
        .set({
          balance: newBalance.toFixed(2), // Ensure two decimal places
          // updatedAt: new Date(),
          // updatedBy: userId, // Assuming userId is passed for audit
        })
        .where(eq(funds.id, fundId))
        .returning(); // Return the updated fund

      if (!updatedFund) {
        tx.rollback();
        throw new Error("Failed to update fund balance.");
      }

      // 3. Log the transaction (part of the same atomic operation)
      await tx.insert(logs).values({
        userId: userId,
        action: `${type.toUpperCase()}_FUND_BALANCE`,
        details: JSON.stringify({
          fundId: fundId,
          amount: amount,
          oldBalance: currentFund.balance,
          newBalance: updatedFund.balance,
          type: type,
          description: description || null,
        }),
        createdAt: new Date(),
      });
    });

    if (!updatedFund) {
        // This case should ideally be caught by `tx.rollback()` above, but as a safeguard.
        return NextResponse.json({ error: 'Transaction failed, fund not updated.' }, { status: 500 });
    }

    return NextResponse.json({ fund: updatedFund }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating fund balance:", error);
    // Check if the error is from a rollback due to insufficient funds or fund not found
    if (error.message === 'Insufficient funds' || error.message === 'Fund not found') {
        return NextResponse.json({ error: error.message }, { status: error.message === 'Fund not found' ? 404 : 400 });
    }
    return NextResponse.json(
      { error: "Failed to update fund balance", details: error.message },
      { status: 500 }
    );
  }
}

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
