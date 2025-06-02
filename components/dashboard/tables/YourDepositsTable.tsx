"use client";

import { useState, useEffect } from "react";
import { TableFilter } from "@/components/dashboard/tables/TableFilter";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { Deposit } from "@/types";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

  const fetchDeposits = async (reset = false) => {
    if (reset) setLimit(10);
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status !== "all") params.append("status", filter.status);
    if (filter.month !== "all") params.append("month", filter.month);
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
    params.append("id", user?.id || "");
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

  const handleFilter = (filters: any) => {
    setFilter(filters);
    fetchDeposits(true);
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };

  useEffect(() => {
    if (user?.email) fetchDeposits();
  }, [limit, filter, user?.email]);




  return (
    <div>
      <TableFilter
        statuses={["pending", "verified", "rejected"]}
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {deposits.map((deposit) => {
            const createdAt = new Date(deposit.createdAt);
            const dateStr = createdAt.toLocaleDateString();
            const timeStr = createdAt.toLocaleTimeString();
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
                </TableCell>                <TableCell>
                  <Badge variant={deposit.status === "verified" ? "success" : deposit.status === "pending" ? "secondary" : "destructive"}>
                    {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {/* <div className="mt-4">
        {deposits.map(deposit => (
          <div key={deposit.id} className="border p-2 mb-2">
            {deposit.month} - {deposit.status}
          </div>
        ))}
      </div> */}
      <TableLoadMore
        loading={loading}
        hasMore={hasMore}
        onClick={handleLoadMore}
      />
    </div>
  );
}
