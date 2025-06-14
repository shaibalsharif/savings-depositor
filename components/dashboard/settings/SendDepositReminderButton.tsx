"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SendDepositReminderButton({ 
  senderUserId,
  onSuccess
}: { 
  senderUserId: string;
  onSuccess?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    
    const handleSendReminder = async () => {
        if (loading) return;
 
        setLoading(true);
        try {
            const month = new Date().toISOString().slice(0, 7);
            
            const res = await fetch("/api/notifications/deposit-reminder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, senderUserId }),
            });

            const json = await res.json();

            if (!res.ok) {
                toast({ title: "Error", description: "Failed to send reminders", variant: "destructive" });
            } else {
                toast({ title: "Success", description: `Deposit reminders sent to ${json.notifiedCount} users.` });
                onSuccess?.();
            }
        } catch (error) {
            toast({ title: "Error", description: "Network error sending reminders", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleSendReminder} disabled={loading} variant="primary">
            {loading ? "Sending..." : "Send Deposit Reminder"}
        </Button>
    );
}
