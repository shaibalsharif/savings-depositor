// app/dashboard/settings/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getDepositSettings } from "@/lib/actions/settings/depositSettings";
import { getTerms } from "@/lib/actions/settings/terms";
import { getNotificationSettings } from "@/lib/actions/settings/notifications";
import DepositSettingsClientTab from "@/components/dashboard/settings/DepositSettingsTab";
import NotificationsClientTab from "@/components/dashboard/settings/NotificationsTab";
import TermsClientTab from "@/components/dashboard/settings/TermsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default async function SettingsPage() {
  const { getUser, getPermissions } = getKindeServerSession();
  const [user, permissions] = await Promise.all([
    getUser(),
    getPermissions(),
  ]);

  const isAdmin = permissions?.permissions?.includes("admin") || false;
  const isManager = permissions?.permissions?.includes("manager") || false;

  if (!isAdmin && !isManager) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="max-w-md">
          <h2 className="text-xl font-semibold p-6 text-center">Access Restricted</h2>
          <p className="p-6 text-center text-muted-foreground">
            You do not have permission to access settings.
          </p>
        </Card>
      </div>
    );
  }

  const [depositSettingsResult, termsResult, notificationsResult] = await Promise.all([
    getDepositSettings(),
    getTerms(),
    getNotificationSettings(user?.id!),
  ]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="deposit" className="space-y-6">
        <TabsList className="grid grid-cols-3 rounded-md border bg-muted p-1">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="deposit" className="data-[state=active]:bg-background data-[state=active]:shadow">
            Deposit Settings
          </TabsTrigger>
          <TabsTrigger disabled={!isAdmin} value="terms" className="data-[state=active]:bg-background data-[state=active]:shadow">
            Terms & Conditions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsClientTab initialSettings={notificationsResult} />
        </TabsContent>

        <TabsContent value="deposit">
          <DepositSettingsClientTab initialSettings={depositSettingsResult} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="terms">
            <TermsClientTab initialContent={termsResult} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}