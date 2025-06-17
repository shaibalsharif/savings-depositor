"use client";

import { useState, useEffect } from "react";
import { TableFilter } from "@/components/dashboard/tables/TableFilter";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { Deposit } from "@/types";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { format } from "date-fns";

export function AllDepositsTable({ months }: { months: string[] }) {

  const { user } = useKindeAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10);
  const [userMap, setUserMap] = useState<Record<string, any>>({});



  const [filter, setFilter] = useState({
    user: "",
    status: "all",
    month: "all",
    startDate: "",
    endDate: "",
  });

  const fetchDeposits = async (reset = false) => {
    if (reset) setLimit(10);
    setLoading(true);

    const params = new URLSearchParams();

    // Updated: Use user id instead of email
    if (filter.user) params.append("userId", filter.user);

    if (filter.status && filter.status !== "all") {
      params.append("status", filter.status);
    }

    if (filter.month && filter.month !== "all") {

      params.append("month", filter.month);
    }

    if (filter.startDate) {
      params.append("startDate", filter.startDate);
    }

    if (filter.endDate) {
      params.append("endDate", filter.endDate);
    }

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
    fetchDeposits();
  }, [limit, filter]);


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
        if (!cancelled) {
          setUserMap(data); // data is { userId: userData }
        }
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


  return (
    <div>
      <TableFilter
        filterList={['user', 'status', 'month', 'email', 'startDate', 'endDate']}

        months={months}
        onFilter={handleFilter}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No deposits found</TableCell>
              </TableRow>
            ) : (
              deposits.map((deposit) => {
                const user = userMap[deposit.userId];
                const createdAt = new Date(deposit.createdAt);
                const dateStr = createdAt.toLocaleDateString();
                const timeStr = createdAt.toLocaleTimeString();
                return (
                  <TableRow key={deposit.id}>
                    <TableCell><div className="flex items-center space-x-2">
                      {user?.picture ? (
                        <Image src={user.picture} alt={user.name || "user image"} width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span>{user?.username || "Loading..."}</span>
                        <span className="text-xs text-muted-foreground">{user?.preferred_email}</span>
                        <span className="text-xs text-muted-foreground">{user?.phone}</span>
                      </div>
                    </div></TableCell>
                    <TableCell>{format(new Date(deposit.month + "-01"), "MMMM-yy")}</TableCell>
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
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <TableLoadMore
        loading={loading}
        hasMore={hasMore}
        onClick={handleLoadMore}
      />
    </div>
  );
}
