'use server'

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getWithdrawalData } from "@/lib/actions/withdrawals/withdrawals";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WithdrawalsClientPage from "@/components/dashboard/withdrawals/WithdrawalsClientPage";

export default async function WithdrawalsPage() {
  const { getPermissions, isAuthenticated } = getKindeServerSession();
  const isUserAuthenticated = await isAuthenticated();

  // FIX: Explicitly type the default permissions array as string[]
  const permissions = (await getPermissions()) || { permissions: [] as string[] };

  const isManager = permissions.permissions.includes("manager");
  const isAdmin = permissions.permissions.includes("admin");

  // The rest of your code remains the same
  if (!isUserAuthenticated || (!isManager && !isAdmin)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to access withdrawal management.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please contact an administrator if you believe this is an error.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const withdrawalData = await getWithdrawalData();
  const funds = "funds" in withdrawalData ? withdrawalData.funds : [];
  const withdrawals = "withdrawals" in withdrawalData ? withdrawalData.withdrawals : [];

  return <WithdrawalsClientPage initialWithdrawals={withdrawals} initialFunds={funds} isManager={isManager} />;
}