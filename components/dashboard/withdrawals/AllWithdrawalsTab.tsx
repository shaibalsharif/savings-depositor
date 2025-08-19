// /app/withdrawals/_components/AllWithdrawalsTab.tsx
'use client'

import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FullWithdrawal, Fund } from "@/types";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AllWithdrawalsTabProps {
    initialWithdrawals: FullWithdrawal[];
    funds: Fund[];
}

const ALL_MONTHS = [
  { value: "all", label: "All Months" },
  { value: "2025-08", label: "August 2025" },
  { value: "2025-09", label: "September 2025" },
];

export default function AllWithdrawalsTab({ initialWithdrawals, funds }: AllWithdrawalsTabProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const [filter, setFilter] = useState({
        status: "all",
        month: "all",
        startDate: "",
        endDate: "",
    });
    
    // Sync state with URL on initial render
    useState(() => {
      const status = searchParams.get("status") || "all";
      const month = searchParams.get("month") || "all";
      const startDate = searchParams.get("startDate") || "";
      const endDate = searchParams.get("endDate") || "";
      setFilter({ status, month, startDate, endDate });
    });

    const [calendarStartDate, setCalendarStartDate] = useState<Date | undefined>(
      filter.startDate ? parseISO(filter.startDate) : undefined
    );
    const [calendarEndDate, setCalendarEndDate] = useState<Date | undefined>(
      filter.endDate ? parseISO(filter.endDate) : undefined
    );

    const filteredWithdrawals = useMemo(() => {
        return initialWithdrawals.filter(item => {
            if (filter.status !== "all" && item.status !== filter.status) return false;
            if (filter.month !== "all" && format(item.createdAt, 'yyyy-MM') !== filter.month) return false;
            if (filter.startDate && parseISO(item.createdAt.toString()) < parseISO(filter.startDate)) return false;
            if (filter.endDate && parseISO(item.createdAt.toString()) > parseISO(filter.endDate)) return false;
            return true;
        });
    }, [initialWithdrawals, filter]);

    const handleFilterChange = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        router.push(`?${params.toString()}`);
    };

    const handleDateChange = (range: { from?: Date, to?: Date } | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
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

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter */}
                <div>
                  <Select value={searchParams.get("status") || "all"} onValueChange={(val) => handleFilterChange("status", val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Month Filter */}
                <div>
                  <Select value={searchParams.get("month") || "all"} onValueChange={(val) => handleFilterChange("month", val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 {/* Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !calendarStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {calendarStartDate ? (
                        calendarEndDate ? (
                          <>
                            {format(calendarStartDate, "LLL dd, y")} -{" "}
                            {format(calendarEndDate, "LLL dd, y")}
                          </>
                        ) : (
                          format(calendarStartDate, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: calendarStartDate, to: calendarEndDate }}
                      onSelect={handleDateChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                {/* Clear Filters Button */}
                {(searchParams.get("status") !== 'all' || searchParams.get("month") !== 'all' || searchParams.get("startDate") || searchParams.get("endDate")) && (
                  <Button variant="outline" onClick={() => {
                    router.push('/dashboard/withdrawals');
                  }}>
                    Clear Filters
                  </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Requested Date</TableHead>
                            <TableHead>Reviewed By</TableHead>
                            <TableHead>Reviewed Date</TableHead>
                            <TableHead>Details/Attachment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialWithdrawals.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">No withdrawals found.</TableCell></TableRow>
                        ) : (
                            initialWithdrawals.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Avatar>
                                                <AvatarImage src={item.user?.picture || ''} />
                                                <AvatarFallback>{item.user?.name?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{item.user?.name || "Unknown User"}</span>
                                                <span className="text-xs text-muted-foreground">{item.user?.email || "N/A"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>৳ {Number(item.amount).toLocaleString()}</TableCell>
                                    <TableCell>{item.purpose}</TableCell>
                                    <TableCell>{item.status}</TableCell>
                                    <TableCell>{format(item.createdAt, 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>{item.reviewedBy || "N/A"}</TableCell>
                                    <TableCell>{item.reviewedAt ? format(item.reviewedAt, 'MMM dd, yyyy') : "N/A"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {item.attachmentUrl && (
                                                <Button size="icon" variant="outline" onClick={() => setImagePreviewUrl(item.attachmentUrl)}>
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Image Preview</DialogTitle>
                        <DialogDescription>Preview of the attached image.</DialogDescription>
                    </DialogHeader>
                    {imagePreviewUrl && (
                        <div className="w-full flex justify-center">
                            <Image src={imagePreviewUrl} alt="Preview" width={500} height={500} className="rounded" />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImagePreviewUrl(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}