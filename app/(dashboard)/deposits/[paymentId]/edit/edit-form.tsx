"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { previewAllocation, updatePayment, voidPayment } from "@/lib/actions/deposits";
import { toast } from "sonner";
import { Loader2, Trash } from "lucide-react";

export function EditDepositForm({ members, payment }: { members: any[], payment: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [voiding, setVoiding] = useState(false);
  
  const [memberId, setMemberId] = useState(payment.memberId);
  const [amount, setAmount] = useState(payment.amountReceived.toString());
  // handle date parsing if it's a Date object
  const formattedDate = payment.paymentDate instanceof Date 
    ? payment.paymentDate.toISOString().split("T")[0] 
    : payment.paymentDate.split("T")[0];
  const [paymentDate, setPaymentDate] = useState(formattedDate);
  const [note, setNote] = useState(payment.note || "");
  
  const [preview, setPreview] = useState<any[]>([]);

  const handlePreview = async () => {
    if (!memberId || !amount || !paymentDate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setLoading(true);
    try {
      const data = await previewAllocation(memberId, Number(amount), paymentDate);
      setPreview(data);
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Failed to preview allocation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updatePayment(payment.paymentId, {
        memberId,
        amountReceived: Number(amount),
        paymentDate,
        note
      });
      toast.success("Deposit updated successfully");
      router.push("/deposits");
    } catch (e: any) {
      toast.error(e.message || "Failed to update deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm("Are you sure you want to void this deposit? This will remove all its allocations.")) return;
    
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

  if (step === 2) {
    const selectedMember = members.find(m => m.id === memberId);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirm Re-Allocation</CardTitle>
          <CardDescription>
            Re-allocating {amount} BDT for {selectedMember?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-2">Month</th>
                  <th className="px-4 py-2 text-right">Amount Allocated</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{p.forMonth}</td>
                    <td className="px-4 py-2 text-right font-medium">{p.amountAllocated} BDT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>Back</Button>
          <Button onClick={handleSubmit} disabled={loading || preview.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Update
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label>Member</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Amount Received (BDT)</Label>
          <Input 
            type="number" 
            min="1" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Date</Label>
          <Input 
            type="date" 
            value={paymentDate} 
            onChange={(e) => setPaymentDate(e.target.value)} 
          />
        </div>

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
        <Button onClick={handlePreview} disabled={loading || !memberId || !amount || !paymentDate}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Preview Re-Allocation
        </Button>
      </CardFooter>
    </Card>
  );
}
