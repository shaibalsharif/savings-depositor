"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FullDeposit, Fund } from "@/types";

interface ApproveDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fundId: number) => Promise<void>;
    isLoading: boolean;
    selectedDeposit: FullDeposit | null;
    funds: Fund[];
}

export default function ApproveDepositModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    selectedDeposit,
    funds,
}: ApproveDepositModalProps) {
    const [selectedFundId, setSelectedFundId] = useState<number | null>(null);

    const handleConfirm = () => {
        if (selectedFundId !== null) {
            onConfirm(selectedFundId);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Approve Deposit</DialogTitle>
                    <DialogDescription>
                        Select the fund where this deposit will be added.
                    </DialogDescription>
                </DialogHeader>

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
                                    Balance: ৳ {Number(fund.balance).toLocaleString()}
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
    );
}