"use client";

import { useState, useEffect } from "react";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { Deposit } from "@/types";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format, parseISO, addMonths, subMonths, startOfMonth } from "date-fns";

export default function DepositStatusPage() {
  const { user } = useKindeAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10);
  const [userMap, setUserMap] = useState<Record<string, any>>({});

  // Calculate current month as yyyy-MM string
  const currentMonthDate = startOfMonth(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(currentMonthDate);

  // Format selected month string for API call
  const selectedMonth = format(selectedMonthDate, "yyyy-MM");
  const displayMonth = format(selectedMonthDate, "MMMM yyyy");

  // Calculate previous and next month strings for navigation
  const prevMonthDate = subMonths(selectedMonthDate, 1);
  const nextMonthDate = addMonths(selectedMonthDate, 1);
  const prevMonth = format(prevMonthDate, "yyyy-MM");
  const nextMonth = format(nextMonthDate, "yyyy-MM");

  // Fetch deposits filtered by status=verified and selectedMonth
  const fetchDeposits = async (reset = false) => {
    if (reset) setLimit(10);
    setLoading(true);

    const params = new URLSearchParams({
      status: "verified",
      month: selectedMonth,
      limit: limit.toString(),
    });

    try {
      const res = await fetch(`/api/deposits?${params.toString()}`);
      const { data } = await res.json();
      setDeposits(data || []);
      setHasMore(data && data.length >= limit);
    } finally {
      setLoading(false);
    }
  };

  // Load deposits on limit or selectedMonth change
  useEffect(() => {
    fetchDeposits();
  }, [limit, selectedMonth]);

  // Fetch user info batch for deposits
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
      } catch {
        if (!cancelled) setUserMap({});
      }
    }

    if (uniqueUserIds.length) fetchUsersBatch();

    return () => { cancelled = true; };
  }, [deposits]);

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setSelectedMonthDate(prevMonthDate);
    setLimit(10); // reset pagination on month change
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(nextMonthDate);
    setLimit(10);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>Verified Deposits for {displayMonth}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevMonth}>Previous</Button>
            <Button variant="outline" onClick={handleNextMonth}>Next</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Deposit Date</TableHead>
                <TableHead>Approved At</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No verified deposits found for this month.
                  </TableCell>
                </TableRow>
              ) : (
                deposits.map((deposit) => {
                  const user = userMap[deposit.userId];
                  const depositDate = new Date(deposit.createdAt);
                  const approvedDate = deposit.updatedAt ? new Date(deposit.updatedAt) : null;

                  return (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user?.picture ? (
                            <Image 
                              src={user.picture} 
                              alt={user.username || "User"} 
                              width={32} 
                              height={32} 
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              {user?.username?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span>{user?.username || "Unknown User"}</span>
                            <span className="text-xs text-muted-foreground">
                              {user?.email || user?.preferred_email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(deposit.month + "-01"), "MMM yyyy")}</TableCell>
                      <TableCell>৳{Number(deposit.amount).toLocaleString()}</TableCell>
                      <TableCell>{deposit.transactionId || "N/A"}</TableCell>
                      <TableCell>{format(depositDate, "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell>{approvedDate ? format(approvedDate, "dd MMM yyyy HH:mm") : "N/A"}</TableCell>
                      <TableCell>{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-center">
            <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
