"use client";

import { useState, useEffect } from "react";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Deposit } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { format } from "date-fns";

export function ReviewDepositsTable({ onAction }: { onAction: (id: number | string, action: "verified" | "rejected", fundId?: number) => void }) {
  const { user } = useKindeAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10);

  // Modal states
  const [selectedDepositId, setSelectedDepositId] = useState<number | string | null>(null);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState<number | null>(null);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);

  const [verifyIdForReject, setVerifyIdForReject] = useState<number | string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const [funds, setFunds] = useState<any[]>([]);

  const [userMap, setUserMap] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchDeposits();
    fetchFunds();
  }, [limit]);

  useEffect(() => {
    const uniqueUserIds = Array.from(new Set(deposits.map(d => d.userId).filter(Boolean)));
    let cancelled = false;

    async function fetchUsersBatch() {
      try {
        const res = await fetch("/api/deposits/depositors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!res.ok) throw new Error("Failed to fetch users batch");
        const data = await res.json();
        if (!cancelled) {
          setUserMap(data); // data is { userId: userData }
        }
      } catch (e) {
        if (!cancelled) setUserMap({});
        console.error(e);
      }
    }

    if (uniqueUserIds.length) fetchUsersBatch();

    return () => {
      cancelled = true;
    };
  }, [deposits]);

  // Fetch deposits
  async function fetchDeposits() {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("status", "pending");
    params.append("limit", limit.toString());
    try {
      const res = await fetch(`/api/deposits?${params.toString()}`);
      const { data } = await res.json();
      setDeposits(data || []);
      setHasMore(data && data.length >= limit);
    } finally {
      setLoading(false);
    }
  }

  // Fetch funds for selection
  async function fetchFunds() {
    const res = await fetch("/api/funds");
    const json = await res.json();
    setFunds(json.funds || []);
  }

  // Handle Verify button click: open fund selection dialog
  const handleVerifyClick = (id: number | string) => {
    setSelectedDepositId(id);
    setSelectedFundId(null);
    setShowFundDialog(true);
  };

  // After fund selection, open confirm approval dialog
  const handleFundConfirm = () => {
    if (selectedFundId !== null) {
      setShowFundDialog(false);
      setShowConfirmApprove(true);
    }
  };

  // Confirm approve action
  const handleApprove = () => {

    if (selectedDepositId !== null && selectedFundId !== null) {
      onAction(selectedDepositId, "verified", selectedFundId);
      resetModals();
    }
  };

  // Handle Reject button click: open reject confirmation dialog
  const handleRejectClick = (id: number | string) => {
    setVerifyIdForReject(id);
    setShowRejectConfirm(true);
  };

  // Confirm reject action
  const handleRejectConfirm = () => {
    if (verifyIdForReject !== null) {
      onAction(verifyIdForReject, "rejected");
      setShowRejectConfirm(false);
      setVerifyIdForReject(null);
    }
  };

  // Reset all modal states
  const resetModals = () => {
    setSelectedDepositId(null);
    setSelectedFundId(null);
    setShowFundDialog(false);
    setShowConfirmApprove(false);
    setVerifyIdForReject(null);
    setShowRejectConfirm(false);
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deposits.map((deposit) => {
            const user = userMap[deposit.userId];
            const createdAt = new Date(deposit.createdAt);
            const dateStr = createdAt.toLocaleDateString();
            const timeStr = createdAt.toLocaleTimeString();

            return (
              <TableRow key={deposit.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {user?.picture ? (
                      <Image src={user.picture} alt={user.name||"user image"} width={32} height={32} className="rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span>{user?.username || "Loading..."}</span>
                      <span className="text-xs text-muted-foreground">{user?.preferred_email}</span>
                      <span className="text-xs text-muted-foreground">{user?.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(deposit.month + "-01"), "MMMM-yy")}</TableCell>
                <TableCell>৳ {Number(deposit.amount).toLocaleString()}</TableCell>
                <TableCell>{deposit.transactionId || "N/A"}</TableCell>
                <TableCell>
                  <div>
                    <div>{dateStr}</div>
                    <div className="text-xs text-muted-foreground">{timeStr}</div>
                  </div>
                </TableCell>
                <TableCell>{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
                <TableCell className="flex flex-col gap-2">
                  <Button onClick={() => handleVerifyClick(deposit.id)}>Verify</Button>
                  {deposit.imageUrl ? (
                    <Button onClick={() => window.open(deposit.imageUrl?.toString(), "_blank")}>See Proof</Button>
                  ) : null}
                  <Button variant="destructive" onClick={() => handleRejectClick(deposit.id)}>Reject</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />

      {/* Fund Selection Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Fund to Approve Deposit</DialogTitle>
            <DialogDescription>Please select a fund to allocate this deposit.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4 max-h-96 overflow-y-auto">
            {funds.map((fund) => (
              <div
                key={fund.id}
                onClick={() => setSelectedFundId(fund.id)}
                className={`cursor-pointer border rounded p-4 shadow-sm ${selectedFundId === fund.id ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
              >
                <h3 className="font-semibold">{fund.title}</h3>
                <p>
                  Balance: {fund.balance.toLocaleString()} {fund.currency}
                </p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button disabled={!selectedFundId} onClick={handleFundConfirm}>
              Next
            </Button>
            <Button variant="outline" onClick={() => setShowFundDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Approval Dialog */}
      <Dialog open={showConfirmApprove} onOpenChange={setShowConfirmApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this deposit with the selected fund?
            </DialogDescription>
            <div className="mt-4 p-4 border rounded">
              <p><strong>Deposit ID:</strong> {selectedDepositId}</p>
              <p><strong>Fund ID:</strong> {selectedFundId}</p>
              {/* You can add more preview info here if needed */}
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleApprove}>Confirm</Button>
            <Button variant="outline" onClick={() => setShowConfirmApprove(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deposit</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this deposit?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleRejectConfirm}>Yes, Reject</Button>
            <Button variant="outline" onClick={() => setShowRejectConfirm(false)}>No</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
