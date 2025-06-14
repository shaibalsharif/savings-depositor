"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function NotificationsTab() {
  const { toast } = useToast()
  const { user } = useKindeAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [lastReminderSent, setLastReminderSent] = useState<string | null>(null)

  // Load notification settings and last reminder sent date
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/notifications")
        if (!res.ok) throw new Error("Failed to load settings")
        const data = await res.json()
        setEmailNotifications(data.emailNotifications)
        setSmsNotifications(data.smsNotifications)
        setLastReminderSent(data.lastDepositReminderSent || null)
      } catch {
        toast({ title: "Failed to load notification settings", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [toast])

  // Save settings handler
  const saveSettings = async () => {
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications, smsNotifications }),
      })
      if (!res.ok) throw new Error("Failed to save notification settings")
      toast({ title: "Notification settings saved" })
    } catch {
      toast({ title: "Error saving notification settings", variant: "destructive" })
    }
  }

  // Send deposit reminder button handler
  const sendDepositReminder = async () => {
    if (!user?.id) {
      toast({ title: "User not authenticated", variant: "destructive" })
      return
    }
    setSendingReminder(true)
    try {
      const month = new Date().toISOString().slice(0, 7) // current month YYYY-MM
      const res = await fetch("/api/notifications/deposit-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, senderUserId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send deposit reminder")
      toast({ title: `Deposit reminders sent to ${data.notifiedCount} users.` })
      setLastReminderSent(new Date().toISOString())
    } catch (error: any) {
      toast({ title: error.message || "Error sending deposit reminder", variant: "destructive" })
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure how and when notifications are sent</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">Email Notifications</Label>
          <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={loading} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sms-notifications">SMS Notifications</Label>
          <Switch id="sms-notifications" checked={smsNotifications} onCheckedChange={setSmsNotifications} disabled={loading} />
        </div>
        <div>
          <Button onClick={sendDepositReminder} disabled={sendingReminder || loading} variant="secondary">
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
        <Button onClick={saveSettings} disabled={loading}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
