// components/dashboard/OutstandingPendings.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
}

interface OutstandingPendingsProps {
  outstandingUsers: User[];
  totalOutstanding: number;
  monthlyDepositAmount: number;
}

export default function OutstandingPendings({ outstandingUsers, totalOutstanding, monthlyDepositAmount }: OutstandingPendingsProps) {
  return (
    <Card className="lg:col-span-1 shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader>
        <CardTitle>Outstanding Pendings</CardTitle>
        <CardDescription>
          {outstandingUsers.length} members due for this month
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
                <TableHead className="text-right">Amount Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">All deposits paid!</TableCell>
                </TableRow>
              ) : (
                outstandingUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "Unknown User"}</TableCell>
                    <TableCell className="text-right">৳ {monthlyDepositAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}