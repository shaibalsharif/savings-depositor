// components/dashboard/tables/AllDepositsTable.tsx
"use client";

import { useState, useMemo } from "react";
import { AllDeposit } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReceiptDialog } from "../reciept/RecieptDialog";

const ROWS_PER_PAGE = 5;

interface AllDepositsTableProps {
  initialDeposits: AllDeposit[];
  months: string[];
  users: any[];
}

export function AllDepositsTable({ initialDeposits, months, users }: AllDepositsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<AllDeposit | null>(null);

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(initialDeposits.length / ROWS_PER_PAGE);

  const paginatedDeposits = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return initialDeposits.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [initialDeposits, currentPage]);

  const calendarSelected = useMemo(() => ({
    from: searchParams.get("startDate") ? parseISO(searchParams.get("startDate")!) : undefined,
    to: searchParams.get("endDate") ? parseISO(searchParams.get("endDate")!) : undefined,
  }), [searchParams]);

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value && value !== 'all') {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`/dashboard/deposits/alldeposits?${params.toString()}`);
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
    router.push(`/dashboard/deposits/alldeposits?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/dashboard/deposits/alldeposits?${params.toString()}`);
  };

  const handleSortChange = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = params.get('sortBy');
    const currentSortOrder = params.get('sortOrder') as 'asc' | 'desc' || 'desc';
    
    let newSortOrder = 'desc';
    if (currentSortBy === column) {
      newSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      newSortOrder = 'desc'; // Default to descending when changing column
    }
    
    params.set('sortBy', column);
    params.set('sortOrder', newSortOrder);
    params.set("page", "1"); // Reset to page 1 on sort change
    router.push(`/dashboard/deposits/alldeposits?${params.toString()}`);
  };
  
  const getSortIcon = (column: string) => {
    if (searchParams.get('sortBy') === column) {
      return searchParams.get('sortOrder') === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };
  
  const openReceiptDialog = (deposit: AllDeposit) => {
    setSelectedDeposit(deposit);
    setImagePreviewUrl(deposit.imageUrl);
  };
  
  const closeReceiptDialog = () => {
    setSelectedDeposit(null);
    setImagePreviewUrl(null);
  };
  
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-2">
        {/* User Filter */}
        <Select value={searchParams.get("userId") || "all"} onValueChange={(val) => handleFilterChange("userId", val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Status Filter */}
        <Select value={searchParams.get("status") || "all"} onValueChange={(val) => handleFilterChange("status", val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {/* Month Filter */}
        <Select value={searchParams.get("month") || "all"} onValueChange={(val) => handleFilterChange("month", val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(m => (
              <SelectItem key={m} value={m}>{format(parseISO(m + "-01"), "MMMM yyyy")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
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
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {/* Clear Filters Button */}
        {(searchParams.get("userId") || searchParams.get("status") !== 'all' || searchParams.get("month") !== 'all' || searchParams.get("startDate") || searchParams.get("endDate")) && (
          <Button variant="outline" onClick={() => {
            router.push(`/dashboard/deposits/alldeposits?page=1`);
          }}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead onClick={() => handleSortChange('month')} className="cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Month</span>
                  {getSortIcon('month')}
                </div>
              </TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead onClick={() => handleSortChange('createdAt')} className="cursor-pointer">
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {getSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDeposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No deposits found</TableCell>
              </TableRow>
            ) : (
              paginatedDeposits.map((deposit) => {
                const user = deposit.user;
                return (
                  <TableRow key={deposit.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage src={user?.picture || ''} />
                          <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{user?.name || "Unknown User"}</span>
                          <span className="text-xs text-muted-foreground">{user?.email || "N/A"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{format(parseISO(deposit.month + "-01"), "MMMM yyyy")}</TableCell>
                    <TableCell>৳ {Number(deposit.amount).toLocaleString()}</TableCell>
                    <TableCell>{deposit.transactionId || "N/A"}</TableCell>
                    <TableCell>{format(deposit.createdAt, "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={deposit.status === "verified" ? "success" : deposit.status === "pending" ? "secondary" : "destructive"}>
                        {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deposit.imageUrl && (
                        <Button size="icon" variant="outline" onClick={() => openReceiptDialog(deposit)}>
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {initialDeposits.length > ROWS_PER_PAGE && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {selectedDeposit && (
        <ReceiptDialog
          open={!!selectedDeposit}
          onOpenChange={closeReceiptDialog}
          deposit={selectedDeposit}
          user={selectedDeposit.user}
          totalDeposit={0}
          managerName="alif"
        />
      )}
    </div>
  );
}