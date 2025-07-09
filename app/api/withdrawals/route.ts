import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your Drizzle instance
import { withdrawals } from "@/db/schema";
import { and, eq, like, desc, sql, gte, lte, not } from "drizzle-orm";
import { z } from "zod";
import { getKindeManagementToken } from "@/lib/kinde-management";

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
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const filters = filterSchema.parse({
    id: searchParams.get("userId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });

  // Build query conditions
  let conditions = [];
  if (filters.id) conditions.push(eq(withdrawals.userId, filters.id));
  if (filters.status && filters.status !== "all")
    conditions.push(eq(withdrawals.status, filters.status));

  if (filters.startDate && filters.endDate) {
    conditions.push(
      and(
        gte(withdrawals.createdAt, new Date(filters.startDate)),
        lte(withdrawals.createdAt, new Date(filters.endDate))
      )
    );
  } else if (filters.startDate)
    conditions.push(gte(withdrawals.createdAt, new Date(filters.startDate)));
  else if (filters.endDate)
    conditions.push(lte(withdrawals.createdAt, new Date(filters.endDate)));

  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");
  // Execute query
  const data = await db
    .select()
    .from(withdrawals)
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${withdrawals.createdAt} DESC`);

  // Extract all unique user IDs from the fetched withdrawal data
  const uniqueUserIds = [...new Set(data.map((item) => item.userId))];

  const kindeUserDetailsMap = await fetchKindeUserDetails(uniqueUserIds);

  const augmentedData = data.map((withdrawal) => {
    const userDetails = kindeUserDetailsMap.get(withdrawal.userId);

    return {
      ...withdrawal,
      username: userDetails?.username, // Add username if found
      email: userDetails?.email, // Add email if found
    };
  });

  return NextResponse.json({ data: augmentedData });
}
