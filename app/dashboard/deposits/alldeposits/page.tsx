// app/dashboard/deposits/alldeposits/page.tsx
import { getAllDeposits } from "@/lib/actions/deposits/getAllDeposits";
import { AllDepositsTable } from "@/components/dashboard/tables/AllDepositsTable";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { format, addMonths, startOfMonth } from "date-fns";
import { Suspense } from "react";
import { getKindeManagementToken } from "@/lib/kinde-management";
import { AllDeposit } from "@/types/types";
import { db } from "@/lib/db";
import { users } from "@/db/schema";


export default async function AllDepositsPage({
  searchParams,
}: {
  searchParams: {
    userId?: string;
    status?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const { getPermissions } = getKindeServerSession();
  const permissions = await getPermissions();
  const isAdmin = permissions?.permissions?.includes("admin") || false;
  const isManager = permissions?.permissions?.includes("manager") || false;

  if (!isAdmin && !isManager) {
    return <div>You do not have permission to view this page.</div>;
  }
  
  // Fetch deposits based on search params
  const depositsResult = await getAllDeposits(await searchParams);
  const initialDeposits = Array.isArray(depositsResult) ? depositsResult : [];

  // Fetch all users for the filter dropdown
  const allUsers = await db.select({id:users.id, name:users.name, email:users.email, picture:users.picture}).from(users)

  // Generate month list on the server
  const months: string[] = [];
  const today = new Date();
  for (let i = -6; i <= 6; i++) {
    months.push(format(addMonths(today, i), "yyyy-MM"));
  }

  return (
    <Suspense fallback={<div>Loading deposits...</div>}>
      <AllDepositsTable
        initialDeposits={initialDeposits}
        months={months}
        users={allUsers}
      />
    </Suspense>
  );
}