import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getPendingDeposits } from "@/lib/actions/deposits/reviewDeposits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewDepositsTable from "@/components/dashboard/tables/ReviewDepositsTable";
import { Suspense } from "react";
import { redirect } from "next/navigation";

export default async function ReviewDepositsPage({
  searchParams,
}: {
  searchParams: {
    sortBy?: "createdAt" | "month";
    sortOrder?: "asc" | "desc";
  };
}) {
  const { getPermissions } = getKindeServerSession();
  const permissions = (await getPermissions()) || { permissions: [] as string[] };
  const isManager = permissions.permissions.includes("manager");
  const isAdmin = permissions.permissions.includes("admin");

  if (!isManager && !isAdmin) {
    redirect('/dashboard');
  }

  // FIX: Await searchParams before destructuring
  const resolvedSearchParams = await searchParams;
  const { sortBy, sortOrder } = resolvedSearchParams;

  const depositsResult = await getPendingDeposits(sortBy, sortOrder);

  if ("error" in depositsResult) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>{depositsResult.error}</CardContent></Card>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading pending deposits...</div>}>
      <div className="max-w-5xl mx-auto py-8">
        <ReviewDepositsTable initialDeposits={depositsResult.deposits} funds={depositsResult.funds} />
      </div>
    </Suspense>
  );
}