"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePayment, voidPayment } from "@/lib/actions/deposits";
import { getMemberOutstandingMonths, type OutstandingMonth } from "@/lib/actions/outstanding";
import { toast } from "sonner";
import { Loader2, Trash } from "lucide-react";
import { format, addMonths, parse } from "date-fns";

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[Number(mo) - 1]} '${y.slice(2)}`;
}

export function EditDepositForm({ members, payment }: { members: any[]; payment: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);

  const [memberId, setMemberId] = useState(payment.memberId);
  const [amount, setAmount] = useState(String(Number(payment.amountReceived)));
  const formattedDate =
    payment.paymentDate instanceof Date
      ? payment.paymentDate.toISOString().split("T")[0]
      : payment.paymentDate.split("T")[0];
  const [paymentDate, setPaymentDate] = useState(formattedDate);
  // forMonth: use existing value from payment, fall back to current month
  const [forMonth, setForMonth] = useState<string>(
    payment.forMonth ?? format(new Date(), "yyyy-MM")
  );
  const [note, setNote] = useState(payment.note || "");
  const [outstanding, setOutstanding] = useState<OutstandingMonth[]>([]);

  // Build a list of month options: outstanding months + current forMonth + next 3 future months
  // so manager can always see and change the month
  const currentMonth = format(new Date(), "yyyy-MM");

  async function loadMonths(newMemberId: string) {
    setLoadingMonths(true);
    try {
      const months = await getMemberOutstandingMonths(newMemberId);
      setOutstanding(months);
    } catch {
      toast.error("Failed to load outstanding months");
    } finally {
      setLoadingMonths(false);
    }
  }

  async function handleMemberChange(newId: string) {
    setMemberId(newId);
    await loadMonths(newId);
  }

  // Month options: outstanding due months + existing forMonth + a few future months
  const dueMonths = outstanding.filter((m) => m.remaining > 0).map((m) => m.month);
  const futureMonths: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const fm = format(addMonths(parse(currentMonth, "yyyy-MM", new Date()), i), "yyyy-MM");
    futureMonths.push(fm);
  }
  const allMonthOptions = Array.from(new Set([...dueMonths, forMonth, currentMonth, ...futureMonths])).sort();

  const handleSubmit = async () => {
    if (!forMonth) { toast.error("Please select which month this payment covers"); return; }
    setLoading(true);
    try {
      await updatePayment(payment.paymentId, {
        memberId,
        amountReceived: Number(amount),
        paymentDate,
        forMonth,
        note,
      });
      toast.success("Deposit updated");
      router.push("/deposits");
    } catch (e: any) {
      toast.error(e.message || "Failed to update deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm("Are you sure you want to void this deposit? This will remove its allocation.")) return;
    setVoiding(true);
    try {
      await voidPayment(payment.paymentId);
      toast.success("Deposit voided");
      router.push("/deposits");
    } catch (e: any) {
      toast.error(e.message || "Failed to void deposit");
    } finally {
      setVoiding(false);
    }
  };

  if (payment.voided) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive font-semibold">This deposit has been voided.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Deposit</CardTitle>
        <CardDescription>
          Change the member, month, amount, or date. The allocation will update automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member */}
        <div className="space-y-2">
          <Label>Member</Label>
          <Select value={memberId} onValueChange={handleMemberChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month this payment covers */}
        <div className="space-y-2">
          <Label>
            Month This Payment Covers
            <span className="ml-1 text-xs font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>
              (YYYY-MM)
            </span>
          </Label>
          {allMonthOptions.length > 0 ? (
            <Select value={forMonth} onValueChange={(v) => setForMonth(v ?? "")} disabled={loadingMonths}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {allMonthOptions.map((m) => {
                  const o = outstanding.find((x) => x.month === m);
                  const label = formatMonth(m);
                  const suffix = o ? (o.remaining > 0 ? ` — ৳${o.remaining.toLocaleString()} due` : " — Paid") : "";
                  return (
                    <SelectItem key={m} value={m}>
                      {label}{suffix}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="month"
              value={forMonth}
              onChange={(e) => setForMonth(e.target.value)}
              placeholder="YYYY-MM"
            />
          )}
          {loadingMonths && (
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Loading outstanding months…</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label>Amount Received (BDT)</Label>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Payment Date</Label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label>Note (Optional)</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="destructive" onClick={handleVoid} disabled={voiding || loading}>
          {voiding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
          Void Deposit
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !memberId || !amount || !paymentDate || !forMonth}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Deposit
        </Button>
      </CardFooter>
    </Card>
  );
}
