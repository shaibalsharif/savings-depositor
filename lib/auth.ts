import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import type { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "manager" | "member";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { isAuthenticated, getRoles, getUser } = getKindeServerSession();
  
  if (!(await isAuthenticated())) {
    return null;
  }

  const user = await getUser();
  if (user?.email === "shaibalsharif@gmail.com") {
    return "manager";
  }

  // Check Kinde roles
  const roles = await getRoles();
  if (roles && roles.some(role => role.key === "manager")) {
    return "manager";
  }
  
  // Fallback: Check Neon DB
  if (user?.id) {
    const dbUser = await db.query.personalInfo.findFirst({
      where: eq(personalInfo.userId, user.id),
      columns: { position: true }
    });
    if (dbUser?.position === "manager") {
      return "manager";
    }
  }
  
  return "member";
}

export async function isManager(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "manager";
}

export async function requireManager(): Promise<KindeUser<Record<string, unknown>>> {
  const { isAuthenticated, getUser } = getKindeServerSession();
  
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login");
  }
  
  if (!(await isManager())) {
    redirect("/dashboard");
  }
  
  const user = await getUser();
  if (!user) redirect("/api/auth/login");
  return user;
}

export async function requireMember(): Promise<KindeUser<Record<string, unknown>>> {
  const { isAuthenticated, getUser } = getKindeServerSession();
  
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login");
  }
  
  const user = await getUser();
  if (!user) redirect("/api/auth/login");

  if (user && user.picture) {
    try {
      const dbUser = await db.query.personalInfo.findFirst({
        where: eq(personalInfo.userId, user.id),
      });
      if (dbUser && !dbUser.photo) {
        await db.update(personalInfo).set({ photo: user.picture }).where(eq(personalInfo.userId, user.id));
      }
    } catch (err) {
      console.error("Error updating member photo from Kinde picture", err);
    }
  }

  return user;
}
