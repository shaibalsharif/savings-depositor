"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function DepositSettingsPage() {
  const { toast } = useToast()
  const { getUser } = useKindeAuth()
  const user = getUser()
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [reminderDay, setReminderDay] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isFinanceManager = true // Replace with your real check

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/deposit-settings")
        const { settings } = await res.json()
        setSettings(settings)
        // Set default values from the latest setting
        if (settings[0]) {
          setMonthlyAmount(settings[0].monthlyAmount)
          setDueDay(settings[0].dueDay)
          setReminderDay(settings[0].reminderDay)
        }
      } catch {
        toast({ title: "Error", description: "Failed to load settings", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [toast])

  if (!isFinanceManager) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to access deposit settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Only finance managers and administrators can access and modify deposit settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSaveSettings = async () => {
    if (!effectiveDate) {
      toast({
        title: "Missing information",
        description: "Please select an effective date for the new deposit amount.",
        variant: "destructive",
      })
      return
    }
    if (!monthlyAmount || !dueDay || !reminderDay) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }
    try {
      const res = await fetch("/api/deposit-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyAmount,
          dueDay,
          reminderDay,
          effectiveMonth: effectiveDate,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save settings",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Deposit settings updated",
        description: `Monthly deposit amount updated to ৳${monthlyAmount} effective from ${effectiveDate}.`,
      })
      // Refresh settings
      const newRes = await fetch("/api/deposit-settings")
      const { settings } = await newRes.json()
      setSettings(settings)
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deposit Settings</h1>
        <p className="text-muted-foreground">Configure monthly deposit amount and notification settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Deposit Amount</CardTitle>
          <CardDescription>Set the amount each member must deposit monthly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-amount">Monthly Deposit Amount (৳)</Label>
            <Input
              id="monthly-amount"
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective-date">Effective From</Label>
            <Input
              id="effective-date"
              type="month"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">The new amount will apply starting from the selected month</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Changing the monthly deposit amount will affect all members. Members will be notified of this change.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={loading}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure deposit reminder and due date settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-day">Reminder Day</Label>
            <Input
              id="reminder-day"
              type="number"
              min="1"
              max="28"
              value={reminderDay}
              onChange={(e) => setReminderDay(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Day of the month when reminders will be sent to members who haven't deposited yet
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-day">Due Day</Label>
            <Input
              id="due-day"
              type="number"
              min="1"
              max="28"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Day of the month after which deposits will be considered late
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      {loading && (
        <div className="text-center text-muted-foreground">Loading settings...</div>
      )}
    </div>
  )
}
