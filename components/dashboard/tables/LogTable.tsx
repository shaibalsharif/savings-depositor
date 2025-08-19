"use client";

import { useMemo, useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KindeUser } from "@/lib/actions/users/users";

export interface LogEntry {
  id: number;
  userId: string;
  action: string;
  details: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
    picture: string | null;
  } | null;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  picture: string | null;
  username: string | null;
  permissions: string[];
  status: "active" | "archived";
}

interface LogTableProps {
  logs: LogEntry[];
  totalCount: number;
  showUserFilter: boolean;
  isManagerOrAdmin: boolean;
  allUsers: KindeUser[];
}

const PAGE_SIZE = 10;

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "UPLOAD_DEPOSIT", label: "Upload Deposit" },
  { value: "VERIFY_DEPOSIT", label: "Verify Deposit" },
  { value: "REJECT_DEPOSIT", label: "Reject Deposit" },
  { value: "REQUEST_WITHDRAWAL", label: "Request Withdrawal" },
  { value: "APPROVE_WITHDRAWAL", label: "Approve Withdrawal" },
  { value: "REJECT_WITHDRAWAL", label: "Reject Withdrawal" },
  { value: "CREATE_FUND", label: "Create Fund" },
  { value: "DELETE_FUND", label: "Delete Fund" },
  { value: "FUND_TRANSFER", label: "Fund Transfer" },
  { value: "ADD_USER", label: "Add User" },
  { value: "ASSIGN_MANAGER_ROLE", label: "Assign Manager" },
  { value: "REMOVE_MANAGER_ROLE", label: "Remove Manager" },
  { value: "SUSPEND_USER", label: "Suspend User" },
  { value: "UNSUSPEND_USER", label: "Unsuspend User" },
  { value: "UPDATE_PROFILE", label: "Update Profile" },
  { value: "INSERT_PERSONAL_INFO", label: "Insert Personal Info" },
  { value: "UPDATE_PERSONAL_INFO", label: "Update Personal Info" },
  { value: "INSERT_NOMINEE_INFO", label: "Insert Nominee Info" },
  { value: "UPDATE_NOMINEE_INFO", label: "Update Nominee Info" },
  { value: "NEW_DEPOSIT_SETTINGS", label: "Create Deposit Setting" },
  { value: "UPDATE_DEPOSIT_SETTINGS", label: "Update Deposit Setting" },
  { value: "DELETE_DEPOSIT_SETTINGS", label: "Delete Deposit Setting" },
  { value: "UPDATE_TERMS", label: "Update Terms" },
];

// Helper function to format log details into a human-readable message
function getFormattedLogMessage(action: string, details: any) {
  try {
    const parsedDetails = JSON.parse(details);
    switch (action) {
      case 'UPLOAD_DEPOSIT':
        return `New deposit request of ৳${Number(parsedDetails.amount).toLocaleString()} submitted for the month of ${parsedDetails.month}.`;
      case 'VERIFY_DEPOSIT':
        return `Deposit of ৳${Number(parsedDetails.amount).toLocaleString()} for user ID ${parsedDetails.depositId} was verified and added to Fund ID ${parsedDetails.fundId}.`;
      case 'REJECT_DEPOSIT':
        return `Deposit with ID ${parsedDetails.depositId} was rejected. Reason: "${parsedDetails.reason}".`;
      case 'REQUEST_WITHDRAWAL':
        return `New withdrawal request of ৳${Number(parsedDetails.amount).toLocaleString()} submitted for the purpose of "${parsedDetails.purpose}".`;
      case 'APPROVE_WITHDRAWAL':
        return `Withdrawal of ৳${Number(parsedDetails.amount).toLocaleString()} from user ID ${parsedDetails.userId} was approved from Fund ID ${parsedDetails.approvedFromFund}.`;
      case 'REJECT_WITHDRAWAL':
        return `Withdrawal request for ID ${parsedDetails.withdrawalId} was rejected. Reason: "${parsedDetails.reason}".`;
      case 'CREATE_FUND':
        return `New fund "${parsedDetails.title}" (ID: ${parsedDetails.fundId}) was created.`;
      case 'DELETE_FUND':
        return `Fund "${parsedDetails.title}" (ID: ${parsedDetails.fundId}) was soft-deleted.`;
      case 'FUND_TRANSFER':
        return `Transfer of ৳${Number(parsedDetails.amount).toLocaleString()} from Fund ID ${parsedDetails.fromFundId} to Fund ID ${parsedDetails.toFundId}.`;
      case 'ADD_USER':
        return `New user "${parsedDetails.name}" (${parsedDetails.email}) was added to the system.`;
      case 'SUSPEND_USER':
        return `User ID ${parsedDetails.userId} was suspended.`;
      case 'UNSUSPEND_USER':
        return `User ID ${parsedDetails.userId} was unsuspended.`;
      case 'ASSIGN_MANAGER_ROLE':
        return `Manager role was assigned to user ID ${parsedDetails.userId}.`;
      case 'REMOVE_MANAGER_ROLE':
        return `Manager role was removed from user ID ${parsedDetails.userId}.`;
      case 'UPDATE_PROFILE':
        return `User ID ${parsedDetails.userId} updated their profile information.`;
      case 'INSERT_PERSONAL_INFO':
        return `Personal information was first submitted for user ID ${parsedDetails.userId}.`;
      case 'UPDATE_PERSONAL_INFO':
        return `Personal information was updated for user ID ${parsedDetails.userId}.`;
      case 'INSERT_NOMINEE_INFO':
        return `Nominee information was first submitted for user ID ${parsedDetails.userId}.`;
      case 'UPDATE_NOMINEE_INFO':
        return `Nominee information was updated for user ID ${parsedDetails.userId}.`;
      case 'NEW_DEPOSIT_SETTINGS':
        return `New deposit setting created for month ${parsedDetails.effectiveMonth} with amount ৳${Number(parsedDetails.monthlyAmount).toLocaleString()}.`;
      case 'UPDATE_DEPOSIT_SETTINGS':
        return `Deposit setting for ID ${parsedDetails.settingId} was terminated by month ${parsedDetails.terminatedByMonth}.`;
      case 'DELETE_DEPOSIT_SETTINGS':
        return `Deposit setting for month ${parsedDetails.effectiveMonth} (ID: ${parsedDetails.settingId}) was deleted.`;
      case 'UPDATE_TERMS':
        return `Terms & Conditions were updated (ID: ${parsedDetails.termsId}).`;
      default:
        return "No human-readable summary available.";
    }
  } catch (e) {
    return "Error parsing log details.";
  }
}

export default function LogTable({ logs, totalCount, showUserFilter, isManagerOrAdmin, allUsers }: LogTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [calendarStartDate, setCalendarStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? parseISO(searchParams.get("startDate")!) : undefined
  );
  const [calendarEndDate, setCalendarEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? parseISO(searchParams.get("endDate")!) : undefined
  );

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<{ action: string, details: string | null } | null>(null);

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const paginatedLogs = logs;

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value && value !== 'all') {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
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
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const openDetailsModal = (log: LogEntry) => {
    setSelectedLog({ action: log.action, details: log.details });
    setShowDetailsModal(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {showUserFilter && (
          <Select value={searchParams.get("userId") || "all"} onValueChange={(val) => handleFilterChange("userId", val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {allUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={searchParams.get("action") || "all"} onValueChange={(val) => handleFilterChange("action", val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map(a => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              onSelect={(range) => handleDateChange(range as any)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {(searchParams.get('userId') || searchParams.get('action') !== 'all' || searchParams.get('startDate') || searchParams.get('endDate')) && (
          <Button variant="outline" onClick={() => router.push(showUserFilter ? '/dashboard/logs?tab=all' : '/dashboard/logs?tab=my')}>
            Clear Filters
          </Button>
        )}
      </div>
      <div className="rounded-md border relative">
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
            <p className="text-xl font-semibold">Loading...</p>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isPending ? "opacity-50" : ""}>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">No logs found.</TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={log.user?.picture || ''} />
                        <AvatarFallback>{log.user?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{log.user?.name || `ID: ${log.userId}`}</span>
                        <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-[400px]">
                    {log.details ? (
                      <Button variant="link" onClick={() => openDetailsModal(log)} className="p-0 h-auto">
                        See Details
                      </Button>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{format(log.createdAt, 'MMM dd, yyyy HH:mm')}</TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
        >
          Previous
        </Button>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
        >
          Next
        </Button>
      </div>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              A human-readable summary and the raw JSON data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              {selectedLog ? getFormattedLogMessage(selectedLog.action, selectedLog.details) : "No details available."}
            </p>
            {selectedLog?.details && (
              <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded-md">
                {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
              </pre>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}