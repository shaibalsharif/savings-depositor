// components/dashboard/MonthlyCollectionChart.tsx
"use client";

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function MonthlyCollectionChart({ data }: { data: any[] }) {
  const [startIndex, setStartIndex] = useState(Math.max(0, data.length - 6));
  const endIndex = startIndex + 6;
  const slicedData = data.slice(startIndex, endIndex);

  const canGoPrev = startIndex > 0;
  const canGoNext = endIndex < data.length;

  const handlePrev = () => {
    setStartIndex(prev => Math.max(0, prev - 6));
  };

  const handleNext = () => {
    setStartIndex(prev => Math.min(data.length - 6, prev + 6));
  };

  const formattedData = slicedData.map(d => ({
    month: format(new Date(d.month + '-01'), 'MMM yy'),
    Deposits: Number(d.deposits),
    Withdrawals: -Number(d.withdrawals),
  }));

  return (
    <Card className="lg:col-span-2 shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Collections & Withdrawals</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev} disabled={!canGoPrev}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext} disabled={!canGoNext}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={formattedData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Deposits" stackId="a" fill="hsl(142.1 76.2% 36.3%)" name="Deposits" />
            <Bar dataKey="Withdrawals" stackId="a" fill="hsl(0 84.2% 60.2%)" name="Withdrawals" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}