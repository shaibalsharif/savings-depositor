// app/dashboard/deposits/mydeposits/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getMyDeposits } from "@/lib/actions/deposits/getMyDeposits";
import { MyDepositsTable } from "@/components/dashboard/tables/MyDepositsTable";
import { Deposit } from "@/types";
import { Suspense } from "react";

function MyDepositsTableLoading() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border text-muted-foreground">
      Loading deposits...
    </div>
  );
}

export default async function MyDepositsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    sortBy?: string; // <-- New prop
    sortOrder?: "asc" | "desc"; // <-- New prop
  };
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) {
    return <div>Please log in to view your deposits.</div>;
  }
  
  const resolvedSearchParams = await searchParams;
  const depositsResult = await getMyDeposits(user.id, resolvedSearchParams);
  const initialDeposits = Array.isArray(depositsResult) ? depositsResult : [];
  
  return (
    <Suspense fallback={<MyDepositsTableLoading />}>
      <MyDepositsTable
        initialDeposits={initialDeposits}
        userId={user.id}
      />
    </Suspense>
  );
}