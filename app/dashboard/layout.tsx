// app/dashboard/layout.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { getUnreadNotifications } from "@/lib/actions/notifications/notifications";
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, getUser, getPermissions } = getKindeServerSession();
  const [isAuth, kindeUser, permissions] = await Promise.all([
    isAuthenticated(),
    getUser(),
    getPermissions(),
  ]);

  if (!isAuth || !kindeUser?.id) {
    redirect("/api/auth/login");
  }

  const [localUser] = await db
    .select({ picture: users.picture })
    .from(users)
    .where(eq(users.id, kindeUser.id))
    .limit(1);

  const userWithLocalPic = {
    ...kindeUser,
    picture: localUser?.picture || kindeUser.picture,
  };

  const unreadNotificationsResult = kindeUser?.id
    ? await getUnreadNotifications(kindeUser.id, 5)
    : [];
  const unreadNotifications = Array.isArray(unreadNotificationsResult)
    ? unreadNotificationsResult
    : [];

  return (
    <DashboardLayoutClient
      user={userWithLocalPic}
      permissions={permissions?.permissions || []}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </DashboardLayoutClient>
  );
}