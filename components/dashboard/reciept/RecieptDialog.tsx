"use client";

import React, { forwardRef, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from "date-fns";
import { MoneyReceipt } from "./MoneyReceipt";

interface ReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deposit: any; // ideally type Deposit with extra fields
    user: any;    // user info object
    totalDeposit: number; // total deposited amount by user
    managerName: string;
}

export const ReceiptDialog = forwardRef<HTMLDivElement, ReceiptDialogProps>(
    ({ open, onOpenChange, deposit, user, totalDeposit, managerName }, ref) => {
        const printRef = useRef<HTMLDivElement>(null);

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl">
                    <MoneyReceipt
                        deposit={deposit}
                        user={user}
                        totalDeposit={totalDeposit}
                        managerName={managerName}
                    />
                    <div className="flex justify-end mt-4">
                        <Button onClick={() => window.print()}>Print</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
)


