// components/dashboard/notifications.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { fetchNotificationsForUser, fetchAllUsers } from "@/lib/actions/notifications/notifications";
import NotificationsClientComponent from "@/components/dashboard/NotificationClientComponent";

export default async function NotificationsPage() {
  const { getUser, getPermissions } = getKindeServerSession();
  const user = await getUser();
  const permissions = await getPermissions();
  const isAdminOrManager = permissions?.permissions?.includes("admin") || permissions?.permissions?.includes("manager") || false;

  const initialNotificationsData = await fetchNotificationsForUser(user?.id || "");
  const initialUsers = isAdminOrManager ? await fetchAllUsers() : [];

  return (
    <NotificationsClientComponent
      initialNotifications={initialNotificationsData.notifications}
      initialNextCursor={initialNotificationsData.nextCursor}
      initialPrevCursor={initialNotificationsData.prevCursor}
      initialUsers={initialUsers}
      user={user}
      isAdminOrManager={isAdminOrManager}
    />
  );
}