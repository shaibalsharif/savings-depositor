import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { personalInfo, nomineeInfo } from "@/db/schema";
import { getKindeUserByEmail } from "@/lib/kinde-mgmt";
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

    // 1. Check if user exists in Kinde (Manual Add requirement)
    const kindeUser = await getKindeUserByEmail(email);
    
    if (!kindeUser) {
      return NextResponse.json({ 
        error: "Member not found in Kinde. Please add this user to your Kinde Dashboard first so they can sign in." 
      }, { status: 404 });
    }

    const userId = kindeUser.id;

    // 2. Add to Google Sheets
    let sheetsRowIndex: number | null = null;
    try {
      const { appendRow } = await import("@/lib/sheets");
      
      // Row mapping: User ID, Full Name, Name (Bengali), Mobile, Position, Date of Birth, Profession, Religion, NID Number, Present Address, Permanent Address, Email
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
        permanentAddress,
        email
      ];

      sheetsRowIndex = await appendRow("Members", rowData);
    } catch (err) {
      console.error("Failed to sync to Google Sheets:", err);
    }

    // 3. Database Insert (Personal Info)
    await db.insert(personalInfo).values({
      userId,
      name,
      nameBn: nameBn || "",
      father: father || "",
      mother: mother || "",
      dob: dob || "1990-01-01",
      profession: profession || "Private Service",
      religion: religion || "Islam",
      presentAddress: presentAddress || "",
      permanentAddress: permanentAddress || "",
      mobile: mobile || "",
      email,
      nidNumber: nidNumber || "",
      position: position as any || "member",
      depositStartDate,
      sheetsRowIndex,
    });

    // 4. Database Insert (Nominee Info)
    if (nominee) {
      await db.insert(nomineeInfo).values({
        userId,
        name: nominee.name || "",
        relation: nominee.relation || "",
        mobile: nominee.mobile || "",
        email: nominee.email || "",
        nidNumber: nominee.nidNumber || "",
      });
    }

    // 5. Initial Dues Calculation
    const { createInitialDues } = await import("@/lib/queries/deposits");
    await createInitialDues(userId, depositStartDate);

    return NextResponse.json({ 
      success: true, 
      userId, 
      sheetsRowIndex,
      status: kindeUser.status
    });

  } catch (err: any) {
    console.error("[API/Members] Error adding member:", err);
    return NextResponse.json({ error: err.message || "Failed to add member" }, { status: 500 });
  }
}
