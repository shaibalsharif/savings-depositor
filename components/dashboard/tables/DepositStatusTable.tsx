"use client";

import { useMemo } from "react";
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

  const selectedMonthDate = useMemo(() => parseISO(`${selectedMonth}-01`), [selectedMonth]);

  const canGoToPrevMonth = useMemo(() => {
    const sortedMonths = [...availableMonths].sort();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    return currentMonthIndex > 0;
  }, [availableMonths, selectedMonth]);
  
  const canGoToNextMonth = useMemo(() => {
    const sortedMonths = [...availableMonths].sort();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    return currentMonthIndex !== -1 && currentMonthIndex < sortedMonths.length - 1;
  }, [availableMonths, selectedMonth]);

  const handlePrevMonth = () => {
    const sortedMonths = [...availableMonths].sort();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    if (currentMonthIndex > 0) {
        const newMonth = sortedMonths[currentMonthIndex - 1];
        router.push(`/dashboard/deposit-status?month=${newMonth}`);
    }
  };

  const handleNextMonth = () => {
    const sortedMonths = [...availableMonths].sort();
    const currentMonthIndex = sortedMonths.indexOf(selectedMonth);
    if (currentMonthIndex !== -1 && currentMonthIndex < sortedMonths.length - 1) {
        const newMonth = sortedMonths[currentMonthIndex + 1];
        router.push(`/dashboard/deposit-status?month=${newMonth}`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <TableHeader className="hidden md:table-header-group">
              <TableRow>
                <TableHead>User</TableHead>
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
                    <TableRow key={deposit.id} className="border-b last:border-b-0 md:border-b">
                      {/* --- MOBILE CARD VIEW --- */}
                      <td colSpan={7} className="p-2 md:hidden">
                        <div className="border rounded-lg p-3 space-y-3">
                          <div className="flex justify-between items-start text-sm">
                            <span className="font-semibold text-muted-foreground">User</span>
                            <div className="flex items-center space-x-2 text-right min-w-0">
                              <div className="flex flex-col flex-shrink min-w-0">
                                <span className="font-medium truncate">{user?.name || "Unknown User"}</span>
                                <span className="text-xs text-muted-foreground truncate">{user?.email || "N/A"}</span>
                              </div>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.picture ?? undefined} />
                                <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Amount</span><span>৳{Number(deposit.amount).toLocaleString()}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Transaction ID</span><span className="truncate">{deposit.transactionId || "N/A"}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Deposited</span><span>{format(depositDate, "dd MMM, hh:mm a")}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Approved</span><span>{approvedDate ? format(approvedDate, "dd MMM, hh:mm a") : "N/A"}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Type</span><span>{deposit.depositType === "partial" ? "Partial" : "Full"}</span></div>
                        </div>
                      </td>

                      {/* --- DESKTOP TABLE CELL VIEWS --- */}
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src={user.picture ?? undefined} />
                            <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{user?.name || "Unknown User"}</span>
                            <span className="text-xs text-muted-foreground">{user?.email || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">৳{Number(deposit.amount).toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">{deposit.transactionId || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{format(depositDate, "dd MMM yyyy, HH:mm")}</TableCell>
                      <TableCell className="hidden md:table-cell">{approvedDate ? format(approvedDate, "dd MMM yyyy, HH:mm") : "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
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