// components/dashboard/funds/TransferHistoryTab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Fund {
  id: number;
  title: string;
}

interface FundTransaction {
  id: number;
  fromFundId: number | null;
  toFundId: number | null;
  amount: string;
  createdBy: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    picture: string | null;
  };
  createdAt: Date;
  description: string | null;
}

interface TransferHistoryTabProps {
  funds: Fund[];
  logs: FundTransaction[];
}

// Helper function to format the date with ordinal suffix
const formatOrdinalDate = (date: Date): string => {
  const day = format(date, 'd');
  const dayNum = parseInt(day, 10);
  const suffix = ['st', 'nd', 'rd'][((dayNum + 90) % 100 - 10) % 10 - 1] || 'th';
  return `${day}${suffix}, ${format(date, 'MMMM yyyy')}`;
};

export default function TransferHistoryTab({ funds, logs }: TransferHistoryTabProps) {
  const getFundTitle = (fundId: number | null) => {
    return funds.find(f => f.id === fundId)?.title || "N/A";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
        <CardDescription>View all fund transfers between accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No transfer history found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const logDate = new Date(log.createdAt);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="w-[120px]">
                        <div>{formatOrdinalDate(logDate)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(logDate, 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>{getFundTitle(log.fromFundId)}</TableCell>
                      <TableCell>{getFundTitle(log.toFundId)}</TableCell>
                      <TableCell>৳ {Number(log.amount).toLocaleString()}</TableCell>
                      <TableCell className="w-[200px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate text-sm">{log.description || "N/A"}</div>
                            </TooltipTrigger>
                            {log.description && <TooltipContent>{log.description}</TooltipContent>}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user.picture || ''} />
                            <AvatarFallback>{log.user.name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user.name}</span>
                            <span className="text-xs text-muted-foreground">{log.user.email}</span>
                          </div>
                        </div>
                      </TableCell>
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