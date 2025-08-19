'use client'

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { reviewWithdrawal } from "@/lib/actions/withdrawals/withdrawals";
import { FullWithdrawal, Fund } from "@/types";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import ApproveWithdrawalModal from "./ApproveWithdrawalModal";
import RejectWithdrawalModal from "./RejectWithdrawalModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface PendingWithdrawalsTabProps {
    pendingWithdrawals: FullWithdrawal[];
    funds: Fund[];
    onUpdate: () => void;
}

export default function PendingWithdrawalsTab({ pendingWithdrawals, funds, onUpdate }: PendingWithdrawalsTabProps) {
    const { user } = useKindeAuth();
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<FullWithdrawal | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleRejectClick = (withdrawal: FullWithdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!selectedWithdrawal) return;
        setIsActionLoading(true);
        const result = await reviewWithdrawal(selectedWithdrawal.id, {
            status: "rejected",
            rejectionReason: reason,
            reviewedBy: user?.id!,
        });

        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success("Withdrawal rejected successfully!");
            setShowRejectModal(false);
            onUpdate();
        }
        setIsActionLoading(false);
    };

    const handleApproveClick = (withdrawal: FullWithdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setShowApproveModal(true);
    };

    const handleApproveConfirm = async (fundId: number) => {
        if (!selectedWithdrawal || !user?.id) {
            toast.error("Invalid data for approval.");
            return;
        }
        setIsActionLoading(true);
        const result = await reviewWithdrawal(selectedWithdrawal.id, {
            status: "approved",
            fundId: fundId,
            reviewedBy: user.id,
        });

        if ("error" in result) {
            toast.error(result.error);
        } else {
            toast.success("Withdrawal approved successfully!");
            setShowApproveModal(false);
            onUpdate();
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
                            <TableHead>Purpose</TableHead>
                            <TableHead>Requested Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingWithdrawals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No pending withdrawals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pendingWithdrawals.map((item) => {
                                const requester = item.user;
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {requester?.picture ? (
                                                    <Image src={requester.picture} alt={requester.name || "user image"} width={32} height={32} className="rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                                        {requester?.name?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    <span>{requester?.name || `User ID: ${item.userId}`}</span>
                                                    <span className="text-xs text-muted-foreground">{requester?.mobile}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>৳ {Number(item.amount).toLocaleString()}</TableCell>
                                        <TableCell>{item.purpose}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div>{format(item.createdAt, 'MMM dd, yyyy')}</div>
                                                <div className="text-xs text-muted-foreground">{format(item.createdAt, 'hh:mm a')}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {item.attachmentUrl && (
                                                    <Button size="icon" variant="outline" onClick={() => setImagePreviewUrl(item.attachmentUrl)}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="outline" onClick={() => handleApproveClick(item)}>
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button size="icon" variant="destructive" onClick={() => handleRejectClick(item)}>
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* General Image Preview Dialog */}
            <Dialog open={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Image Preview</DialogTitle>
                        <DialogDescription>Preview of the attached image.</DialogDescription>
                    </DialogHeader>
                    {imagePreviewUrl && (
                        <div className="w-full flex justify-center">
                            <Image src={imagePreviewUrl} alt="Preview" width={500} height={500} className="rounded" />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImagePreviewUrl(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Withdrawal Modal */}
            <ApproveWithdrawalModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApproveConfirm}
                isLoading={isActionLoading}
                selectedWithdrawal={selectedWithdrawal}
                funds={funds}
            />

            {/* Reject Withdrawal Modal */}
            <RejectWithdrawalModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleRejectConfirm}
                isLoading={isActionLoading}
            />
        </div>
    );
}