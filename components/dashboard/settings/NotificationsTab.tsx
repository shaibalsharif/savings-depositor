"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { 
  saveNotificationSettings, 
  sendDepositReminder as sendReminderAction // FIX: Rename the imported action
} from "@/lib/actions/settings/notifications"
import { format } from "date-fns"

export default function NotificationsTab({ initialSettings }: { initialSettings: any }) {
  const { toast } = useToast();
  const { user } = useKindeAuth();
  
  const [emailNotifications, setEmailNotifications] = useState(initialSettings.emailNotifications);
  const [smsNotifications, setSmsNotifications] = useState(initialSettings.smsNotifications);
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [lastReminderSent, setLastReminderSent] = useState<string | null>(null);

  const saveSettings = async () => {
    if (!user?.id) return;
    setSaving(true);
    const result = await saveNotificationSettings({ emailNotifications, smsNotifications }, user.id);
    if ("error" in result) {
      toast({ title: "Error saving notification settings", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Notification settings saved" });
    }
    setSaving(false);
  };

  // FIX: Renamed the client-side function to handleSendReminder
  const handleSendReminder = async () => {
    if (!user?.id) {
      toast({ title: "User not authenticated", variant: "destructive" });
      return;
    }
    setSendingReminder(true);
    const month = format(new Date(), 'yyyy-MM');
    // FIX: Call the renamed server action
    const result = await sendReminderAction(month, user.id); 
    if ("error" in result) {
      toast({ title: "Error sending deposit reminder", description: result.error, variant: "destructive" });
    } else {
      toast({ title: `Deposit reminders sent to ${result.notifiedCount || 0} users.` });
      setLastReminderSent(new Date().toISOString());
    }
    setSendingReminder(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure how and when notifications are sent</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">Email Notifications</Label>
          <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={saving} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sms-notifications">SMS Notifications</Label>
          <Switch id="sms-notifications" checked={smsNotifications} onCheckedChange={setSmsNotifications} disabled={saving} />
        </div>
        <div>
          <Button onClick={handleSendReminder} disabled={sendingReminder || saving} variant="secondary">
            {sendingReminder ? "Sending Deposit Reminder..." : "Send Deposit Reminder"}
          </Button>
          {lastReminderSent && (
            <p className="mt-2 text-sm text-muted-foreground">
              Last deposit reminder sent: {new Date(lastReminderSent).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} disabled={saving}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}