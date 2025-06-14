import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { desc, eq, and, isNull, or, lt } from "drizzle-orm";
import { deposits, depositSettings, logs } from "@/db/schema/logs";
import { format, startOfMonth, addMonths } from "date-fns";

function checkAdminOrManager(permissions: string[]) {
  return permissions.includes("admin") || permissions.includes("manager");
}
export async function GET() {
  const { getUser, getPermissions } = getKindeServerSession();
  const user = await getUser();
  const permissions = (await getPermissions()) || { permissions: [] };

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkAdminOrManager(permissions.permissions)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const today = new Date();
    const currentMonth = format(startOfMonth(today), "yyyy-MM");

    // Fetch all settings ordered by effectiveMonth ascending
    const allSettings = await db
      .select()
      .from(depositSettings)
      .orderBy(depositSettings.effectiveMonth);

    // Find current setting: latest effectiveMonth <= currentMonth
    let currentSetting = null;
    for (const setting of allSettings) {
      if (setting.effectiveMonth <= currentMonth) {
        currentSetting = setting;
      } else {
        break;
      }
    }

    // Upcoming settings: effectiveMonth > currentMonth
    const upcomingSettings = allSettings.filter(
      (s) => s.effectiveMonth > currentMonth
    );

    return NextResponse.json({ currentSetting, upcomingSettings });
  } catch (error) {
    console.error("Error fetching deposit settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit settings" },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  const { getUser, getPermissions } = getKindeServerSession();
  const user = await getUser();
  const permissions = (await getPermissions()) || { permissions: [] };

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkAdminOrManager(permissions.permissions)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { monthlyAmount, dueDay, reminderDay, effectiveMonth } =
    await request.json();

  if (!monthlyAmount || !dueDay || !reminderDay || !effectiveMonth) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // Validate effectiveMonth: must be current month or next month only
  const today = new Date();
  const currentMonthStr = format(startOfMonth(today), "yyyy-MM");
  const nextMonthStr = format(startOfMonth(addMonths(today, 1)), "yyyy-MM");

  if (effectiveMonth !== currentMonthStr && effectiveMonth !== nextMonthStr) {
    return NextResponse.json(
      { error: "Effective month must be current or next month only" },
      { status: 400 }
    );
  }

  // Check if current month deposit exists (simulate your logic here)
  // For example, check deposits table if deposit exists for current month
  // If deposit exists for current month, disallow creating setting for current month
  if (effectiveMonth === currentMonthStr) {
    const existingDeposit = await db
      .select()
      .from(deposits)
      .where(
        and(eq(deposits.userId, user.id), eq(deposits.month, currentMonthStr))
      )
      .limit(1);

    if (existingDeposit.length > 0) {
      return NextResponse.json(
        {
          error:
            "Deposit for current month already exists. You can only set for next month.",
        },
        { status: 400 }
      );
    }
  }

  // Update previous setting's terminatedAt field if exists
  // Find latest setting with terminatedAt = null and effectiveMonth < new effectiveMonth
  const previousSetting = await db
    .select()
    .from(depositSettings)
    .where(
      and(
        eq(depositSettings.createdBy, user.id),
        isNull(depositSettings.terminatedAt),
        lt(depositSettings.effectiveMonth, effectiveMonth)
      )
    )
    .orderBy(desc(depositSettings.effectiveMonth))
    .limit(1);

  if (previousSetting.length > 0) {
    await db
      .update(depositSettings)
      .set({ terminatedAt: effectiveMonth })
      .where(eq(depositSettings.id, previousSetting[0].id));
  }

  // Insert new setting
  const [newSetting] = await db
    .insert(depositSettings)
    .values({
      monthlyAmount,
      dueDay,
      reminderDay,
      effectiveMonth,
      terminatedAt: null,
      createdBy: user.id,
    })
    .returning();

  // Log the action
  await db.insert(logs).values({
    userId: user.id,
    action: "create_deposit_setting",
    details: JSON.stringify({
      monthlyAmount,
      dueDay,
      reminderDay,
      effectiveMonth,
    }),
  });

  return NextResponse.json({ setting: newSetting });
}
