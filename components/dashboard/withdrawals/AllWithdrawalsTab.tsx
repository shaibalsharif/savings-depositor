"use client";

import { useState } from "react";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { FullWithdrawal, Fund } from "@/types/types";

import { format, parseISO } from "date-fns";

import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Eye, CalendarIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";

import { useRouter, useSearchParams } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AllWithdrawalsTabProps {
  initialWithdrawals: FullWithdrawal[];

  funds: Fund[];
}



export default function AllWithdrawalsTab({
  initialWithdrawals,
  funds,
}: AllWithdrawalsTabProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const status = searchParams.get("status") || "all";

  const month = searchParams.get("month") || "all";

  const startDate = searchParams.get("startDate");

  const endDate = searchParams.get("endDate");

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    router.push(`?${params.toString()}`);
  };

  const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (range?.from) {
      params.set("startDate", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("startDate");
    }

    if (range?.to) {
      params.set("endDate", format(range.to, "yyyy-MM-dd"));
    } else {
      params.delete("endDate");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4">
        <Select
          value={status}
          onValueChange={(val) => handleFilterChange("status", val)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>

            <SelectItem value="pending">Pending</SelectItem>

            <SelectItem value="approved">Approved</SelectItem>

            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full sm:w-[280px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />

              {startDate ? (
                endDate ? (
                  <>
                    {format(parseISO(startDate), "LLL dd, y")} -{" "}
                    {format(parseISO(endDate), "LLL dd, y")}
                  </>
                ) : (
                  format(parseISO(startDate), "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: startDate ? parseISO(startDate) : undefined,
                to: endDate ? parseISO(endDate) : undefined,
              }}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {(status !== "all" || month !== "all" || startDate || endDate) && (
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/withdrawals")}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead>Requested By</TableHead>

              <TableHead>Amount</TableHead>

              <TableHead>Purpose</TableHead>

              <TableHead>Status</TableHead>

              <TableHead>Requested Date</TableHead>

              <TableHead>Reviewed By</TableHead>

              <TableHead>Reviewed Date</TableHead>

              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {initialWithdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No withdrawals found.
                </TableCell>
              </TableRow>
            ) : (
              initialWithdrawals.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b last:border-b-0 md:border-b"
                >
                  {/* --- MOBILE CARD VIEW --- */}

                  <td colSpan={8} className="p-2 md:hidden">
                    <div className="border rounded-lg p-3 space-y-3 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-muted-foreground">
                          Requester
                        </span>

                        <div className="flex items-center space-x-2 text-right min-w-0">
                          <div className="flex flex-col flex-shrink min-w-0">
                            <span className="font-medium truncate">
                              {item.user?.name || "Unknown"}
                            </span>

                            <span className="text-xs text-muted-foreground truncate">
                              {item.user?.email || "N/A"}
                            </span>
                          </div>

                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.user?.picture || ""} />
                            <AvatarFallback>
                              {item.user?.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Amount
                        </span>
                        <span>৳ {Number(item.amount).toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Purpose
                        </span>
                        <span className="truncate">{item.purpose}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Status
                        </span>
                        <span>{item.status}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Requested
                        </span>
                        <span>{format(item.createdAt, "MMM dd, yyyy")}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Reviewed By
                        </span>
                        <span>{item.reviewedBy || "N/A"}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Reviewed At
                        </span>
                        <span>
                          {item.reviewedAt
                            ? format(item.reviewedAt, "MMM dd, yyyy")
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">
                          Attachment
                        </span>

                        {item.attachmentUrl ? (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              setImagePreviewUrl(item.attachmentUrl)
                            }
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* --- DESKTOP TABLE CELL VIEWS --- */}

                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={item.user?.picture || ""} />
                        <AvatarFallback>
                          {item.user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <span className="font-medium">
                          {item.user?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.user?.email || "N/A"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    ৳ {Number(item.amount).toLocaleString()}
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {item.purpose}
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {item.status}
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {format(item.createdAt, "MMM dd, yyyy")}
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {item.reviewedBy || "N/A"}
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {item.reviewedAt
                      ? format(item.reviewedAt, "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {item.attachmentUrl && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setImagePreviewUrl(item.attachmentUrl)}
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!imagePreviewUrl}
        onOpenChange={() => setImagePreviewUrl(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              Preview of the attached image.
            </DialogDescription>
          </DialogHeader>

          {imagePreviewUrl && (
            <div className="w-full flex justify-center">
              <Image
                src={imagePreviewUrl}
                alt="Preview"
                width={500}
                height={500}
                className="rounded"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImagePreviewUrl(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
