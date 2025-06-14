"use client";

import { useState, useEffect } from "react";
import { TableFilter } from "@/components/dashboard/tables/TableFilter";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { Deposit } from "@/types";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ReceiptDialog } from "../reciept/RecieptDialog";

export function YourDepositsTable({ months }: { months: string[] }) {
  const { user } = useKindeAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState({
    status: "all",
    month: "all",
    startDate: "",
    endDate: "",
  });

  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [totalDepositByUser, setTotalDepositByUser] = useState<Record<string, number>>({});

  const fetchDeposits = async (reset = false) => {
    if (reset) setLimit(10);
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status !== "all") params.append("status", filter.status);
    if (filter.month !== "all") params.append("month", filter.month);
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
    params.append("userId", user?.id || "");
    params.append("limit", limit.toString());
    try {
      const res = await fetch(`/api/deposits?${params.toString()}`);
      const { data } = await res.json();
      setDeposits(data || []);
      setHasMore(data && data.length >= limit);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalDepositsByUser = async (userId: string, month: string) => {
    try {
      const res = await fetch(`/api/deposits/total?userId=${userId}&month=${month}`);
      if (!res.ok) return 0;
      const { total } = await res.json();
      
      setTotalDepositByUser(prev => ({ ...prev, [userId]: total || 0 }));
    } catch {
      setTotalDepositByUser(prev => ({ ...prev, [userId]: 0 }));
    }
  };

  const handleFilter = (filters: any) => {
    setFilter(filters);
    fetchDeposits(true);
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };

  useEffect(() => {
    if (user?.id) fetchDeposits();
  }, [limit, filter, user?.id]);

  useEffect(() => {
    const uniqueUserIds = Array.from(new Set(deposits.map(d => d.userId).filter(Boolean)));
    let cancelled = false;

    async function fetchUsersBatch() {
      try {
        const res = await fetch("/api/deposits/depositors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!res.ok) throw new Error("Failed to fetch users batch");
        const data = await res.json();
        if (!cancelled) setUserMap(data);

        // Fetch total deposits for each user up to their deposit month
        uniqueUserIds.forEach(userId => {
          // Find the latest deposit month for this user in current deposits list
          const userDeposits = deposits.filter(d => d.userId === userId);
          // Get max month (yyyy-MM) from userDeposits
          const maxMonth = userDeposits.reduce((max, d) => d.month > max ? d.month : max, "0000-00");
          fetchTotalDepositsByUser(userId, maxMonth);
        });
      } catch (e) {
        if (!cancelled) setUserMap({});
        console.error(e);
      }
    }

    if (uniqueUserIds.length) fetchUsersBatch();

    return () => {
      cancelled = true;
    };
  }, [deposits]);

  const openReceiptDialog = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowReceiptDialog(true);
  };

  const closeReceiptDialog = () => {
    setSelectedDeposit(null);
    setShowReceiptDialog(false);
  };

  return (
    <div>
      <TableFilter
        filterList={['status', 'month', 'startDate', 'endDate']}
        months={months}
        onFilter={handleFilter}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deposits.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">No deposits found</TableCell>
            </TableRow>
          ) : (
            deposits.map((deposit) => {
              const createdAt = new Date(deposit.createdAt);
              const dateStr = createdAt.toLocaleDateString();
              const timeStr = createdAt.toLocaleTimeString();
              const userTotalDeposit = totalDepositByUser[deposit.userId] || 0;

              return (
                <TableRow key={deposit.id}>
                  <TableCell>{format(deposit.month, "MMMM yyyy")}</TableCell>
                  <TableCell>৳ {Number(deposit.amount).toLocaleString()}</TableCell>
                  <TableCell>{deposit.transactionId || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <div>{dateStr}</div>
                      <div className="text-xs text-muted-foreground">{timeStr}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={deposit.status === "verified" ? "success" : deposit.status === "pending" ? "secondary" : "destructive"}>
                      {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
                  <TableCell>
                    <button
                      disabled={deposit.status !== "verified"}
                      onClick={() => openReceiptDialog(deposit)}
                      className={`rounded px-3 py-1 text-white ${deposit.status === "verified" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                    >
                      Show Receipt
                    </button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TableLoadMore
        loading={loading}
        hasMore={hasMore}
        onClick={handleLoadMore}
      />

      {selectedDeposit && (
        <ReceiptDialog
          open={showReceiptDialog}
          onOpenChange={() => {
            setSelectedDeposit(null);
            setShowReceiptDialog(false);
          }}

          deposit={selectedDeposit}
          user={userMap[selectedDeposit.userId]}
          totalDeposit={totalDepositByUser[selectedDeposit.userId] || 0}
          managerName="alif"
        />
      )}
    </div>
  );
}
