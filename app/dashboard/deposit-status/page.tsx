import { db } from "@/lib/db";
import { deposits } from "@/db/schema/logs";
import { eq, and, sql } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Utility to get month string, e.g. "May 2025"
function getMonthString(date: Date) {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

// To get previous/next month
function addMonth(date: Date, diff: number) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + diff);
  return newDate;
}

export default async function DepositStatusPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  // Await searchParams for compatibility with latest Next.js
  const params = await searchParams ?? {};
  const now = new Date();
  const selectedMonth = typeof params.month === "string" && params.month
    ? params.month
    : getMonthString(now);

  // 2. Calculate previous/next months for buttons
  const selectedDate = new Date(`${selectedMonth} 01`);
  const prevMonth = getMonthString(addMonth(selectedDate, -1));
  const nextMonth = getMonthString(addMonth(selectedDate, 1));

  // 3. Query all verified deposits for this month, sorted by earliest
  const verifiedDeposits = await db
    .select()
    .from(deposits)
    .where(
      and(
        eq(deposits.month, selectedMonth),
        eq(deposits.status, "verified")
      )
    )
    .orderBy(sql`${deposits.createdAt} ASC`);

  // 4. Render as a table
  return (
    <div className="max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>
            Verified Deposits for {selectedMonth}
          </CardTitle>
          <div className="flex gap-2">
            <form method="get">
              <input type="hidden" name="month" value={prevMonth} />
              <Button type="submit" variant="outline">Previous</Button>
            </form>
            <form method="get">
              <input type="hidden" name="month" value={nextMonth} />
              <Button type="submit" variant="outline">Next</Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifiedDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No verified deposits found for this month.
                  </TableCell>
                </TableRow>
              ) : (
                verifiedDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{deposit.userEmail}</TableCell>
                    <TableCell>{deposit.month}</TableCell>
                    <TableCell>৳{Number(deposit.amount).toLocaleString()}</TableCell>
                    <TableCell>{deposit.transactionId}</TableCell>
                    <TableCell>{new Date(deposit.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{deposit.fundId ?? "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
