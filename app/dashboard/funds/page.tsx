// app/dashboard/funds/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getFunds, getFundTransactions } from "@/lib/actions/funds/funds";
import FundsTabsPage from "@/components/dashboard/fundsTabs/FundsTabsPage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function FundsPage() {
  const { getPermissions } = getKindeServerSession();
  const permissions = await getPermissions();
  const isAdmin = permissions?.permissions?.includes("admin");
  const isManager = permissions?.permissions?.includes("manager");

  if (!isAdmin && !isManager) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to access fund management.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Only finance managers and administrators can access and modify fund accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all data on the server
  const [fundsResult, logsResult] = await Promise.all([
    getFunds(),
    getFundTransactions(),
  ]);

  return (
    <FundsTabsPage
      initialFunds={Array.isArray(fundsResult) ? fundsResult : []}
      initialLogs={Array.isArray(logsResult) ? logsResult : []}
    />
  );
}