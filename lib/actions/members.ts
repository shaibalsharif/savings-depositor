"use server";

import { db } from "@/db/client";
import { personalInfo, nomineeInfo } from "@/db/schema";
import { requireManager, requireMember } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleMemberRole(userId: string, currentPosition: string) {
  const currentUser = await requireManager();
  
  // Only the main admin can assign/revoke managers
  if (currentUser.email !== "shaibalsharif@gmail.com") {
    throw new Error("Unauthorized: Only the admin can manage roles");
  }

  // Prevent admin from removing their own role
  if (userId === currentUser.id) {
    throw new Error("You cannot change your own role");
  }

  const newPosition = currentPosition === "manager" ? "member" : "manager";

  await db
    .update(personalInfo)
    .set({ position: newPosition })
    .where(eq(personalInfo.userId, userId));

  revalidatePath("/members");
  return { success: true, newPosition };
}

export async function updateMemberFullProfile(
  userId: string,
  personal: {
    name?: string;
    nameBn?: string;
    father?: string;
    mother?: string;
    dob?: string;
    profession?: string;
    religion?: string;
    presentAddress?: string;
    permanentAddress?: string;
    mobile?: string;
    nidNumber?: string;
    photo?: string;
  },
  nominee: {
    name?: string;
    relation?: string;
    dob?: string;
    mobile?: string;
    nidNumber?: string;
    address?: string;
    photo?: string;
  }
) {
  await requireManager();

  // Update personal info
  const pUpdates: any = {};
  if (personal.name !== undefined) pUpdates.name = personal.name;
  if (personal.nameBn !== undefined) pUpdates.nameBn = personal.nameBn;
  if (personal.father !== undefined) pUpdates.father = personal.father;
  if (personal.mother !== undefined) pUpdates.mother = personal.mother;
  if (personal.dob !== undefined) pUpdates.dob = personal.dob;
  if (personal.profession !== undefined) pUpdates.profession = personal.profession;
  if (personal.religion !== undefined) pUpdates.religion = personal.religion;
  if (personal.presentAddress !== undefined) pUpdates.presentAddress = personal.presentAddress;
  if (personal.permanentAddress !== undefined) pUpdates.permanentAddress = personal.permanentAddress;
  if (personal.mobile !== undefined) pUpdates.mobile = personal.mobile;
  if (personal.nidNumber !== undefined) pUpdates.nidNumber = personal.nidNumber;
  if (personal.photo !== undefined) pUpdates.photo = personal.photo;

  if (Object.keys(pUpdates).length > 0) {
    await db.update(personalInfo).set(pUpdates).where(eq(personalInfo.userId, userId));
  }

  // Find or create/update nominee
  const existingNominee = await db.query.nomineeInfo.findFirst({
    where: eq(nomineeInfo.userId, userId),
  });

  const nUpdates: any = {};
  if (nominee.name !== undefined) nUpdates.name = nominee.name;
  if (nominee.relation !== undefined) nUpdates.relation = nominee.relation;
  if (nominee.dob !== undefined) nUpdates.dob = nominee.dob;
  if (nominee.mobile !== undefined) nUpdates.mobile = nominee.mobile;
  if (nominee.nidNumber !== undefined) nUpdates.nidNumber = nominee.nidNumber;
  if (nominee.address !== undefined) nUpdates.address = nominee.address;
  if (nominee.photo !== undefined) nUpdates.photo = nominee.photo;

  if (Object.keys(nUpdates).length > 0) {
    if (existingNominee) {
      await db.update(nomineeInfo).set(nUpdates).where(eq(nomineeInfo.userId, userId));
    } else {
      await db.insert(nomineeInfo).values({
        userId,
        name: nominee.name ?? "",
        relation: nominee.relation ?? "",
        dob: nominee.dob ?? null,
        mobile: nominee.mobile ?? null,
        nidNumber: nominee.nidNumber ?? null,
        address: nominee.address ?? null,
        photo: nominee.photo ?? null,
      });
    }
  }

  revalidatePath("/members");
  revalidatePath("/my-profile");
  return { success: true };
}

export async function updateSelfPhoto(photo: string) {
  const user = await requireMember();
  await db.update(personalInfo).set({ photo }).where(eq(personalInfo.userId, user.id));
  revalidatePath("/my-profile");
  return { success: true };
}
