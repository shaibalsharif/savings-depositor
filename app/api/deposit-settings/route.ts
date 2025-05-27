import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { depositSettings, logs } from "@/db/schema/logs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq, and, sql, desc } from "drizzle-orm";

// GET: Get all settings (latest first)
export async function GET() {
  const data = await db.select().from(depositSettings).orderBy(desc(depositSettings.createdAt));
  return NextResponse.json({ settings: data });
}

// POST: Add new setting (check if effectiveMonth is not in the past or current if deposits exist)
export async function POST(request: Request) {
  const { monthlyAmount, dueDay, reminderDay, effectiveMonth } = await request.json();
  if (!monthlyAmount || !dueDay || !reminderDay || !effectiveMonth) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if any deposits exist for the effectiveMonth or earlier
  // (Assuming you have a deposits table with `month` field)
  const depositsExist = await db.select()
    .from(depositSettings)
    .where(sql`${depositSettings.effectiveMonth} <= ${effectiveMonth}`)
    .then(res => res.length > 0);
  // If you want to check deposits, use this:
  // const depositsExist = await db.select()
  //   .from(deposits)
  //   .where(sql`${deposits.month} <= ${effectiveMonth}`)
  //   .then(res => res.length > 0);

  if (depositsExist) {
    return NextResponse.json(
      { error: "Cannot set a new deposit amount for a month that already has deposits" },
      { status: 400 }
    );
  }

  const [newSetting] = await db.insert(depositSettings).values({
    monthlyAmount,
    dueDay,
    reminderDay,
    effectiveMonth,
    createdBy: user.email,
  }).returning();

  await db.insert(logs).values({
    userEmail: user.email,
    action: "create_deposit_setting",
    details: JSON.stringify({ monthlyAmount, dueDay, reminderDay, effectiveMonth }),
  });

  return NextResponse.json({ setting: newSetting });
}
