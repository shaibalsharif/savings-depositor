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

  isAdmin: boolean;
}

export default function WithdrawalsClientPage({
  initialWithdrawals,

  initialFunds,

  isManager,

  isAdmin,
}: WithdrawalsClientPageProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("request");

  const pendingWithdrawals = initialWithdrawals.filter(
    (w) => w.status === "pending"
  );

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
          Request and track withdrawals from the group fund.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Wrapper for horizontal scrolling on mobile */}

        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="min-w-max">
            <TabsTrigger value="all">All Withdrawals</TabsTrigger>

            <TabsTrigger value="request">Request Withdrawal</TabsTrigger>

            {(isManager ||
              isAdmin) && (
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
              )}
          </TabsList>
        </div>

        <TabsContent value="all">
          <AllWithdrawalsTab
            initialWithdrawals={initialWithdrawals}
            funds={initialFunds}
          />
        </TabsContent>

        <TabsContent value="request">
          <RequestWithdrawalTab funds={initialFunds} onUpdate={handleUpdate} />
        </TabsContent>

        {(isManager ||
          isAdmin) && (
            <TabsContent value="pending">
              <PendingWithdrawalsTab
                pendingWithdrawals={pendingWithdrawals}
                funds={initialFunds}
                onUpdate={handleUpdate}
              />
            </TabsContent>
          )}
      </Tabs>
    </div>
  );
}
