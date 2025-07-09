import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { personalInfo } from "@/db/schema";

const schema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  father: z.string().optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  profession: z.string().optional(),
  religion: z.string().optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  mobile: z.string().optional(),
  nidNumber: z.string().optional(),
  nidFront: z.string().optional(),
  nidBack: z.string().optional(),
  signature: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(personalInfo)
      .where(eq(personalInfo.userId, user.id));

    if (existing.length === 0) {
      // First-time insert
      await db
        .insert(personalInfo)
        .values({ userId: user.id, ...validation.data });
      return NextResponse.json({
        success: true,
        message: "Inserted new record",
      });
    } else {
      // Update only fields which are null
      const current = existing[0];
      const updatable: any = {};
      type FormData = typeof validation.data;
      const keys = Object.keys(validation.data) as Array<keyof FormData>;

      for (const key of keys) {
        if (
          validation.data[key] !== undefined &&
          ((current as any)[key] == null || (current as any)[key] == "")
        ) {
          updatable[key] = validation.data[key];
        }
      }

      if (Object.keys(updatable).length === 0) {
        return NextResponse.json(
          { error: "No updatable fields (already filled)" },
          { status: 400 }
        );
      }

      await db
        .update(personalInfo)
        .set(updatable)
        .where(eq(personalInfo.userId, user.id));
      return NextResponse.json({
        success: true,
        message: "Updated partial fields",
      });
    }
  } catch (error) {
    console.error("[PERSONAL_INFO_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select()
    .from(personalInfo)
    .where(eq(personalInfo.userId, user.id));

  return NextResponse.json({
    personalInfo: existing && existing.length ? existing[0] : null,
  });
}
// Admin-only position update
export async function PATCH(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Add admin check here

    const { userId, newPosition } = await req.json();

    await db
      .update(personalInfo)
      .set({ position: newPosition })
      .where(eq(personalInfo.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POSITION_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
