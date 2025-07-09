// /app/withdrawals/page.tsx
'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllWithdrawalsTab from "./_components/AllWithdrawalsTab";
import RequestWithdrawalTab from "./_components/RequestWithdrawalTab";
import PendingWithdrawalsTab from "./_components/PendingWithdrawalsTab";

export default function WithdrawalsPage() {
  const permissions = { permissions: ["admin", "manager"] }; // getPermissions();
  const isManager = permissions?.permissions?.includes("manager");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdrawal Management</h1>
        <p className="text-muted-foreground">Request and track withdrawals from the group fund</p>
      </div>
      <Tabs defaultValue={isManager ? "request" : "request"}>
        <TabsList>
          <TabsTrigger value="all">All Withdrawals</TabsTrigger>
          <TabsTrigger value="request">Request Withdrawal</TabsTrigger>
          {isManager && <TabsTrigger value="pending">Pending Approval</TabsTrigger>}
        </TabsList>
        <TabsContent value="all">
          <AllWithdrawalsTab />
        </TabsContent>
        <TabsContent value="request">
          <RequestWithdrawalTab />
        </TabsContent>
        {isManager && (
          <TabsContent value="pending">
            <PendingWithdrawalsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
