import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod";
import { nomineeInfo } from "@/db/schema/logs";
import { eq } from "drizzle-orm";

const schema = z.object({
  name: z.string().min(3),
  relation: z.string().min(2),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mobile: z.string().min(11),
  nidNumber: z.string().length(17),
  address: z.string().min(5),
  photo: z.string().url()
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
      .from(nomineeInfo)
      .where(eq(nomineeInfo.userId, user.id));

    if (existing.length > 0) {
      return NextResponse.json({ error: "Nominee info already submitted" }, { status: 400 });
    }

    // Create new record
    await db.insert(nomineeInfo).values({
      userId: user.id,
      ...validation.data
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[NOMINEE_INFO_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
