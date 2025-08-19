// /app/withdrawals/_components/RejectWithdrawalModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RejectWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    isLoading: boolean;
}

export default function RejectWithdrawalModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: RejectWithdrawalModalProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        onConfirm(reason);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Withdrawal</DialogTitle>
                    <DialogDescription>
                        Provide a reason for rejecting this withdrawal request. This will be visible to the user.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Enter rejection reason..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isLoading || !reason.trim()}>
                        {isLoading ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}