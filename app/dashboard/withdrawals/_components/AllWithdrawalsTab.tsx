"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Withdrawal } from "@/types"; // Make sure your Withdrawal type includes fundId, reviewedBy, reviewedAt, rejectionReason
import { useEffect, useState, useCallback } from "react";
import { Eye } from "lucide-react";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore"; // Re-use this
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

// Extend the Withdrawal type to include user details from the API join
interface FullWithdrawal extends Withdrawal {
  user: {
    id: string;
    name?: string;
    mobile?: string;
    // ... any other fields from personalInfo you're joining
  } | null;
}

const ALL_MONTHS = [
  { value: "all", label: "All Months" },
  { value: "2025-01", label: "January 2025" },
  { value: "2025-02", label: "February 2025" },
  { value: "2025-03", label: "March 2025" },
  { value: "2025-04", label: "April 2025" },
  { value: "2025-05", label: "May 2025" },
  { value: "2025-06", label: "June 2025" },
  { value: "2025-07", label: "July 2025" },
  { value: "2025-08", label: "August 2025" },
  { value: "2025-09", label: "September 2025" },
  { value: "2025-10", label: "October 2025" },
  { value: "2025-11", label: "November 2025" },
  { value: "2025-12", label: "December 2025" },
  // Add more as needed, or generate dynamically
];

export default function AllWithdrawalsTab() {
  const { user } = useKindeAuth();
  const [withdrawals, setWithdrawals] = useState<FullWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0); // Current offset for pagination
  const [limit] = useState(10); // Number of items per load

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [filter, setFilter] = useState({
    status: "all",
    month: "all",
    startDate: "", // ISO-MM-DD
    endDate: "",   // ISO-MM-DD
  });

  // States for date pickers
  const [calendarStartDate, setCalendarStartDate] = useState<Date | undefined>(undefined);
  const [calendarEndDate, setCalendarEndDate] = useState<Date | undefined>(undefined);


  // MODIFIED fetchWithdrawals
  const fetchWithdrawals = useCallback(async (reset = false) => {
    // Only proceed if not already loading to prevent multiple simultaneous fetches
    // when clicking "Load More" rapidly or during fast state updates.
    // However, for the initial fetch due to filter changes, we want it to run.
    if (!reset && loading) {
      return; // Prevent duplicate fetch on subsequent loadMore calls
    }

    setLoading(true);

    let currentOffset = offset; // Use the current offset from state
    if (reset) {
      currentOffset = 0; // Reset offset to 0 for new filter/initial load
      setOffset(0);      // Update offset state immediately
      setWithdrawals([]); // Clear previous data
      setHasMore(true);  // Assume has more when resetting
    }


    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", currentOffset.toString()); // Use the calculated currentOffset

    if (filter.status !== "all") params.append("status", filter.status);
    if (filter.month !== "all") params.append("month", filter.month);
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);

    try {
      const res = await fetch(`/api/withdrawals?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      const { data, hasMore: newHasMore } = await res.json();

      setWithdrawals(prev => (reset ? data : [...prev, ...data]));
      setHasMore(newHasMore);

      // IMPORTANT: Update offset using functional update form to avoid dependency on 'offset' in useCallback
      // This ensures 'offset' is always the latest value when fetchWithdrawals is called
      setOffset(prevOffset => prevOffset + data.length);

    } catch (error: any) {
      console.error("Failed to fetch withdrawals:", error);
      toast.error(error.message || "Failed to fetch withdrawals.");
    } finally {
      setLoading(false);
    }
  }, [filter, limit]); // Removed 'offset' from useCallback dependencies

  // This useEffect will now only re-run when `filter` or `limit` changes,
  // or when the `fetchWithdrawals` function itself (which is now less frequently recreated) changes.
  useEffect(() => {
    fetchWithdrawals(true); // Trigger a fresh fetch when filters change
  }, [filter, fetchWithdrawals]); // Still depend on fetchWithdrawals as its reference can change due to 'filter'


  const handleLoadMore = () => {
    if (hasMore && !loading) {
      // When loading more, we rely on the `offset` state's current value
      // which is correctly updated by the previous call to `fetchWithdrawals`.
      fetchWithdrawals();
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilter(prev => ({ ...prev, [name]: value }));
    // No need to manually call fetchWithdrawals(true) here, the useEffect will catch filter changes
    // When status or month changes, reset date filters
    if (name === 'status' || name === 'month') {
      setFilter(prev => ({ ...prev, startDate: '', endDate: '' }));
      setCalendarStartDate(undefined);
      setCalendarEndDate(undefined);
    }
  };

  const handleDateChange = (range: { from?: Date, to?: Date } | undefined) => {
    // Always reset month filter when a date range is being picked or cleared
    setFilter(prev => ({ ...prev, month: 'all' }));

    let newStartDate = '';
    let newEndDate = '';
    let newCalendarStartDate: Date | undefined = undefined;
    let newCalendarEndDate: Date | undefined = undefined;

    if (range?.from) {
      newCalendarStartDate = range.from;
      newStartDate = format(range.from, 'yyyy-MM-dd');
    }

    if (range?.to) {
      newCalendarEndDate = range.to;
      newEndDate = format(range.to, 'yyyy-MM-dd');
    }

    // Update state in a single call for consistency
    setCalendarStartDate(newCalendarStartDate);
    setCalendarEndDate(newCalendarEndDate);

    setFilter(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
          <Select value={filter.status} onValueChange={(val) => handleFilterChange("status", val)}>
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
          <label htmlFor="month-filter" className="sr-only">Filter by Month</label>
          <Select value={filter.month} onValueChange={(val) => handleFilterChange("month", val)}>
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
        {(filter.status !== 'all' || filter.month !== 'all' || filter.startDate || filter.endDate) && (
          <Button variant="outline" onClick={() => {
            setFilter({ status: "all", month: "all", startDate: "", endDate: "" });
            setCalendarStartDate(undefined);
            setCalendarEndDate(undefined);
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
            {withdrawals.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No withdrawals found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((item) => {
                const requester = item.user; // Directly use user object from joined data
                const requestedAt = new Date(item.createdAt);
                const reviewedAt = item.reviewedAt ? new Date(item.reviewedAt) : null;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {/* If you also fetch Kinde user pictures, merge them here */}
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                          {requester?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span>{requester?.name || `User ID: ${item.userId}`}</span>
                          <span className="text-xs text-muted-foreground">{requester?.mobile}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>৳ {Number(item.amount).toLocaleString()}</TableCell>
                    <TableCell>{item.purpose}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                ${item.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                                ${item.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                            `}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(requestedAt, 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(requestedAt, 'hh:mm a')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.reviewedBy ? item.reviewedBy : "N/A"} {/* You might want to resolve admin/reviewer name */}
                    </TableCell>
                    <TableCell>
                      {reviewedAt ? (
                        <div>
                          <div>{format(reviewedAt, 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">{format(reviewedAt, 'hh:mm a')}</div>
                        </div>
                      ) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {item.details && (
                          <Button size="sm" variant="outline" className="h-8" title="View Details">
                            Details
                          </Button>
                        )}
                        {item.attachmentUrl && (
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setImagePreviewUrl(item.attachmentUrl)} title="View Attachment">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {item.rejectionReason && item.status === 'rejected' && (
                          <span className="text-xs text-red-600 italic">Reason: {item.rejectionReason}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />

      {/* General Image Preview Dialog (re-used) */}
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