// /app/withdrawals/_components/WithdrawalsClientPage.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import AllWithdrawalsTab from "./AllWithdrawalsTab";
import { FullWithdrawal, Fund } from "@/types";
import PendingWithdrawalsTab from "./PendingWithdrawalsTab";
import RequestWithdrawalTab from "./RequestWithdrawalTab";

interface WithdrawalsClientPageProps {
  initialWithdrawals: FullWithdrawal[];
  initialFunds: Fund[];
  isManager: boolean;
}

export default function WithdrawalsClientPage({
  initialWithdrawals,
  initialFunds,
  isManager,
}: WithdrawalsClientPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("request");

  const pendingWithdrawals = initialWithdrawals.filter(
    (w) => w.status === "pending"
  );
  const allWithdrawals = initialWithdrawals;
  const funds = initialFunds;

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Withdrawal Management
        </h1>
        <p className="text-muted-foreground">
          Request and track withdrawals from the group fund
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Withdrawals</TabsTrigger>
          <TabsTrigger value="request">Request Withdrawal</TabsTrigger>
          {isManager && <TabsTrigger value="pending">Pending Approval</TabsTrigger>}
        </TabsList>
        <TabsContent value="all">
          {/* FIX: This component is now client-side again, so we pass props */}
          <AllWithdrawalsTab initialWithdrawals={allWithdrawals} funds={funds} />
        </TabsContent>
        <TabsContent value="request">
          <RequestWithdrawalTab funds={funds} onUpdate={handleUpdate} />
        </TabsContent>
        {isManager && (
          <TabsContent value="pending">
            <PendingWithdrawalsTab
              pendingWithdrawals={pendingWithdrawals}
              funds={funds}
              onUpdate={handleUpdate}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}