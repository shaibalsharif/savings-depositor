"use client"

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadReceipt } from "@/components/dashboard/upload-receipt";
import { YourDepositsTable } from "@/components/dashboard/tables/YourDepositsTable"
import { AllDepositsTable } from "@/components/dashboard/tables/AllDepositsTable";
import { ReviewDepositsTable } from "@/components/dashboard/tables/ReviewDepositsTable";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import type { Deposit, DepositFilters } from "@/types";

const MONTHS = [
  "January 2025",
  "February 2025",
  "March 2025",
  "April 2025",
  "May 2025",
  "June 2025",
  "July 2025",
  "August 2025",
  "September 2025",
  "October 2025",
  "November 2025",
  "December 2025"
];


export default function DepositsPage() {
  const { user, getPermissions } = useKindeAuth();
  const permissions = getPermissions()

  // Role checks

  const isAdmin = permissions?.permissions?.includes("admin");
  const isManager = permissions?.permissions?.includes("manager");


  // // State for all deposits (fetched from API)
  // const [allDeposits, setAllDeposits] = useState([]);
  // const [loading, setLoading] = useState(false);

  // // State for filters (All Deposits)
  // const [allFilter, setAllFilter] = useState({
  //   email: "",
  //   month: "all",
  //   status: "all",
  //   page: 1,
  //   limit: 20,
  // });

  // // State for filters (Your Deposits)
  // const [yourFilter, setYourFilter] = useState({
  //   month: "all",
  //   status: "all",
  //   page: 1,
  //   limit: 20,
  // });

  // // State for review tab (pending only)
  // const [reviewPage, setReviewPage] = useState(1);

  // Fetch all deposits (admin/manager) with filters
  // const fetchAllDeposits = useCallback(async () => {
  //   setLoading(true);
  //   const params = new URLSearchParams();
  //   if (allFilter.email) params.append("account", allFilter.email);
  //   if (allFilter.month !== "all") params.append("month", allFilter.month);
  //   if (allFilter.status !== "all") params.append("status", allFilter.status);
  //   params.append("page", allFilter.page.toString());
  //   params.append("limit", allFilter.limit.toString());

  //   const res = await fetch(`/api/deposits?${params.toString()}`);
  //   const { data } = await res.json();
  //   setAllDeposits(data || []);
  //   setLoading(false);
  // }, [allFilter]);

  // // Fetch your own deposits (member) with filters
  // const fetchYourDeposits = useCallback(async () => {
  //   setLoading(true);
  //   const params = new URLSearchParams();
  //   if (yourFilter.month !== "all") params.append("month", yourFilter.month);
  //   if (yourFilter.status !== "all") params.append("status", yourFilter.status);
  //   params.append("account", user?.email || "");
  //   params.append("page", yourFilter.page.toString());
  //   params.append("limit", yourFilter.limit.toString());

  //   const res = await fetch(`/api/deposits?${params.toString()}`);
  //   const { data } = await res.json();
  //   setAllDeposits(data || []);
  //   setLoading(false);
  // }, [yourFilter, user?.email]);

  // // On mount and filter change, fetch deposits
  // useEffect(() => {
  //   if (isAdmin || isManager) {
  //     fetchAllDeposits();
  //   } else if (isMember && user?.email) {
  //     fetchYourDeposits();
  //   }
  // }, [fetchAllDeposits, fetchYourDeposits, isAdmin, isManager, isMember, user?.email]);

  // // Handler for UploadReceipt
  // const handleUploadComplete = () => {
  //   // refetch deposits after upload
  //   if (isAdmin || isManager) fetchAllDeposits();
  //   else fetchYourDeposits();
  // };

  // // Handler for AllDepositsTable filter
  // const handleAllDepositsFilter = (filters: DepositFilters) => {
  //   setAllFilter((prev) => ({ ...prev, ...filters, page: 1 }));
  // };

  // // Handler for YourDepositsTable filter
  // const handleYourDepositsFilter = (filters: DepositFilters) => {
  //   setYourFilter((prev) => ({ ...prev, ...filters, page: 1 }));
  // };

  // Handler for approving deposit (Review tab)
  const handleAction = async (depositId: number, status: "verified" | "rejected", fundId: number, note: string | undefined
  ) => {
    await fetch(`/api/deposits/${depositId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, fundId, note }),
    });
    // refetch deposits if needed
  };


  // // Data for each tab
  // const yourDeposits = isMember
  //   ? allDeposits?.filter((d) => d.userEmail === user?.email)
  //   : allDeposits;
  // const reviewDeposits = allDeposits?.filter((d) => d.status === "pending");

  // // Deposited months for UploadReceipt
  // const depositedMonths = yourDeposits.map((d) => d.month);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Deposit Management</h1>
      <p className="mb-6 text-muted-foreground">Upload and track your deposit receipts</p>
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Upload Receipt</TabsTrigger>
          <TabsTrigger value="your">Your Deposits</TabsTrigger>


          <TabsTrigger value="all">All Deposits</TabsTrigger>
          <TabsTrigger value="review" disabled={!isAdmin && !isManager}>Review Deposits</TabsTrigger>


        </TabsList>

        {/* Upload Receipt Tab */}
        <TabsContent value="upload">
          <UploadReceipt
            onUploadComplete={() => { }}
            depositedMonths={[]} // Pass actual months if needed
          />
        </TabsContent>
        {/* Your Deposits Tab */}
        <TabsContent value="your">
          <YourDepositsTable months={MONTHS} />
        </TabsContent>
        {/* All Deposits Tab (Admin/Manager) */}

        <TabsContent value="all">
          <AllDepositsTable months={MONTHS} />
        </TabsContent>

        {/* Review Deposits Tab (Admin/Manager) */}
        {(isAdmin || isManager) && (
          <TabsContent value="review">
            <ReviewDepositsTable onAction={(id, action, fundId, note) => {
              if (typeof id === "number") {
                void handleAction(id, action, fundId || 0, note); // ignore the returned Promise
              } else {
                console.warn("Invalid ID type, expected number:", id);
              }
            }} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}