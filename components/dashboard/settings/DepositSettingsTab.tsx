"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function DepositSettingsTab() {
  const { toast } = useToast()
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [reminderDay, setReminderDay] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings/deposit")
      .then(res => res.json())
      .then(data => {
        if (data.settings?.length > 0) {
          const latest = data.settings[0]
          setMonthlyAmount(latest.monthlyAmount)
          setDueDay(latest.dueDay)
          setReminderDay(latest.reminderDay)
          setEffectiveDate(latest.effectiveMonth)
        }
      })
      .catch(() => toast({ title: "Failed to load deposit settings", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [toast])

  const saveSettings = async () => {
    if (!monthlyAmount || !dueDay || !reminderDay || !effectiveDate) {
      toast({ title: "Please fill all fields", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/settings/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyAmount, dueDay, reminderDay, effectiveMonth: effectiveDate }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save deposit settings")
      }
      toast({ title: "Deposit settings saved" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Settings</CardTitle>
        <CardDescription>Configure monthly deposit amount and notification dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="monthly-amount">Monthly Deposit Amount (৳)</Label>
          <Input
            id="monthly-amount"
            type="number"
            value={monthlyAmount}
            onChange={e => setMonthlyAmount(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="effective-date">Effective From</Label>
          <Input
            id="effective-date"
            type="month"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="due-day">Due Day</Label>
          <Input
            id="due-day"
            type="number"
            min={1}
            max={28}
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="reminder-day">Reminder Day</Label>
          <Input
            id="reminder-day"
            type="number"
            min={1}
            max={28}
            value={reminderDay}
            onChange={e => setReminderDay(e.target.value)}
            disabled={loading}
          />
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
