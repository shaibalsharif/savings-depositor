"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BellRing, LineChart, Clock } from "lucide-react";
import { sendMonthlyDepositReminder, sendOverdueDepositReminder, sendCurrentStatsNotification } from "@/lib/actions/notifications/reminders";
import { sendCustomNotification } from "@/lib/actions/notifications/customNotifications";

interface SendNotificationActionsProps {
  senderUserId: string;
  users: any[];
}

export function SendNotificationActionsTab({ senderUserId, users }: SendNotificationActionsProps) {
  const { toast } = useToast();

  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendingCustom, setSendingCustom] = useState(false);

  const handleSendMonthlyReminder = async () => {
    setMonthlyLoading(true);
    const result = await sendMonthlyDepositReminder(senderUserId);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setMonthlyLoading(false);
  };

  const handleSendOverdueReminder = async () => {
    setOverdueLoading(true);
    const result = await sendOverdueDepositReminder(senderUserId);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setOverdueLoading(false);
  };
  
  const handleSendStatsNotification = async () => {
    setStatsLoading(true);
    const result = await sendCurrentStatsNotification(senderUserId);
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setStatsLoading(false);
  };
  
  const handleSendCustom = async () => {
    if (!customMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message.", variant: "destructive" });
      return;
    }
    if (selectedUserIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one user.", variant: "destructive" });
      return;
    }
    
    setSendingCustom(true);
    const result = await sendCustomNotification(senderUserId, selectedUserIds, customMessage);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setCustomMessage("");
      setSelectedUserIds([]);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setSendingCustom(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">Scheduled Notifications</h3>
          <p className="text-muted-foreground">Trigger one-off notifications for reminders or updates.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={handleSendMonthlyReminder} disabled={monthlyLoading}>
              <BellRing className="mr-2 h-4 w-4" />
              {monthlyLoading ? "Sending..." : "Monthly Reminder"}
            </Button>
            <Button onClick={handleSendOverdueReminder} disabled={overdueLoading}>
              <Clock className="mr-2 h-4 w-4" />
              {overdueLoading ? "Sending..." : "Overdue Reminder"}
            </Button>
            <Button onClick={handleSendStatsNotification} disabled={statsLoading}>
              <LineChart className="mr-2 h-4 w-4" />
              {statsLoading ? "Sending..." : "Current Stats"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Send Custom Notification</h3>
          <p className="text-muted-foreground mb-4">Send a personalized message to a specific user or a group of users.</p>
          <label htmlFor="custom-message" className="mb-2 block font-medium">Custom Notification Message</label>
          <textarea
            id="custom-message"
            rows={4}
            className="w-full rounded-md border border-gray-300 p-2 mb-4"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter your message here..."
            disabled={sendingCustom}
          />

          <label className="mb-2 block font-medium">Select Users</label>
          <select
            multiple
            className="w-full rounded-md border border-gray-300 p-2"
            value={selectedUserIds}
            onChange={(e) => setSelectedUserIds(Array.from(e.target.selectedOptions, (option) => option.value))}
            size={8}
            disabled={sendingCustom}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email || u.id}
              </option>
            ))}
          </select>

          <Button onClick={handleSendCustom} disabled={sendingCustom || selectedUserIds.length === 0} className="mt-4">
            {sendingCustom ? "Sending..." : "Send Custom Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}