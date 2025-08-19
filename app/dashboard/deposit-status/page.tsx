// app/dashboard/deposit-status/page.tsx
import DepositStatusTable from "@/components/dashboard/tables/DepositStatusTable";
import { getVerifiedDeposits } from "@/lib/actions/deposits/getVerifiedDeposits";

import { format, startOfMonth } from "date-fns";

export default async function DepositStatusPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  // FIX: Await searchParams before accessing its properties.
  const resolvedSearchParams = await searchParams;
  const currentMonth = format(startOfMonth(new Date()), "yyyy-MM");
  const selectedMonth = resolvedSearchParams.month || currentMonth;

  const depositsResult = await getVerifiedDeposits(selectedMonth);

  // Safely handle the result from the server action
  if ("error" in depositsResult) {
    return <div>Error: {depositsResult.error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <DepositStatusTable
        initialDeposits={depositsResult.deposits}
        selectedMonth={selectedMonth}
        availableMonths={depositsResult.availableMonths}
      />
    </div>
  );
}