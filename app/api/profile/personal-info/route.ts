import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { personalInfo } from "@/db/schema/logs";

const schema = z.object({
  name: z.string().min(3),
  nameBn: z.string().min(3),
  father: z.string().min(3),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  profession: z.string().min(2),
  religion: z.string().min(2),
  presentAddress: z.string().min(5),
  permanentAddress: z.string().min(5),
  mobile: z.string().min(11),
  nidNumber: z.string().length(17),
  nidFront: z.string().url(),
  nidBack: z.string().url(),
  signature: z.string().url(),
  photo: z.string().url(),
  position: z.enum(["president", "gs", "os", "fs", "member"])
});

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    // Check existing data
    const existing = await db
      .select()
      .from(personalInfo)
      .where(eq(personalInfo.userId, user.id));

    if (existing.length > 0) {
      return NextResponse.json({ error: "Personal info already submitted" }, { status: 400 });
    }

    // Create new record
    await db.insert(personalInfo).values({
      userId: user.id,
      ...validation.data
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[PERSONAL_INFO_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin-only position update
export async function PATCH(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Add admin check here

    const { userId, newPosition } = await req.json();
    
    await db
      .update(personalInfo)
      .set({ position: newPosition })
      .where(eq(personalInfo.userId, userId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[POSITION_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
