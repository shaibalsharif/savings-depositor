"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsTab() {
  const { toast } = useToast()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then(res => res.json())
      .then(data => {
        setEmailNotifications(data.emailNotifications)
        setSmsNotifications(data.smsNotifications)
      })
      .catch(() => toast({ title: "Failed to load notification settings", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [toast])

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
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} disabled={loading}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
