// lib/actions/deposits/deposits.ts
"use server";

import { db } from "@/lib/db";
import { deposits, users, funds, logs, personalInfo } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { FullDeposit, Fund } from "@/types";
import { sendDepositReviewNotification } from "../notifications/depositNotifications";

export async function getPendingDeposits(
  sortBy: "createdAt" | "month" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Promise<{ deposits: FullDeposit[]; funds: Fund[] } | { error: string }> {
  try {
    const order = sortOrder === "asc" ? asc : desc;
    const orderByClause =
      sortBy === "month" ? order(deposits.month) : order(deposits.createdAt);

    const pendingDeposits = await db
      .select({
        id: deposits.id,
        userId: deposits.userId,
        amount: deposits.amount,
        transactionId: deposits.transactionId,
        depositType: deposits.depositType,
        imageUrl: deposits.imageUrl,
        status: deposits.status,
        createdAt: deposits.createdAt,
        month: deposits.month,
        fundId: deposits.fundId,
        updatedBalance: deposits.updatedBalance,
        updatedAt: deposits.updatedAt,
        updatedBy: deposits.updatedBy, // FIX: Added updatedBy
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          picture: users.picture,
          mobile: personalInfo.mobile,
        },
      })
      .from(deposits)
      .where(eq(deposits.status, "pending"))
      .leftJoin(users, eq(deposits.userId, users.id))
      .leftJoin(personalInfo, eq(deposits.userId, personalInfo.userId))
      .orderBy(orderByClause);

    const fundsList = await db
      .select()
      .from(funds)
      .where(eq(funds.deleted, false));

    const typedDeposits: FullDeposit[] = pendingDeposits.map((d) => ({
      id: d.id,
      userId: d.userId,
      amount: Number(d.amount),
      transactionId: d.transactionId,
      depositType: d.depositType as "full" | "partial",
      imageUrl: d.imageUrl,
      status: d.status as "pending",
      createdAt: d.createdAt.toISOString(), // FIX: Convert Date to string
      month: d.month,
      fundId: d.fundId || null,
      updatedBalance: d.updatedBalance !== null ? Number(d.updatedBalance) : 0,
      updatedAt:
        d.updatedAt?.toISOString().toString() ||
        new Date().toISOString().toString(),
      updatedBy: d.updatedBy,
      user: {
        id: d.user?.id || "N/A",
        name: d.user?.name || "Unknown User",
        email: d.user?.email || "N/A",
        picture: d.user?.picture || null,
        mobile: d.user?.mobile || null,
      },
    }));

    return { deposits: typedDeposits, funds: fundsList as Fund[] };
  } catch (error) {
    console.error("Error fetching pending deposits:", error);
    return { error: "Failed to fetch pending deposits" };
  }
}

const reviewDepositSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  fundId: z.number().optional(),
  rejectionReason: z.string().optional(),
});

export async function reviewDeposit(
  depositId: number,
  data: z.infer<typeof reviewDepositSchema>
): Promise<{ success: boolean } | { error: string }> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return { error: "Unauthorized" };

  const parsed = reviewDepositSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid review data" };
  const { status, fundId, rejectionReason } = parsed.data;

  try {
    let originalUserId = "";
    let depositAmount = "";
    await db.transaction(async (tx) => {
      const [depositRequest] = await tx
        .select()
        .from(deposits)
        .where(eq(deposits.id, depositId))
        .for("update");

      if (!depositRequest) throw new Error("Deposit request not found");
      if (depositRequest.status !== "pending")
        throw new Error(`Deposit request is already ${depositRequest.status}.`);

      // Store necessary data for the notification before the transaction completes
      originalUserId = depositRequest.userId;
      depositAmount = depositRequest.amount;

      if (status === "verified") {
        if (!fundId) throw new Error("Fund ID is required for verification.");
        const [targetFund] = await tx
          .select()
          .from(funds)
          .where(eq(funds.id, fundId))
          .for("update");
        if (!targetFund) throw new Error("Selected fund not found.");

        const amountToDeposit = Number(depositRequest.amount);
        const newFundBalance = Number(targetFund.balance) + amountToDeposit;

        await tx
          .update(funds)
          .set({ balance: newFundBalance.toFixed(2) })
          .where(eq(funds.id, fundId));
        await tx
          .update(deposits)
          .set({
            status: "verified",
            updatedBy: user.id, // FIX: Use the updatedBy column from schema
            updatedAt: new Date(),
            fundId,
          })
          .where(eq(deposits.id, depositId));
      } else if (status === "rejected") {
        await tx
          .update(deposits)
          .set({
            status: "rejected",
            updatedBy: user.id, // FIX: Use the updatedBy column
            updatedAt: new Date(),
            note: rejectionReason || null,
          })
          .where(eq(deposits.id, depositId));
      }
    });

    // The transaction has completed successfully. Now, trigger the notification.
    await sendDepositReviewNotification(
      depositId.toString(),
      user.id,
      originalUserId,
      status,
      Number(depositAmount),
      rejectionReason
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error reviewing deposit:", error);
    return { error: error.message || "Failed to update deposit status" };
  }
}
