import { requireMember } from "@/lib/auth";
import { getAvailableReports, getReportForMonth } from "@/lib/actions/reports";
import { ReportsClient } from "./ReportsClient";

export default async function MonthlyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireMember();
  const { month } = await searchParams;

  const availableReports = await getAvailableReports();
  let selectedReport = null;

  if (month) {
    selectedReport = await getReportForMonth(month);
  } else if (availableReports.length > 0) {
    selectedReport = await getReportForMonth(availableReports[0].month);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Monthly Reports</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          View official financial summaries and download PDF records.
        </p>
      </div>

      <ReportsClient
        availableReports={availableReports}
        selectedReport={selectedReport}
      />
    </div>
  );
}
