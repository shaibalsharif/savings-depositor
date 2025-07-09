import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your Drizzle instance
import { withdrawals, personalInfo } from "@/db/schema";
import { and, eq, desc, sql, gte, lte, isNotNull } from "drizzle-orm";

import { z } from "zod";
import { getKindeManagementToken } from "@/lib/kinde-management";
import {
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
} from "date-fns";

// Define an interface for the user details you expect from Kinde Auth
interface KindeUser {
  id: string; // This should match the userId from your withdrawals
  username: string;
  email: string;
  // Add any other user details you might need
}

// Define an interface for the augmented withdrawal data,
// which will include username and email
interface Withdrawal {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
  amount: string | number;
  purpose: string;
  details: string;
  attachmentUrl: string;
  // Add other fields from your 'withdrawals' schema here
  // For example: amount: number; currency: string;
}

interface AugmentedWithdrawal extends Withdrawal {
  username?: string; // Optional, in case user details aren't found
  email?: string; // Optional, in case user details aren't found
}

async function fetchKindeUserDetails(
  userIds: string[]
): Promise<Map<string, KindeUser>> {
  const userDetailsMap = new Map<string, KindeUser>();

  // Obtain the Kinde Management API token
  const token = await getKindeManagementToken();

  // Use Promise.all to fetch user details concurrently for better performance
  const fetchPromises = userIds.map(async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch Kinde user ${id}: ${response.status} ${response.statusText}`
        );
        // If the user is not found or an error occurs, we just skip this user
        return null;
      }

      const userData = await response.json();

      // Kinde API response structure might vary slightly.
      // Adjust 'username' and 'email' mapping based on your Kinde user data.
      // For example, Kinde might provide 'given_name' and 'family_name'.
      if (userData) {
        userDetailsMap.set(id, {
          id: userData.id,
          username:
            userData.username ||
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
          email: userData.preferred_email,
        });
      } else {
        console.warn(`Kinde user data for ID ${id} not found or malformed.`);
      }
    } catch (error) {
      console.error(`Error fetching Kinde user ${id}:`, error);
      // Continue processing other users even if one fails
    }
    return null; // Return null as we are populating the map directly
  });

  // Wait for all fetch operations to complete
  await Promise.all(fetchPromises);

  return userDetailsMap;
}

// Zod validation schema
const withdrawalSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive(),
  purpose: z.string().min(1),
  details: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  status: z.string(),
});

const filterSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate input
  const parsed = withdrawalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Insert deposit
  await db.insert(withdrawals).values({
    userId: body.userId,
    amount: body.amount,
    purpose: body.purpose,
    details: body.details,
    attachmentUrl: body.imageUrl,
    status: body.status,
    fundId: null,
  });

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status"); // 'all', 'pending', 'approved', 'rejected'
    const monthFilter = searchParams.get("month"); // e.g., "2025-06"
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10); // For offset-based pagination

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 }
      );
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset parameter" },
        { status: 400 }
      );
    }

    const conditions = [];

    // Status filter
    if (status && status !== "all") {
      conditions.push(eq(withdrawals.status, status));
    } else {
      // If status is 'all' or not provided, ensure we don't fetch null statuses (though unlikely)
      conditions.push(isNotNull(withdrawals.status));
    }

    // Date range filtering
    if (startDate && endDate) {
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start or end date format. Use YYYY-MM-DD." },
          { status: 400 }
        );
      }
      conditions.push(gte(withdrawals.createdAt, parsedStartDate));
      // End date includes the whole day
      conditions.push(lte(withdrawals.createdAt, endOfDay(parsedEndDate)));
    } else if (monthFilter && monthFilter !== "all") {
      // Filter by month (e.g., "2025-06")
      // We'll treat `createdAt` as a timestamp without timezone for this comparison
      // Drizzle's `sql.raw` or `sql.placeholder` for date extraction might be needed for perfect match
      // For simplicity and common use, let's derive start/end of month
      try {
        const [yearStr, monthStr] = monthFilter.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed for Date constructor
        const dateInMonth = new Date(year, month, 1);

        const startOfM = startOfMonth(dateInMonth);
        const endOfM = endOfMonth(dateInMonth);

        conditions.push(gte(withdrawals.createdAt, startOfM));
        conditions.push(lte(withdrawals.createdAt, endOfM));
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid month format. Use YYYY-MM." },
          { status: 400 }
        );
      }
    }

    // Fetch withdrawals with user info
    const allWithdrawals = await db
      .select()
      .from(withdrawals)
      .leftJoin(personalInfo, eq(withdrawals.userId, personalInfo.userId)) // Join to get user details
      .where(and(...conditions))
      .orderBy(desc(withdrawals.createdAt)) // Order by most recent first
      .limit(limit)
      .offset(offset);

    // To get the total count for pagination
    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(and(...conditions));

    const totalWithdrawals = totalCountResult.count;

    // Map the results to combine withdrawal and user info
    const data = allWithdrawals.map((row) => ({
      ...row.withdrawals,
      // Include user details directly if they exist
      user: row.personal_info
        ? {
            id: row.personal_info.userId,
            name: row.personal_info.name,
            mobile: row.personal_info.mobile,
            // Add other personal_info fields you want to expose
          }
        : null,
      // Kinde user details would typically be fetched separately on the frontend
      // based on the userId if needed for profile pictures etc.
    }));

    return NextResponse.json(
      {
        data,
        total: totalWithdrawals,
        limit,
        offset,
        hasMore: offset + limit < totalWithdrawals,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get end of day (inclusive)
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
