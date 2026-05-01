import { CollapsibleLayout } from "@/components/nav/CollapsibleLayout";
import { requireMember, isManager } from "@/lib/auth";
import { SessionGuard } from "@/components/SessionGuard";
import "@/app/dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMember();
  const managerRole = await isManager();

  return (
    <CollapsibleLayout isManagerRole={managerRole}>
      <SessionGuard />
      {children}
    </CollapsibleLayout>
  );
}
