// components/dashboard/funds/TransferFundsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { transferFunds } from "@/lib/actions/funds/funds";
import { useRouter } from "next/navigation";

interface Fund {
  id: number;
  title: string;
  balance: string;
}

interface TransferFundsTabProps {
  funds: Fund[];
}

export default function TransferFundsTab({ funds }: TransferFundsTabProps) {
  const { user } = useKindeAuth();
  const router = useRouter();
  const { toast } = useToast();

  const defaultFrom = funds.length > 0 ? funds[0].id : null;
  const defaultTo = funds.length > 1 ? funds[1].id : null;

  const [transferAmount, setTransferAmount] = useState("");
  const [transferFrom, setTransferFrom] = useState<number | null>(defaultFrom);
  const [transferTo, setTransferTo] = useState<number | null>(defaultTo);
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid transfer amount", variant: "destructive" });
      return;
    }
    if (!transferFrom || !transferTo || transferFrom === transferTo || !user?.id) {
      toast({ title: "Invalid transfer", description: "Source and destination funds must be different", variant: "destructive" });
      return;
    }
    setTransferLoading(true);
    const result = await transferFunds({
      fromFundId: transferFrom,
      toFundId: transferTo,
      amount,
      description: transferNote,
    }, user.id);
    
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Transfer successful", description: `৳${amount.toLocaleString()} transferred.` });
      setTransferAmount("");
      setTransferNote("");
      router.refresh();
    }
    setTransferLoading(false);
  };
  
  const handleSwitchAccounts = () => {
    setTransferFrom(transferTo);
    setTransferTo(transferFrom);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Between Funds</CardTitle>
        <CardDescription>Move funds between any two fund accounts</CardDescription>
      </CardHeader>
      <form onSubmit={handleTransfer}>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="from-account">From</Label>
              <select
                id="from-account"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferFrom ?? ""}
                onChange={(e) => setTransferFrom(Number(e.target.value))}
              >
                <option value="" disabled>Select fund</option>
                {funds.map(fund => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title} (৳{Number(fund.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" size="icon" className="mt-8" onClick={handleSwitchAccounts}>
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div className="flex-1 space-y-2">
              <Label htmlFor="to-account">To</Label>
              <select
                id="to-account"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferTo ?? ""}
                onChange={(e) => setTransferTo(Number(e.target.value))}
              >
                <option value="" disabled>Select fund</option>
                {funds.map(fund => (
                  <option key={fund.id} value={fund.id}>
                    {fund.title} (৳{Number(fund.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount to transfer"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note for this transfer"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={transferLoading}>
            {transferLoading ? "Transferring..." : "Transfer Funds"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}