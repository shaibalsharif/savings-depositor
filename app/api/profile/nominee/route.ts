// /api/profile/nominee/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { nomineeInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  mobile: z.string().optional(),
  nidNumber: z.string().optional(),
  address: z.string().optional(),
  photo: z.string().optional(),
});

export async function GET() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select()
    .from(nomineeInfo)
    .where(eq(nomineeInfo.userId, user.id));

  return NextResponse.json({
    nomineeInfo: existing && existing.length ? existing[0] : null,
  });
}

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const validation = schema.safeParse(body);
    if (!validation.success) {
      console.log(validation.error);

      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(nomineeInfo)
      .where(eq(nomineeInfo.userId, user.id));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Nominee info already submitted" },
        { status: 400 }
      );
    }
    if (existing.length === 0) {
      // First-time insert
      const {
        name = "",
        relation = "",
        dob = "",
        mobile = "",
        nidNumber = "",
        address = "",
        photo = "",
      } = validation.data;

      await db.insert(nomineeInfo).values({
        userId: user.id,
        name,
        relation,
        dob: dob,
        mobile,
        nidNumber,
        address,
        photo,
      });

      return NextResponse.json({
        success: true,
        message: "Inserted nominee record",
      });
    } else {
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
        .update(nomineeInfo)
        .set(updatable)
        .where(eq(nomineeInfo.userId, user.id));
      return NextResponse.json({
        success: true,
        message: "Updated nominee info",
      });
    }
  } catch (error) {
    console.error("[NOMINEE_INFO_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
