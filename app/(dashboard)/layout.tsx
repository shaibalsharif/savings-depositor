import { CollapsibleLayout } from "@/components/nav/CollapsibleLayout";
import { requireMember, isManager } from "@/lib/auth";
import { SessionGuard } from "@/components/SessionGuard";
import { PushPermissionBanner } from "@/components/PushPermissionBanner";
import "@/app/dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireMember();
  const managerRole = await isManager();

  return (
    <CollapsibleLayout 
      isManagerRole={managerRole} 
      user={{ name: user.given_name || "Member", picture: user.picture }}
    >
      <SessionGuard />
      <PushPermissionBanner />
      {children}
    </CollapsibleLayout>
  );
}
