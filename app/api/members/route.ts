import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { personalInfo, nomineeInfo } from "@/db/schema";
import { createKindeUser, getKindeUserByEmail } from "@/lib/kinde-mgmt";
import { appendRow } from "@/lib/sheets";
import { sendInvitationEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    // Check if user is manager (optional, but good practice)
    // For now, we assume if they can access the dashboard, they are authorized
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      email, 
      name, 
      nameBn, 
      depositStartDate, 
      mobile,
      position = "member",
      // optional fields
      father = "",
      mother = "",
      dob = "1990-01-01",
      profession = "Private Service",
      religion = "Islam",
      presentAddress = "",
      permanentAddress = "",
      nidNumber = ""
    } = body;

    if (!email || !name || !depositStartDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if email already exists in our DB
    const existing = await db.select().from(personalInfo).where(eq(personalInfo.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Member with this email already exists" }, { status: 409 });
    }

    // 2. Kinde Sync: Try to find existing Kinde user first, otherwise create
    let kindeUser = await getKindeUserByEmail(email);
    if (!kindeUser) {
      console.log(`[API/Members] Creating new Kinde user for ${email}`);
      const names = name.split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ") || "";
      kindeUser = await createKindeUser({
        email,
        first_name: firstName,
        last_name: lastName,
      });
    } else {
      console.log(`[API/Members] Found existing Kinde user ${kindeUser.id} for ${email}`);
    }

    const userId = kindeUser.id;

    // 3. Google Sheets Sync: Append row to "Members"
    // Row mapping: User ID, Full Name, Name (Bengali), Mobile, Position, Date of Birth, Profession, Religion, NID Number, Present Address, Permanent Address
    const rowData = [
      userId,
      name,
      nameBn || "",
      mobile || "",
      position,
      dob,
      profession,
      religion,
      nidNumber,
      presentAddress,
      permanentAddress
    ];

    let sheetsRowIndex: number | null = null;
    try {
      sheetsRowIndex = await appendRow("Members", rowData);
    } catch (sheetErr) {
      console.error("[API/Members] Google Sheets sync failed:", sheetErr);
      // We continue even if sheet sync fails, but log it
    }

    // 4. Neon DB Sync: Insert into personal_info
    await db.insert(personalInfo).values({
      userId,
      name,
      nameBn: nameBn || "",
      father,
      mother,
      dob,
      profession,
      religion,
      presentAddress,
      permanentAddress,
      mobile: mobile || "",
      email,
      nidNumber,
      position,
      depositStartDate,
      sheetsRowIndex,
    });

    // 5. Initialize Nominee Info (placeholder)
    await db.insert(nomineeInfo).values({
      userId,
      name: "TBD",
      relation: "TBD",
      mobile: "",
      nidNumber: "",
    });

    // 6. Send Invitation Email if invite_link is present
    let emailStatus = { success: true };
    if (kindeUser.invite_link) {
      console.log(`[API/Members] Sending invitation email to ${email}`);
      const firstName = name.split(" ")[0];
      const result = await sendInvitationEmail({
        email,
        firstName,
        inviteLink: kindeUser.invite_link,
      });
      emailStatus = result;
      if (!result.success) {
        console.error("[API/Members] Email sending failed:", result.error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      userId, 
      sheetsRowIndex,
      invited: !!kindeUser.invite_link,
      emailStatus
    });

  } catch (err: any) {
    console.error("[API/Members] Error adding member:", err);
    return NextResponse.json({ error: err.message || "Failed to add member" }, { status: 500 });
  }
}
