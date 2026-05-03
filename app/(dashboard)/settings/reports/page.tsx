import { requireManager } from "@/lib/auth";
import { getAvailableReports, getReportForMonth } from "@/lib/actions/reports";
import { ReportsManagement } from "./ReportsManagement";

export default async function SettingsReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireManager();
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
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Monthly Reports Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Generate, audit, and export the official Monthly Reports.
        </p>
      </div>

      <ReportsManagement
        availableReports={availableReports}
        selectedReport={selectedReport}
      />
    </div>
  );
}
