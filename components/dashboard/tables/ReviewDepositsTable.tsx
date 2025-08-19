"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2, XCircle, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import ApproveDepositModal from "@/components/ui/ApproveDepositModal";
import RejectDepositModal from "@/components/ui/RejectDepositModal";
import { useRouter, useSearchParams } from "next/navigation";
import { reviewDeposit } from "@/lib/actions/deposits/reviewDeposits";
import { toast } from "sonner";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { FullDeposit, Fund } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewDepositsTableProps {
  initialDeposits: FullDeposit[];
  funds: Fund[];
}

export default function ReviewDepositsTable({ initialDeposits, funds }: ReviewDepositsTableProps) {
  const { user } = useKindeAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<FullDeposit | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleSortChange = (column: "createdAt" | "month") => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortOrder = params.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const newSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';

    params.set('sortBy', column);
    params.set('sortOrder', newSortOrder);
    router.push(`?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (searchParams.get('sortBy') === column) {
      return searchParams.get('sortOrder') === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const handleRejectClick = (deposit: FullDeposit) => {
    setSelectedDeposit(deposit);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedDeposit) return;
    setIsActionLoading(true);
    const result = await reviewDeposit(Number(selectedDeposit.id), { // <-- FIX: Cast the ID to a number
      status: "rejected",
      rejectionReason: reason,
      fundId: undefined,
    });

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Deposit rejected successfully!");
      setShowRejectModal(false);
      router.refresh();
    }
    setIsActionLoading(false);
  };

  const handleApproveClick = (deposit: FullDeposit) => {
    setSelectedDeposit(deposit);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async (fundId: number) => {
    if (!selectedDeposit || !user?.id) {
      toast.error("Invalid data for approval.");
      return;
    }
    setIsActionLoading(true);
    const result = await reviewDeposit(Number(selectedDeposit.id), { // <-- FIX: Cast the ID to a number
      status: "verified",
      fundId: fundId,
    });
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Deposit approved successfully!");
      setShowApproveModal(false);
      router.refresh();
    }
    setIsActionLoading(false);
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested By</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead onClick={() => handleSortChange('month')} className="cursor-pointer">
                <div className="flex items-center space-x-1"><span>Month</span>{getSortIcon('month')}</div>
              </TableHead>
              <TableHead onClick={() => handleSortChange('createdAt')} className="cursor-pointer">
                <div className="flex items-center space-x-1"><span>Submitted Date</span>{getSortIcon('createdAt')}</div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialDeposits.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">No pending deposits found.</TableCell></TableRow>
            ) : (
              initialDeposits.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar><AvatarImage src={item.user?.picture || ''} /><AvatarFallback>{item.user?.name?.[0] || 'U'}</AvatarFallback></Avatar>
                      <div className="flex flex-col gap-1">
                        <span>{item.user?.name || `User ID: ${item.userId}`}</span>
                        <span className="text-xs text-muted-foreground">{item.user?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>৳ {Number(item.amount).toLocaleString()}</TableCell>
                  <TableCell>{item.transactionId || "N/A"}</TableCell>
                  <TableCell>{format(item.createdAt, 'MMM yyyy')}</TableCell>
                  <TableCell>{format(item.createdAt, 'MMM dd, yyyy hh:mm a')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {item.imageUrl && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setImagePreviewUrl(item.imageUrl ?? null)} // FIX: Use nullish coalescing to handle undefined
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}                      <Button size="icon" variant="outline" onClick={() => handleApproveClick(item)}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                      <Button size="icon" variant="destructive" onClick={() => handleRejectClick(item)}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Image Preview</DialogTitle><DialogDescription>Preview of the attached receipt.</DialogDescription></DialogHeader>
          {imagePreviewUrl && (<div className="w-full flex justify-center"><Image src={imagePreviewUrl} alt="Preview" width={500} height={500} className="rounded" /></div>)}
          <DialogFooter><Button variant="outline" onClick={() => setImagePreviewUrl(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ApproveDepositModal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} onConfirm={handleApproveConfirm} isLoading={isActionLoading} selectedDeposit={selectedDeposit} funds={funds} />
      <RejectDepositModal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} onConfirm={handleRejectConfirm} isLoading={isActionLoading} />
    </div>
  );
}





