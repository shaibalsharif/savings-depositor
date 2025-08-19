// components/dashboard/recent-withdrawals.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { format } from "date-fns"

interface RecentWithdrawalsProps {
  data: {
    id: number;
    amount: string;
    createdAt: Date;
    userId: string;
    user: { name: string | null };
    purpose: string;
  }[];
  users: any[];
}

export function RecentWithdrawals({ data, users }: RecentWithdrawalsProps) {
  const getUserDetails = (userId: string) => {
    return users.find(u => u.id === userId) || {
      first_name: "Unknown",
      last_name: "User",
      picture: null
    };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Recent Withdrawals</CardTitle>
          <CardDescription>Latest verified withdrawal requests</CardDescription>
        </div>
        <Link href={"/dashboard/withdrawals"} passHref>
          <Button variant="outline" size="sm">See All</Button>
        </Link>
      </CardHeader>
      <CardContent className="grid gap-4">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center">No recent withdrawals found.</p>
        ) : (
          data.map((withdrawal) => {
            const userDetails = getUserDetails(withdrawal.userId);
            const fullName = `${userDetails.first_name} ${userDetails.last_name}`;

            return (
              <div key={withdrawal.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={userDetails.picture || ''} />
                    <AvatarFallback>{fullName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium">{fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(withdrawal.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{Number(withdrawal.amount).toLocaleString()}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  )
}