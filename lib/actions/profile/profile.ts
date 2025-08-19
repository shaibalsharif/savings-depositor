// lib/actions/profile.ts
"use server";

import { db } from "@/lib/db";
import { users, personalInfo, nomineeInfo } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getKindeManagementToken } from "@/lib/kinde-management";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { sql } from "drizzle-orm";

const utapi = new UTApi();

export interface PersonalInfoData {
  id?: number;
  name: string | null;
  nameBn: string | null;
  father: string | null;
  dob: string | null;
  profession: string | null;
  religion: string | null;
  presentAddress: string | null;
  permanentAddress: string | null;
  mobile: string | null;
  nidNumber: string | null;
  nidFront: string | null;
  nidBack: string | null;
  signature: string | null;
  position: string | null;
}

export interface NomineeInfoData {
  id?: number;
  name: string | null;
  relation: string | null;
  dob: string | null;
  mobile: string | null;
  nidNumber: string | null;
  address: string | null;
  photo: string | null;
}

export interface KindeUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  picture: string | null;
  username: string | null;
  permissions: string[];
  status: "active" | "archived";
}

const updateUserSchema = z.object({
  given_name: z.string().min(1, "First name is required"),
  family_name: z.string().min(1, "Last name is required"),
  picture: z.string().optional().nullable(),
});

// FIX: Add nullable() to the schema to correctly handle null values from the form
const personalInfoSchema = z.object({
  name: z.string().nullable().optional(),
  nameBn: z.string().nullable().optional(),
  father: z.string().nullable().optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  profession: z.string().nullable().optional(),
  religion: z.string().nullable().optional(),
  presentAddress: z.string().nullable().optional(),
  permanentAddress: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  nidNumber: z.string().nullable().optional(),
  nidFront: z.string().nullable().optional(),
  nidBack: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
});

const nomineeSchema = z.object({
  name: z.string().nullable().optional(),
  relation: z.string().nullable().optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  mobile: z.string().nullable().optional(),
  nidNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

// Helper function to delete old image from UploadThing
async function deleteOldImage(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "uploadthing.com") {
      const fileKey = parsedUrl.pathname.split("/").pop() || "";
      await utapi.deleteFiles(fileKey);
    }
  } catch (error) {
    console.error("Failed to delete old image from UploadThing:", error);
  }
}

export async function fetchUserPersonalDetails(userId: string) {
  try {
    const [details] = await db
      .select()
      .from(personalInfo)
      .where(eq(personalInfo.userId, userId));
    return {
      phone: details?.mobile || null,
    };
  } catch (error) {
    console.error("Error fetching user personal details:", error);
    return { phone: null };
  }
}

// User Tab Actions
/**
 * Fetches user profile data from Kinde.
 * This function needs to be exported.
 */
/**
 * Fetches user profile data from Kinde.
 */
export async function fetchUserProfile(
  userId: string
): Promise<KindeUser | { error: string }> {
  try {
    const token = await getKindeManagementToken();
    const kindeRes = await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!kindeRes.ok) {
      const error = await kindeRes.json();
      return { error: error.message || "Failed to fetch user profile" };
    }

    // FIX: Access the JSON object directly, as it's a single user.
    const kindeUser = await kindeRes.json();

    // Fetch user details from your personalInfo table
    const personalDetails = await fetchUserPersonalDetails(userId);

    return {
      id: kindeUser.id,
      first_name: kindeUser.first_name,
      last_name: kindeUser.last_name,
      email: kindeUser.email,
      picture: kindeUser.picture || null,
      username: kindeUser.username,
      permissions: kindeUser.permissions,
      status: kindeUser.is_suspended ? "archived" : "active",
      phone: personalDetails.phone || "", // Merged phone from your DB
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { error: "Internal server error" };
  }
}

export async function updateUserTab(
  userId: string,
  formData: z.infer<typeof updateUserSchema>
): Promise<{ user: any } | { error: string }> {
  try {
    const token = await getKindeManagementToken();

    // Fetch current user from Kinde to get the old picture URL
    const kindeUserRes = await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const kindeUser = await kindeUserRes.json();
    const oldPictureUrl = kindeUser.picture;

    // Update Kinde profile
    const updateRes = await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      return { error: errData.message || "Failed to update user in Kinde" };
    }

    // Update your Neon DB 'users' table
    await db
      .update(users)
      .set({
        name: `${formData.given_name} ${formData.family_name}`,
        picture: formData.picture,
      })
      .where(eq(users.id, userId));

    // Delete old image from UploadThing if it has changed
    if (
      formData.picture &&
      oldPictureUrl &&
      oldPictureUrl !== formData.picture
    ) {
      await deleteOldImage(oldPictureUrl);
    }

    return { user: { ...formData, id: userId } };
  } catch (error) {
    console.error("[UPDATE_USER_ERROR]", error);
    return { error: "Internal server error" };
  }
}

// Personal Info Tab Actions

export async function fetchPersonalInfo(
  userId: string
): Promise<{ personalInfo: PersonalInfoData | null } | { error: string }> {
  try {
    const existing = await db
      .select()
      .from(personalInfo)
      .where(eq(personalInfo.userId, userId));
    return { personalInfo: existing[0] || null };
  } catch (error) {
    console.error("[FETCH_PERSONAL_INFO_ERROR]", error);
    return { error: "Failed to fetch personal info" };
  }
}

export async function savePersonalInfo(
  userId: string,
  data: any
): Promise<{ success: boolean } | { error: string }> {
  try {
    const existing = await db
      .select()
      .from(personalInfo)
      .where(eq(personalInfo.userId, userId));
    const updatable: any = {};
    const payload = personalInfoSchema.safeParse(data);

    if (!payload.success) {
      return { error: "Invalid data" };
    }

    if (existing.length === 0) {
      // First-time insert
      await db
        .insert(personalInfo)
        .values({ userId, ...payload.data, position: "member" });
      return { success: true };
    } else {
      // Subsequent partial update
      const current = existing[0];
      const keys = Object.keys(payload.data) as Array<
        keyof typeof payload.data
      >;
      for (const key of keys) {
        if (
          payload.data[key] !== undefined &&
          (current[key] === null || current[key] === "")
        ) {
          updatable[key] = payload.data[key];
        }
      }

      if (Object.keys(updatable).length === 0) {
        return { error: "No updatable fields (already filled)" };
      }

      await db
        .update(personalInfo)
        .set(updatable)
        .where(eq(personalInfo.userId, userId));
      return { success: true };
    }
  } catch (error) {
    console.error("[SAVE_PERSONAL_INFO_ERROR]", error);
    return { error: "Internal server error" };
  }
}

export async function fetchNomineeInfo(
  userId: string
): Promise<{ nomineeInfo: NomineeInfoData | null } | { error: string }> {
  try {
    const existing = await db
      .select()
      .from(nomineeInfo)
      .where(eq(nomineeInfo.userId, userId));
    return { nomineeInfo: existing[0] || null };
  } catch (error) {
    console.error("[FETCH_NOMINEE_INFO_ERROR]", error);
    return { error: "Failed to fetch nominee info" };
  }
}

export async function saveNomineeInfo(
  userId: string,
  data: Partial<NomineeInfoData>
): Promise<{ success: boolean } | { error: string }> {
  try {
    const existing = await db
      .select()
      .from(nomineeInfo)
      .where(eq(nomineeInfo.userId, userId));

    const payload = nomineeSchema.safeParse(data);

    if (!payload.success) {
      return { error: "Invalid data" };
    }

    if (existing.length === 0) {
      // First-time insert
      await db.insert(nomineeInfo).values({ userId, ...payload.data });
      return { success: true };
    } else {
      // Subsequent partial update
      const current = existing[0];
      const updatable: any = {};
      const keys = Object.keys(payload.data) as Array<
        keyof typeof payload.data
      >;

      let hasChanges = false;
      for (const key of keys) {
        const value = payload.data[key];
        const currentValue = current[key];

        // Check if the field is being updated and it's currently null or empty
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (currentValue === null || currentValue === "")
        ) {
          updatable[key] = value;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        return { error: "No changes to save or fields are already filled" };
      }

      await db
        .update(nomineeInfo)
        .set(updatable)
        .where(eq(nomineeInfo.userId, userId));
      return { success: true };
    }
  } catch (error) {
    console.error("[SAVE_NOMINEE_INFO_ERROR]", error);
    return { error: "Internal server error" };
  }
}
