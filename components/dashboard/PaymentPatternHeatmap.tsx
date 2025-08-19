// components/dashboard/PaymentPatternHeatmap.tsx
"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, subMonths, parseISO, isSameMonth } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PaymentPattern {
  userId: string;
  month: string;
  status: 'paid' | 'missed';
  // Additional properties for delayed payments
  daysDelayed?: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
}

interface PaymentPatternHeatmapProps {
  data: PaymentPattern[];
  users: User[];
}

export default function PaymentPatternHeatmap({ data, users }: PaymentPatternHeatmapProps) {
  const months = useMemo(() => {
    const monthsArray: string[] = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      monthsArray.push(format(subMonths(today, i), 'yyyy-MM'));
    }
    return monthsArray;
  }, []);

  const getPaymentStatus = (userId: string, month: string) => {
    // This logic needs to be enhanced on the server to include `daysDelayed`
    return data.find(p => p.userId === userId && p.month === month);
  };
  
  const getCellColor = (status: 'paid' | 'missed', daysDelayed?: number) => {
      if (status === 'missed') return 'bg-red-500';
      if (!daysDelayed) return 'bg-green-500';
      if (daysDelayed <= 5) return 'bg-green-400';
      if (daysDelayed <= 10) return 'bg-yellow-400';
      if (daysDelayed <= 15) return 'bg-orange-400';
      return 'bg-red-400';
  }

  return (
    <Card className="w-full shadow-lg transition-shadow hover:shadow-xl overflow-x-auto">
      <CardHeader>
        <CardTitle>Member Payment Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 min-w-[700px]">
          <div className="grid grid-cols-[auto_repeat(12,1fr)] items-center text-xs text-muted-foreground font-semibold pl-4">
            <div></div>
            {months.map(month => (
              <div key={month} className="text-center">
                {format(parseISO(`${month}-01`), 'MMM')}
              </div>
            ))}
          </div>
          {users.map(user => (
            <div key={user.id} className="grid grid-cols-[auto_repeat(12,1fr)] items-center">
              <div className="font-medium text-sm truncate mr-2" title={user.name || user.email}>
                {user.name?.split(' ')[0] || user.email?.split('@')[0] || user.id.slice(0, 4)}
              </div>
              {months.map(month => {
                const payment = getPaymentStatus(user.id, month);
                const status = payment?.status || 'missed';
                const daysDelayed = payment?.daysDelayed;

                return (
                  <TooltipProvider key={`${user.id}-${month}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-full aspect-square rounded-sm border",
                            getCellColor(status, daysDelayed)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {user.name} - {format(parseISO(`${month}-01`), 'MMMM yyyy')}: {status}
                        {daysDelayed && ` (${daysDelayed} days late)`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}