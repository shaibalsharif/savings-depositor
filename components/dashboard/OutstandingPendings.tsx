// components/dashboard/OutstandingPendings.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parse } from 'date-fns';


interface User {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
}

interface OutstandingUser extends User {
  outstandingMonths: string[]; // Add the new field for outstanding months
}

interface OutstandingPendingsProps {
  outstandingUsers: OutstandingUser[];
  totalOutstanding: number;
  monthlyDepositAmount: number;
}

export default function OutstandingPendings({ outstandingUsers, totalOutstanding, monthlyDepositAmount }: OutstandingPendingsProps) {
  const totalOutstandingMembers = outstandingUsers.length;

  return (
    <Card className="lg:col-span-1 shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader>
        <CardTitle>Outstanding Pendings</CardTitle>
        <CardDescription>
          {totalOutstandingMembers} members with outstanding payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Total Outstanding</p>
          <p className="text-2xl font-bold text-destructive">৳ {totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Outstanding Month</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totalOutstandingMembers === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">All past deposits paid!</TableCell>
                </TableRow>
              ) : (
                outstandingUsers.flatMap(user =>
                  user.outstandingMonths.map((month, index) => (
                    <TableRow key={`${user.id}-${month}`}>
                      <TableCell className="font-medium">
                        {/* Only show the user name on the first row for that user */}
                        {index === 0 ? user.name || "Unknown User" : ''}
                      </TableCell>
                      <TableCell>
                        {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        ৳ {monthlyDepositAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}