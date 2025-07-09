"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Withdrawal } from "@/types";
import { useEffect, useState } from "react";
import ApproveWithdrawalModal from "./ApproveWithdrawalModal";
import RejectWithdrawalModal from "./RejectWithdrawalModal";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const MONTHS = [
    "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025", "July 2025",
    "August 2025", "September 2025", "October 2025", "November 2025", "December 2025"
];

export default function PendingWithdrawalsTab() {
    const { user } = useKindeAuth();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [limit, setLimit] = useState(10);
    const [userMap, setUserMap] = useState<Record<string, any>>({});

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const [filter, setFilter] = useState({
        status: "all",
        month: "all",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        fetchPendingWithdrawals();
    }, [limit, filter]);

    useEffect(() => {
        const uniqueUserIds = Array.from(new Set(withdrawals.map(d => d.userId).filter(Boolean)));
        let cancelled = false;

        async function fetchUsersBatch() {
            try {
                const res = await fetch("/api/deposits/depositors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userIds: uniqueUserIds }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to fetch users batch");
                }
                const data = await res.json();
                if (!cancelled) {
                    setUserMap(data);
                }
            } catch (e: any) {
                if (!cancelled) setUserMap({});
                console.error(e);
                toast.error(e.message || "Failed to fetch user details.");
            }
        }

        if (uniqueUserIds.length) fetchUsersBatch();

        return () => {
            cancelled = true;
        };
    }, [withdrawals]);


    async function fetchPendingWithdrawals(reset = false) {
        if (reset) setLimit(10);
        setLoading(true);
        const params = new URLSearchParams();
        params.append("status", 'pending');
        if (filter.month !== "all") params.append("month", filter.month);
        if (filter.startDate) params.append("startDate", filter.startDate);
        if (filter.endDate) params.append("endDate", filter.endDate);
        params.append("limit", limit.toString());

        try {
            const res = await fetch(`/api/withdrawals?${params.toString()}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const { data } = await res.json();
            setWithdrawals(data || []);
            setHasMore(data && data.length >= limit);
        } catch (error: any) {
            console.error("Failed to fetch pending withdrawals:", error);
            toast.error(error.message || "Failed to fetch pending withdrawals.");
        } finally {
            setLoading(false);
        }
    }

    const handleRejectClick = (withdrawal: Withdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!selectedWithdrawal) return;

        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/withdrawals/${selectedWithdrawal.id}`, {
                method: "PUT", // Changed to PUT
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "rejected",
                    rejectionReason: reason,
                    reviewedBy: user?.id,
                    // reviewedAt is now set on the backend
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }

            toast.success("Withdrawal rejected successfully!");
            setShowRejectModal(false);
            setSelectedWithdrawal(null);
            await fetchPendingWithdrawals(true);
        } catch (error: any) {
            console.error("Failed to reject withdrawal:", error);
            toast.error(error.message || "Failed to reject withdrawal.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleApproveClick = (withdrawal: Withdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setShowApproveModal(true);
    };

    const handleApproveConfirm = async (fundId: number, withdrawal: Withdrawal) => {
        if (!withdrawal || !fundId) {
            toast.error("Invalid data for approval.");
            return;
        }

        setIsActionLoading(true);
        try {
            // Frontend now only sends ONE request to the withdrawal API
            // All fund balance updates and logging happen on the backend atomically.
            const res = await fetch(`/api/withdrawals/${withdrawal.id}`, {
                method: "PUT", // Changed to PUT
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: "approved",
                    fundId: fundId, // Send the selected fund ID
                    reviewedBy: user?.id,
                    // reviewedAt is now set on the backend
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }

            toast.success("Withdrawal approved successfully!");
            setShowApproveModal(false);
            setSelectedWithdrawal(null);
            await fetchPendingWithdrawals(true);
        } catch (error: any) {
            console.error("Failed to approve withdrawal:", error);
            toast.error(error.message || "Failed to approve withdrawal.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleLoadMore = () => {
        setLimit(prev => prev + 10);
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
                        {withdrawals.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No pending withdrawals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            withdrawals.map((item) => {
                                const requester = userMap[item.userId];
                                const createdAt = new Date(item.createdAt);
                                const dateStr = createdAt.toLocaleDateString();
                                const timeStr = createdAt.toLocaleTimeString();

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
                                                    <span>{requester?.username || "Loading..."}</span>
                                                    <span className="text-xs text-muted-foreground">{requester?.preferred_email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>৳ {Number(item.amount).toLocaleString()}</TableCell>
                                        <TableCell>{item.purpose}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div>{dateStr}</div>
                                                <div className="text-xs text-muted-foreground">{timeStr}</div>
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

            <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />

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