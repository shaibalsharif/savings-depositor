// components/dashboard/PaymentPatternHeatmap.tsx
"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, parseISO, startOfMonth, addMonths } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PaymentPattern {
  userId: string;
  month: string;
  status: 'paid' | 'missed';
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
    let currentDate = startOfMonth(parseISO('2025-05-01'));
    const today = startOfMonth(new Date());

    while (currentDate <= today) {
      monthsArray.push(format(currentDate, 'yyyy-MM'));
      currentDate = addMonths(currentDate, 1);
    }
    return monthsArray;
  }, []);

  const getPaymentStatus = (userId: string, month: string) => {
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

  const gridTemplateColumns = `120px repeat(${months.length}, minmax(0, 1fr))`;

  return (
    <Card className="w-full shadow-lg transition-shadow hover:shadow-xl overflow-x-auto">
      <CardHeader>
        <CardTitle>Member Payment Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 min-w-[700px]">
          {/* Month headers */}
          <div
            className="grid items-center text-xs text-muted-foreground font-semibold"
            style={{ gridTemplateColumns }}
          >
            {/* The first empty div for the name column is what pushes it over. */}
            <div className="pl-4"></div>
            {months.map(month => (
              <div key={month} className="text-center">
                {format(parseISO(`${month}-01`), 'MMM')}
              </div>
            ))}
          </div>

          {/* User rows */}
          {users.map(user => (
            <div
              key={user.id}
              className="grid items-center gap-x-1 gap-y-1" // Reduced gap
              style={{ gridTemplateColumns }}
            >
              <div className="font-medium text-sm truncate mr-2 pl-4" title={user.name || user.email}>
                {user.name || user.email?.split('@')[0] || user.id.slice(0, 4)}
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
                            "w-4 h-4 rounded-sm border mx-auto", // Added mx-auto for horizontal centering
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