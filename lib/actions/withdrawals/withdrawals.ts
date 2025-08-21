// lib/actions/withdrawals/withdrawals.ts

"use server";

import { db } from "@/lib/db";

import { withdrawals, funds, users, personalInfo } from "@/db/schema";

import { eq, and, desc, gte, lte } from "drizzle-orm";

import { z } from "zod";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { FullWithdrawal, Withdrawal, Fund } from "@/types"; // Import your base types

import { parseISO } from "date-fns";
import {
  sendWithdrawalReviewNotification,
  sendWithdrawalSubmittedNotification,
} from "../notifications/withdrawalNotifications";

const requestWithdrawalSchema = z.object({
  userId: z.string().min(1),

  amount: z.number().positive(),

  purpose: z

    .string()

    .min(1)

    .max(100, "Purpose must be 100 characters or less."),

  details: z.string().optional(),

  imageUrl: z.string().url().optional().nullable(),
});

const reviewWithdrawalSchema = z.object({
  status: z.enum(["approved", "rejected"]),

  fundId: z.number().optional(),

  rejectionReason: z.string().optional(),

  reviewedBy: z.string().min(1),
});

const filterSchema = z.object({
  status: z.string().optional(),

  startDate: z.string().optional(),

  endDate: z.string().optional(),
});

export async function getWithdrawalData(): Promise<
  { withdrawals: FullWithdrawal[]; funds: Fund[] } | { error: string }
> {
  try {
    const allWithdrawals = await db

      .select({
        id: withdrawals.id,

        userId: withdrawals.userId,

        amount: withdrawals.amount,

        purpose: withdrawals.purpose,

        details: withdrawals.details,

        status: withdrawals.status,

        attachmentUrl: withdrawals.attachmentUrl,

        fundId: withdrawals.fundId,

        reviewedBy: withdrawals.reviewedBy,

        reviewedAt: withdrawals.reviewedAt,

        createdAt: withdrawals.createdAt,

        rejectionReason: withdrawals.rejectionReason,

        user: {
          id: users.id,

          name: users.name,

          email: users.email,

          mobile: personalInfo.mobile,

          picture: users.picture,
        },
      })

      .from(withdrawals)

      .leftJoin(users, eq(withdrawals.userId, users.id))

      .leftJoin(personalInfo, eq(withdrawals.userId, personalInfo.userId))

      .orderBy(desc(withdrawals.createdAt));

    const fundsList = await db

      .select()

      .from(funds)

      .where(eq(funds.deleted, false));

    const typedWithdrawals: FullWithdrawal[] = allWithdrawals.map((w) => ({
      ...w,

      amount: w.amount,

      status: w.status as "pending" | "approved" | "rejected",

      user: {
        id: w.user?.id || "N/A",

        name: w.user?.name || "N/A",

        email: w.user?.email || "N/A",

        mobile: w.user?.mobile || null,

        picture: w.user?.picture || null,
      },
    }));

    return { withdrawals: typedWithdrawals, funds: fundsList as Fund[] };
  } catch (error) {
    console.error("Error fetching withdrawal data:", error);

    return { error: "Failed to fetch withdrawal data" };
  }
}

/**

* Fetches all withdrawals with user details and funds.

*/

export async function getAllWithdrawals(
  filters: z.infer<typeof filterSchema>
): Promise<{ withdrawals: FullWithdrawal[] } | { error: string }> {
  try {
    const conditions = [];

    const { status, startDate, endDate } = filters;

    if (status && status !== "all") {
      conditions.push(eq(withdrawals.status, status as any));
    }

    if (startDate && endDate) {
      const parsedStartDate = parseISO(startDate);

      const parsedEndDate = parseISO(endDate);

      conditions.push(gte(withdrawals.createdAt, parsedStartDate));

      conditions.push(lte(withdrawals.createdAt, endOfDay(parsedEndDate)));
    } else if (startDate) {
      conditions.push(gte(withdrawals.createdAt, parseISO(startDate)));
    } else if (endDate) {
      conditions.push(lte(withdrawals.createdAt, endOfDay(parseISO(endDate))));
    }

    const allWithdrawals = await db

      .select({
        id: withdrawals.id,

        userId: withdrawals.userId,

        amount: withdrawals.amount,

        purpose: withdrawals.purpose,

        details: withdrawals.details,

        status: withdrawals.status,

        attachmentUrl: withdrawals.attachmentUrl,

        fundId: withdrawals.fundId,

        reviewedBy: withdrawals.reviewedBy,

        reviewedAt: withdrawals.reviewedAt,

        createdAt: withdrawals.createdAt,

        rejectionReason: withdrawals.rejectionReason,

        user: {
          id: users.id,

          name: users.name,

          email: users.email,

          mobile: personalInfo.mobile,

          picture: users.picture,
        },
      })

      .from(withdrawals)

      .leftJoin(users, eq(withdrawals.userId, users.id))

      .leftJoin(personalInfo, eq(withdrawals.userId, personalInfo.userId))

      .where(and(...conditions))

      .orderBy(desc(withdrawals.createdAt));

    const typedWithdrawals: FullWithdrawal[] = allWithdrawals.map((w) => ({
      id: w.id,

      userId: w.userId,

      amount: w.amount,

      purpose: w.purpose,

      details: w.details,

      status: w.status as "pending" | "approved" | "rejected",

      attachmentUrl: w.attachmentUrl,

      fundId: w.fundId,

      reviewedBy: w.reviewedBy,

      reviewedAt: w.reviewedAt,

      createdAt: w.createdAt,

      rejectionReason: w.rejectionReason,

      user: {
        id: w.user?.id || "N/A",

        name: w.user?.name || "N/A",

        email: w.user?.email || "N/A",

        mobile: w.user?.mobile || null,

        picture: w.user?.picture || null,
      },
    }));

    return { withdrawals: typedWithdrawals };
  } catch (error) {
    console.error("Error fetching withdrawal data:", error);

    return { error: "Failed to fetch withdrawal data" };
  }
}

function endOfDay(date: Date): Date {
  const d = new Date(date);

  d.setHours(23, 59, 59, 999);

  return d;
}

/**

* Requests a new withdrawal.

*/

export async function requestWithdrawal(
  data: z.infer<typeof requestWithdrawalSchema>
): Promise<{ success: boolean } | { error: string }> {
  const { getUser } = getKindeServerSession();

  const user = await getUser();

  if (!user?.id) return { error: "Unauthorized" };

  const parsed = requestWithdrawalSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid withdrawal data" };
  }

  try {
    const [newWithdrawal] = await db
      .insert(withdrawals)
      .values({
        userId: user.id,

        amount: parsed.data.amount.toString(),

        purpose: parsed.data.purpose,

        details: parsed.data.details || null,

        attachmentUrl: parsed.data.imageUrl || null,

        status: "pending",
      })
      .returning({ id: withdrawals.id });
    // Trigger notification to managers
    await sendWithdrawalSubmittedNotification(
      newWithdrawal.id.toString(),
      user.id,
      parsed.data.amount,
      parsed.data.purpose
    );

    return { success: true };
  } catch (error) {
    console.error("Error requesting withdrawal:", error);

    return { error: "Failed to submit withdrawal request" };
  }
}

/**

* Reviews a pending withdrawal request.

*/

export async function reviewWithdrawal(
  withdrawalId: number,

  data: z.infer<typeof reviewWithdrawalSchema>
): Promise<{ success: boolean } | { error: string }> {
  const { getUser } = getKindeServerSession();

  const user = await getUser();

  if (!user?.id) return { error: "Unauthorized" };

  const parsed = reviewWithdrawalSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid review data" };
  }

  const { status, fundId, rejectionReason } = parsed.data;

  try {
    let originalUserId = "";
    let withdrawalAmount = "";

    await db.transaction(async (tx) => {
      const [withdrawalRequest] = await tx

        .select()

        .from(withdrawals)

        .where(eq(withdrawals.id, withdrawalId))

        .for("update");

      if (!withdrawalRequest) throw new Error("Withdrawal request not found");

      if (withdrawalRequest.status !== "pending")
        throw new Error(
          `Withdrawal request is already ${withdrawalRequest.status}.`
        );
      originalUserId = withdrawalRequest.userId;
      withdrawalAmount = withdrawalRequest.amount;

      if (status === "approved") {
        if (!fundId) throw new Error("Fund ID is required for approval.");

        const amountToWithdraw = Number(withdrawalRequest.amount);

        const [targetFund] = await tx

          .select()
          .from(funds)
          .where(eq(funds.id, fundId))
          .for("update");

        if (!targetFund) throw new Error("Selected fund not found.");

        if (Number(targetFund.balance) < amountToWithdraw)
          throw new Error("Insufficient funds in the selected fund.");

        const newFundBalance = Number(targetFund.balance) - amountToWithdraw;

        await tx
          .update(funds)
          .set({ balance: newFundBalance.toFixed(2) })
          .where(eq(funds.id, fundId));

        await tx
          .update(withdrawals)
          .set({
            status: "approved",
            reviewedBy: user.id,
            reviewedAt: new Date(),
            fundId,
          })
          .where(eq(withdrawals.id, withdrawalId));
      } else if (status === "rejected") {
        await tx
          .update(withdrawals)
          .set({
            status: "rejected",
            rejectionReason: rejectionReason || null,
            reviewedBy: user.id,
            reviewedAt: new Date(),
          })
          .where(eq(withdrawals.id, withdrawalId));
      }
    });
    // Trigger notification to the user who requested the withdrawal
    await sendWithdrawalReviewNotification(
      withdrawalId.toString(),
      user.id,
      originalUserId,
      status,
      Number(withdrawalAmount)
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error updating withdrawal status:", error);

    return { error: error.message || "Failed to update withdrawal status" };
  }
}
