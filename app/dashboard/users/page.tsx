// app/dashboard/users/page.tsx
import { fetchAllUsers } from "@/lib/actions/users/users";
import UsersTabs from "@/components/dashboard/users/UsersTabs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { getPermissions } = getKindeServerSession();
  const permissions = await getPermissions();
  const isAdmin = permissions?.permissions?.includes("admin");

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to manage users</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // FIX: Explicitly await searchParams before using it
  const resolvedSearchParams = await searchParams;
  const allUsers = await fetchAllUsers(resolvedSearchParams.q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage user access and permissions</p>
        </div>
      </div>
      <UsersTabs initialUsers={allUsers} />
    </div>
  );
}