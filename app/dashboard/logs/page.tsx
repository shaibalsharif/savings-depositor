// app/dashboard/logs/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getLogs } from "@/lib/actions/logs/logs";
import LogTable from "@/components/dashboard/tables/LogTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { fetchAllUsers, KindeUser } from "@/lib/actions/users/users";
import LogsTabsClient from "@/components/dashboard/tabs/LogsTabsClient";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: {
    tab?: "my" | "all";
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  };
}) {
  const { getUser, getPermissions } = getKindeServerSession();
  const [user, permissions] = await Promise.all([
    getUser(),
    getPermissions(),
  ]);

  if (!user?.id) {
    redirect('/api/auth/login');
  }
  
  const resolvedSearchParams = await searchParams;
  const isManagerOrAdmin = permissions?.permissions?.includes("admin") || permissions?.permissions?.includes("manager") || false;
  const tab = resolvedSearchParams.tab || (isManagerOrAdmin ? "all" : "my");

  const [logsResult, allUsersResult] = await Promise.all([
    getLogs(
      {
        ...resolvedSearchParams,
        userId: tab === 'my' ? user.id : resolvedSearchParams.userId,
      },
      isManagerOrAdmin,
      user.id
    ),
    isManagerOrAdmin ? fetchAllUsers() : [],
  ]);

  if ('error' in logsResult) {
    return <div>Error: {logsResult.error}</div>;
  }
  if (isManagerOrAdmin && !Array.isArray(allUsersResult)) {
    return <div>Error fetching user data.</div>;
  }

  const { logs: logEntries, totalCount } = logsResult;
  const allUsers = Array.isArray(allUsersResult) ? allUsersResult : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Review system activity and user actions</p>
        </div>
      </div>
      <LogsTabsClient
        isManagerOrAdmin={isManagerOrAdmin}
        tab={tab}
        logEntries={logEntries}
        totalCount={totalCount}
        allUsers={allUsers}
      />
    </div>
  );
}