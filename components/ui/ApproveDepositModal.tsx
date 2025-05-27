import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export function ApproveDepositModal({ open, onClose, funds, onApprove, onReject }) {
    const [selectedFund, setSelectedFund] = useState<number | null>(null);
    useEffect(() => { if (funds.length) setSelectedFund(funds[0].id); }, [funds]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Verify Deposit</DialogTitle>
                    <DialogDescription>Select a fund to approve this deposit.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={selectedFund?.toString()} onValueChange={v => setSelectedFund(Number(v))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select fund" />
                        </SelectTrigger>
                        <SelectContent>
                            {funds.map(fund => (
                                <SelectItem key={fund.id} value={fund.id.toString()}>{fund.title} (৳{fund.balance})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={() => onApprove(selectedFund)} disabled={!selectedFund}>Approve</Button>
                    <Button variant="destructive" onClick={onReject}>Reject</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
