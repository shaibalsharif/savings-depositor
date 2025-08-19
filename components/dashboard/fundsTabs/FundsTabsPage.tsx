"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { addFund, deleteFund, transferFunds, getFunds, getFundTransactions } from "@/lib/actions/funds/funds";
import { useRouter } from "next/navigation";
import TransferFundsTab from "./TransferFundsTab";
import TransferHistoryTab from "./TransferHistoryTab";

interface Fund {
  id: number;
  title: string;
  balance: string;
  currency: string;
  createdBy: string;
  createdAt: Date;
  deleted: boolean;
}

interface FundTransaction {
  id: number;
  fromFundId: number | null;
  toFundId: number | null;
  amount: string;
  createdBy: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    picture: string | null;
  };
  createdAt: Date;
  description: string | null;
}

interface FundsTabsPageProps {
  initialFunds: Fund[];
  initialLogs: FundTransaction[];
}

export default function FundsTabsPage({ initialFunds, initialLogs }: FundsTabsPageProps) {
  const { user } = useKindeAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [funds, setFunds] = useState(initialFunds);
  const [logs, setLogs] = useState(initialLogs);
  const [showAddFund, setShowAddFund] = useState(false);
  const [showDeleteFund, setShowDeleteFund] = useState<{ open: boolean, fundId?: number, fundTitle?: string }>({ open: false });
  const [newFundTitle, setNewFundTitle] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const defaultFrom = funds.length > 0 ? funds[0].id : null;
  const defaultTo = funds.length > 1 ? funds[1].id : null;

  const [transferAmount, setTransferAmount] = useState("");
  const [transferFrom, setTransferFrom] = useState<number | null>(defaultFrom);
  const [transferTo, setTransferTo] = useState<number | null>(defaultTo);
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const handleAddFund = async () => {
    if (!newFundTitle.trim() || !user?.id) {
      toast({ title: "Enter fund name", variant: "destructive" });
      return;
    }
    setAddLoading(true);
    const result = await addFund({ title: newFundTitle }, user.id);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setNewFundTitle("");
      setShowAddFund(false);
      toast({ title: "Fund created" });
      router.refresh();
    }
    setAddLoading(false);
  };

  const handleDeleteFund = async () => {
    if (!showDeleteFund.fundId || !user?.id) return;
    setDeleteLoading(true);
    const result = await deleteFund(showDeleteFund.fundId, user.id);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setShowDeleteFund({ open: false });
      toast({ title: "Fund deleted" });
      router.refresh();
    }
    setDeleteLoading(false);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund Management</h1>
          <p className="text-muted-foreground">Manage and transfer funds between accounts</p>
        </div>
        <Button onClick={() => setShowAddFund(true)}>Add New Fund</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {funds.map(fund => (
          <Card key={fund.id} className="relative group">
            <CardHeader>
              <CardTitle>{fund.title}</CardTitle>
              <CardDescription>Fund ID: {fund.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">৳ {Number(fund.balance).toLocaleString()}</div>
            </CardContent>
            {Number(fund.balance) === 0 && (
              <Trash
                onClick={() => setShowDeleteFund({ open: true, fundId: fund.id, fundTitle: fund.title })}
                className="absolute hidden group-hover:inline top-2 right-2 text-red-400 fill-red-200 opacity-75 cursor-pointer transition-opacity duration-200 hover:fill-[#af0d0d99] hover:opacity-100 hover:scale-110"
              />
            )}
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transfer">
        <TabsList>
          <TabsTrigger value="transfer">Transfer Funds</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>
        <TabsContent value="transfer">
          <TransferFundsTab funds={funds} />
        </TabsContent>
        <TabsContent value="history">
          <TransferHistoryTab funds={funds} logs={logs} />
        </TabsContent>
      </Tabs>
      
      {/* Add Fund Modal */}
      <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Fund</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="fund-title">Fund Title</Label>
            <Input
              id="fund-title"
              value={newFundTitle}
              onChange={e => setNewFundTitle(e.target.value)}
              placeholder="Enter fund name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddFund} disabled={addLoading}>{addLoading ? "Creating ..." : "Create"}</Button>
            <Button variant="outline" onClick={() => setShowAddFund(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fund Confirmation Modal */}
      <Dialog open={showDeleteFund.open} onOpenChange={open => setShowDeleteFund(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fund</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <b>{showDeleteFund.fundTitle}</b>? This can only be done if the fund balance is zero.</p>
          <DialogFooter>
            <Button variant="destructive" disabled={deleteLoading} onClick={handleDeleteFund}>{deleteLoading ? "Deleting..." : "Yes, Delete"}</Button>
            <Button variant="outline" onClick={() => setShowDeleteFund({ open: false })}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

