import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface RejectWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
}

const RejectWithdrawalModal: React.FC<RejectWithdrawalModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        onConfirm(reason);
        setReason(""); // Clear reason after confirming
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reject Withdrawal</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejecting this withdrawal request.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={5}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || !reason.trim()}>
                        {isLoading ? "Confirming..." : "Confirm Rejection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default RejectWithdrawalModal;