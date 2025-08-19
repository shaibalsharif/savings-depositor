"use server";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getKindeManagementToken } from "@/lib/kinde-management";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  given_name: z.string().min(1),
  family_name: z.string().min(1),
  username: z.string().min(1),
  picture: z.string().optional(),
  phone: z.string().optional(),
});

export interface KindeUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  picture: string | null;
  username: string | null;
  permissions: string[];
  status: "active" | "archived";
  isSuspended: boolean;
}

/**
 * Fetches all users from Kinde and combines them with local DB data.
 */
export async function fetchAllUsers(emailFilter?: string | null): Promise<KindeUser[]> {
  const token = await getKindeManagementToken();
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/users?page_size=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Kinde users");

  const kindeUsers = (await res.json()).users;
  const kindeUserIds = kindeUsers.map((u: any) => u.id);

  // FIX: Fetch permissions and suspension status from your local DB in a single query
  const dbUsers = await db.select().from(users).where(inArray(users.id, kindeUserIds));
  const dbUserMap = new Map(dbUsers.map((u) => [u.id, u]));

  const permsPromises = kindeUsers.map((user: any) =>
    fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${process.env.KINDE_ORG_CODE}/users/${user.id}/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => (res.ok ? res.json() : { permissions: [] }))
    .then((data) => ({ id: user.id, permissions: data.permissions?.map((p: any) => p.key) || [] }))
  );
  const permsResult = await Promise.all(permsPromises);
  const permsMap = new Map(permsResult.map((p) => [p.id, p.permissions]));

  const combinedUsers = kindeUsers
    .map((kindeUser: any) => {
      const dbUser = dbUserMap.get(kindeUser.id);
      const permissions = permsMap.get(kindeUser.id) || [];
      const status = dbUser?.isSuspended ? "archived" : "active";

      return {
        id: kindeUser.id,
        first_name: kindeUser.given_name,
        last_name: kindeUser.family_name,
        email: kindeUser.email,
        picture: kindeUser.picture || dbUser?.picture || null,
        username: kindeUser.username,
        status, // Use status from local DB
        permissions,
        isSuspended: dbUser?.isSuspended || false,
      };
    })
    .filter((user: KindeUser) => (emailFilter ? user.email.includes(emailFilter) : true));

  return combinedUsers;
}

/**
 * Creates a new user in Kinde and your database.
 */
export async function addNewUser(formData: z.infer<typeof createUserSchema>): Promise<{ success: boolean, userId: string } | { error: string }> {
  // 1. Create user in Kinde Auth
  const token = await getKindeManagementToken();
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      profile: { given_name: formData.given_name, family_name: formData.family_name, picture: formData.picture },
      identities: [{ type: "email", is_verified: true, details: { email: formData.email } }],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    return { error: error.message || "Failed to create user in Kinde" };
  }
  const kindeUser = await res.json();
  const kindeUserId = kindeUser.user?.id || kindeUser.id;
  const kindeUserName = `${formData.given_name} ${formData.family_name}`;

  // 2. Add user to your new 'users' table with default status and permissions
  try {
    await db.insert(users).values({
      id: kindeUserId,
      name: kindeUserName,
      email: formData.email,
      picture: formData.picture || null,
      isSuspended: false, // Default to not suspended
      permissions: ['user'], // Default permission
    });
  } catch (dbError) {
    console.error("Failed to add user to users table:", dbError);
    return { error: "Failed to create user in database" };
  }
  return { success: true, userId: kindeUserId };
}

/**
 * Suspends a user in Kinde and updates the local DB.
 */
export async function suspendUser(userId: string): Promise<{ success: boolean } | { error: string }> {
  const token = await getKindeManagementToken();
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_suspended: true }),
  });
  if (!res.ok) return { error: "Failed to suspend user" };

  // FIX: Update local DB to reflect suspension
  await db.update(users).set({ isSuspended: true }).where(eq(users.id, userId));
  return { success: true };
}

/**
 * Unsuspends a user in Kinde and updates the local DB.
 */
export async function unsuspendUser(userId: string): Promise<{ success: boolean } | { error: string }> {
  const token = await getKindeManagementToken();
  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_suspended: false }),
  });
  if (!res.ok) return { error: "Failed to unsuspend user" };

  // FIX: Update local DB to reflect unsuspension
  await db.update(users).set({ isSuspended: false }).where(eq(users.id, userId));
  return { success: true };
}

/**
 * Assigns or removes 'manager' permission and updates both Kinde and the local DB.
 *
 * @param userId The ID of the user to modify.
 * @param type 'assign' or 'remove' to specify the action.
 * @param oldManagerId The ID of the current manager to remove the role from, if any.
 * @returns An object indicating success or an error.
 */
export async function handleManagerPermission(
  userId: string,
  type: "assign" | "remove",
  oldManagerId?: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const orgCode = process.env.KINDE_ORG_CODE!;
    const token = await getKindeManagementToken();
    let managerPermId: string | null = null;

    const permsRes = await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/permissions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!permsRes.ok) {
      throw new Error("Failed to fetch permissions from Kinde.");
    }
    const permsData = await permsRes.json();
    const managerPerm = permsData.permissions.find(
      (p: any) => p.key.toLowerCase() === "manager"
    );
    if (managerPerm) {
      managerPermId = managerPerm.id;
    }

    if (!managerPermId) {
      return { error: "Manager permission not found in Kinde." };
    }

    if (type === "assign") {
      const assignRes = await fetch(
        `${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${orgCode}/users/${userId}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permission_id: managerPermId }),
        }
      );
      if (!assignRes.ok) {
        throw new Error("Failed to assign manager permission in Kinde.");
      }

      if (oldManagerId && oldManagerId !== userId) {
        await fetch(
          `${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${orgCode}/users/${oldManagerId}/permissions/${managerPermId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      
      // FIX: Correct JSONB array concatenation syntax
      await db.update(users)
        .set({ permissions: sql`${users.permissions} || '["manager"]'::jsonb` })
        .where(eq(users.id, userId));
      
      if (oldManagerId && oldManagerId !== userId) {
        await db.update(users)
          .set({ permissions: sql`${users.permissions} - 'manager'` })
          .where(eq(users.id, oldManagerId));
      }
    } else if (type === "remove") {
      const removeRes = await fetch(
        `${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${orgCode}/users/${userId}/permissions/${managerPermId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!removeRes.ok) {
        throw new Error("Failed to remove manager permission in Kinde.");
      }
      
      await db.update(users)
        .set({ permissions: sql`${users.permissions} - 'manager'` })
        .where(eq(users.id, userId));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error handling manager permission:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}