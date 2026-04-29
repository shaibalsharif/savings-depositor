"use server";

import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { requireManager } from "@/lib/auth";
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
