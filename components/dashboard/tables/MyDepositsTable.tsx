"use client";

import { useState, useMemo } from "react";
import { Deposit } from "@/types/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ReceiptDialog } from "../reciept/RecieptDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

const ROWS_PER_PAGE = 5;

interface MyDepositsTableProps {
  initialDeposits: Deposit[];
  userId: string;
}

export function MyDepositsTable({ initialDeposits, userId }: MyDepositsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(initialDeposits.length / ROWS_PER_PAGE);

  const startDateFromUrl = searchParams.get("startDate");
  const endDateFromUrl = searchParams.get("endDate");
  const calendarSelected = useMemo(() => ({
    from: startDateFromUrl ? parseISO(startDateFromUrl) : undefined,
    to: endDateFromUrl ? parseISO(endDateFromUrl) : undefined,
  }), [startDateFromUrl, endDateFromUrl]);

  const hasDepositOn = useMemo(() => {
    const dates = new Set(initialDeposits.map(d => format(parseISO(d.createdAt), 'yyyy-MM-dd')));
    return (date: Date) => !dates.has(format(date, 'yyyy-MM-dd'));
  }, [initialDeposits]);

  const paginatedDeposits = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return initialDeposits.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [initialDeposits, currentPage]);

  const openReceiptDialog = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowReceiptDialog(true);
  };

  const closeReceiptDialog = () => {
    setSelectedDeposit(null);
    setShowReceiptDialog(false);
  };

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value && value !== 'all') {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`?${params.toString()}`);
  };

  const handleDateChange = (range: { from?: Date, to?: Date } | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (range?.from) {
      params.set("startDate", format(range.from, 'yyyy-MM-dd'));
    } else {
      params.delete("startDate");
    }
    if (range?.to) {
      params.set("endDate", format(range.to, 'yyyy-MM-dd'));
    } else {
      params.delete("endDate");
    }
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (column: 'createdAt' | 'month') => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortOrder = params.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const newSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';

    params.set('sortBy', column);
    params.set('sortOrder', newSortOrder);
    router.push(`?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (searchParams.get('sortBy') === column) {
      return searchParams.get('sortOrder') === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-4">
        <Select value={searchParams.get("status") || "all"} onValueChange={(val) => handleFilterChange("status", val)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full sm:w-[280px] justify-start text-left font-normal",
                !calendarSelected.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {calendarSelected.from ? (
                calendarSelected.to ? (
                  <>
                    {format(calendarSelected.from, "LLL dd, y")} -{" "}
                    {format(calendarSelected.to, "LLL dd, y")}
                  </>
                ) : (
                  format(calendarSelected.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={calendarSelected}
              onSelect={handleDateChange}
              disabled={hasDepositOn}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {(searchParams.get("status") !== 'all' || searchParams.get("startDate") || searchParams.get("endDate")) && (
          <Button variant="outline" onClick={() => {
            router.push(`/dashboard/deposits/mydeposits?page=1`);
          }}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead onClick={() => handleSortChange('month')}><div className="flex items-center space-x-1 cursor-pointer"><span>Month</span>{getSortIcon('month')}</div></TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead onClick={() => handleSortChange('createdAt')}><div className="flex items-center space-x-1 cursor-pointer"><span>Date</span>{getSortIcon('createdAt')}</div></TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDeposits.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No deposits found</TableCell></TableRow>
            ) : (
              paginatedDeposits.map((deposit) => (
                <TableRow key={deposit.id} className="border-b last:border-b-0 md:border-b">
                  {/* --- MOBILE CARD VIEW --- */}
                  <td colSpan={7} className="p-2 md:hidden">
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Month</span><span>{format(parseISO(deposit.month + "-01"), "MMMM yyyy")}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Amount</span><span>৳ {Number(deposit.amount).toLocaleString()}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Status</span>
                        <Badge variant={deposit.status === "verified" ? "success" : deposit.status === "pending" ? "secondary" : "destructive"}>
                          {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Transaction ID</span><span className="truncate">{deposit.transactionId || "N/A"}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Date</span><span className="text-right">{format(parseISO(deposit.createdAt), "PP")}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="font-semibold text-muted-foreground">Type</span><span>{deposit.depositType === "partial" ? "Partial" : "Full"}</span></div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-muted-foreground">Action</span>
                        <button disabled={!deposit.imageUrl} onClick={() => openReceiptDialog(deposit)} className={`rounded px-3 py-1 text-sm text-white ${deposit.imageUrl ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}>
                          Show Receipt
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* --- DESKTOP TABLE CELL VIEWS --- */}
                  <TableCell className="hidden md:table-cell">{format(parseISO(deposit.month + "-01"), "MMMM yyyy")}</TableCell>
                  <TableCell className="hidden md:table-cell">৳ {Number(deposit.amount).toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{deposit.transactionId || "N/A"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div>{format(parseISO(deposit.createdAt), "PP")}</div>
                      <div className="text-xs text-muted-foreground">{format(parseISO(deposit.createdAt), "p")}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={deposit.status === "verified" ? "success" : deposit.status === "pending" ? "secondary" : "destructive"}>
                      {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <button disabled={!deposit.imageUrl} onClick={() => openReceiptDialog(deposit)} className={`rounded px-3 py-1 text-white ${deposit.imageUrl ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}>
                      Show Receipt
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {initialDeposits.length > ROWS_PER_PAGE && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {selectedDeposit && (
        <ReceiptDialog
          open={showReceiptDialog}
          onOpenChange={closeReceiptDialog}
          deposit={selectedDeposit}
          user={{}}
          totalDeposit={0}
          managerName="alif"
          
        />
      )}
    </div>
  );
}