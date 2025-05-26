"use client";

import { useState, useEffect } from "react";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Deposit } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ReviewDepositsTable({ onAction }: { onAction: (id: number | string, action: "verified" | "rejected") => void }) {
  const { user } = useKindeAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10);
  const [verifyId, setVerifyId] = useState<number | string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const handleApprove = () => {
    if (verifyId !== null) {
      onAction(verifyId, "verified");
      setVerifyId(null);
    }
  };

  const handleReject = () => {
    setShowRejectConfirm(true);
  };

  const fetchDeposits = async () => {
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
  };

  const handleRejectConfirm = () => {
    if (verifyId !== null) {
      onAction(verifyId, "rejected");
      setShowRejectConfirm(false);
      setVerifyId(null);
    }
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };

  useEffect(() => {
    fetchDeposits();
  }, [limit]);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Email</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deposits.map((deposit) => (
            <TableRow key={deposit.id}>
              <TableCell>{deposit.userEmail}</TableCell>
              <TableCell>{deposit.month}</TableCell>
              <TableCell>৳ {Number(deposit.amount).toLocaleString()}</TableCell>
              <TableCell>{deposit.transactionId}</TableCell>
              <TableCell>{new Date(deposit.createdAt).toLocaleString()}</TableCell>
              <TableCell>{deposit.depositType === "partial" ? "Partial" : "Full"}</TableCell>
              <TableCell>
                <Button onClick={() => setVerifyId(deposit.id)}>
                  Verify
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* <div className="mt-4">
        {deposits.map(deposit => (
          <div key={deposit.id} className="border p-2 mb-2 flex justify-between">
            <span>{deposit.userEmail} - {deposit.month}</span>
            <button
              onClick={() => onApprove(deposit?.id)}
              className="bg-green-500 text-white px-2 py-1 rounded"
            >
              Approve
            </button>
          </div>
        ))}
      </div> */}
      <TableLoadMore
        loading={loading}
        hasMore={hasMore}
        onClick={handleLoadMore}
      />
      {/* Verify Modal */}
      <Dialog open={verifyId !== null} onOpenChange={open => { if (!open) setVerifyId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Deposit</DialogTitle>
            <DialogDescription>
              Do you want to approve or reject this deposit?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={handleApprove}>Approve</Button>
            <Button variant="destructive" onClick={handleReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectConfirm} onOpenChange={open => { if (!open) setShowRejectConfirm(open); }}>
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
