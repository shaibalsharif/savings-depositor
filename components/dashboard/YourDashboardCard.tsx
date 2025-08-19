// components/dashboard/YourDashboardCard.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function YourDashboardCard({ data }: any) {
  const { myCurrentBalance, myDepositsThisMonth } = data;
  const thisMonthDeposit = myDepositsThisMonth[0];
  const myDepositStatus = thisMonthDeposit?.status;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  return (
    <Card className="shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader>
        <CardTitle>Your Dashboard</CardTitle>
        <CardDescription>Your personal savings insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">This Month's Deposit</p>
          {myDepositStatus ? getStatusBadge(myDepositStatus) : <Badge variant="outline">Unpaid</Badge>}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Your Current Balance</p>
          <p className="text-3xl font-bold">৳ {Number(myCurrentBalance).toLocaleString()}</p>
        </div>
        {myDepositStatus === "rejected" && (
          <Link href="/dashboard/deposits" passHref>
            <Button variant="link" className="text-red-500 hover:text-red-600 p-0 h-auto">Resubmit Your Receipt</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}