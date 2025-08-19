// /app/withdrawals/_components/ApproveWithdrawalModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FullWithdrawal, Fund } from "@/types";
import Image from "next/image";
import { Eye } from "lucide-react";

interface ApproveWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fundId: number) => Promise<void>;
    isLoading: boolean;
    selectedWithdrawal: FullWithdrawal | null;
    funds: Fund[]; // FIX: Funds are now passed as a prop
}

export default function ApproveWithdrawalModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    selectedWithdrawal,
    funds, // FIX: Destructure the funds prop
}: ApproveWithdrawalModalProps) {
    const [selectedFundId, setSelectedFundId] = useState<number | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    // FIX: Remove the useEffect that fetches funds, as they are now passed as a prop.
    useEffect(() => {
        if (isOpen) {
            setSelectedFundId(null); // Reset selection when modal opens
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (selectedFundId !== null) {
            onConfirm(selectedFundId);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Approve Withdrawal</DialogTitle>
                        <DialogDescription>
                            Select the fund from which to approve this withdrawal.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedWithdrawal && selectedWithdrawal.attachmentUrl && (
                        <div className="flex justify-end pr-4">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setImagePreviewUrl(selectedWithdrawal.attachmentUrl)}
                            >
                                <Eye className="mr-2 h-4 w-4" /> View Attachment
                            </Button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
                        {funds.length > 0 ? (
                            funds.map((fund) => (
                                <div
                                    key={fund.id}
                                    className={`p-4 border rounded-md cursor-pointer transition-all duration-200
                                    ${selectedFundId === fund.id ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
                                    onClick={() => setSelectedFundId(fund.id)}
                                >
                                    <h3 className="font-semibold">{fund.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Balance: ৳ {Number(fund.balance).toLocaleString()} {fund.currency}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-center text-muted-foreground">No funds available. Please add funds first.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm} disabled={isLoading || selectedFundId === null}>
                            {isLoading ? "Confirming..." : "Confirm Approval"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog open={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Withdrawal Attachment Preview</DialogTitle>
                        <DialogDescription>Supporting document for the withdrawal request.</DialogDescription>
                    </DialogHeader>
                    {imagePreviewUrl && (
                        <div className="w-full flex justify-center">
                            <Image src={imagePreviewUrl} alt="Attachment" width={500} height={500} className="rounded" />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImagePreviewUrl(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};