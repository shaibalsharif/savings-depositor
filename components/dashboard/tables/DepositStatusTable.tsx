// components/dashboard/deposits/DepositStatusTable.tsx
"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format, parseISO, addMonths, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VerifiedDeposit {
  id: number;
  userId: string;
  month: string;
  amount: number;
  transactionId: string | null;
  depositType: "full" | "partial";
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    picture: string | null;
  };
}

interface DepositStatusTableProps {
  initialDeposits: VerifiedDeposit[];
  selectedMonth: string;
  availableMonths: string[];
}

export default function DepositStatusTable({
  initialDeposits,
  selectedMonth,
  availableMonths,
}: DepositStatusTableProps) {
  const router = useRouter();

  // FIX: This useEffect block is unnecessary in this SSR model.
  // The state is managed via URL search params, not local state.
  // We'll remove it.

  const selectedMonthDate = useMemo(() => parseISO(`${selectedMonth}-01`), [selectedMonth]);
  const prevMonthDate = subMonths(selectedMonthDate, 1);
  const nextMonthDate = addMonths(selectedMonthDate, 1);

  const prevMonth = format(prevMonthDate, "yyyy-MM");
  const nextMonth = format(nextMonthDate, "yyyy-MM");

  // FIX: Use memoized values to determine button state
  const canGoToPrevMonth = useMemo(() => {
    // Find the closest previous month that has deposits
    const sortedMonths = [...availableMonths].sort();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    return currentMonthIndex > 0;
  }, [availableMonths, selectedMonth]);
  
  const canGoToNextMonth = useMemo(() => {
    // Find the closest next month that has deposits
    const sortedMonths = [...availableMonths].sort();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    return currentMonthIndex !== -1 && currentMonthIndex < sortedMonths.length - 1;
  }, [availableMonths, selectedMonth]);

  const handlePrevMonth = () => {
    const sortedMonths = [...availableMonths].sort().reverse();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    if (currentMonthIndex !== -1 && currentMonthIndex < sortedMonths.length - 1) {
        const newMonth = sortedMonths[currentMonthIndex + 1];
        router.push(`/dashboard/deposit-status?month=${newMonth}`);
    }
  };

  const handleNextMonth = () => {
    const sortedMonths = [...availableMonths].sort().reverse();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    if (currentMonthIndex > 0) {
        const newMonth = sortedMonths[currentMonthIndex - 1];
        router.push(`/dashboard/deposit-status?month=${newMonth}`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>Verified Deposits for {format(selectedMonthDate, "MMMM yyyy")}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevMonth}
            disabled={!canGoToPrevMonth}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNextMonth}
            disabled={!canGoToNextMonth}
          >
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
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
              {initialDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No verified deposits found for this month.
                  </TableCell>
                </TableRow>
              ) : (
                initialDeposits.map((deposit) => {
                  const user = deposit.user;
                  const depositDate = new Date(deposit.createdAt);
                  const approvedDate = deposit.updatedAt ? new Date(deposit.updatedAt) : null;

                  return (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user?.picture ? (
                            <Image
                              src={user.picture}
                              alt={user.name || "User"}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              {user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span>{user?.name || "Unknown User"}</span>
                            <span className="text-xs text-muted-foreground">
                              {user?.email || "N/A"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(`${deposit.month}-01`), "MMM yyyy")}</TableCell>
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
        </div>
      </CardContent>
    </Card>
  );
}