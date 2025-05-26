"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

import { systemSettings } from "@/lib/dummy-data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export default async function DepositSettingsPage() {
  const { toast } = useToast()
const {isAuthenticated} = getKindeServerSession();
const isUserAuthenticated = await isAuthenticated();
const {getUser} = getKindeServerSession();
const user = await getUser();
  const [monthlyAmount, setMonthlyAmount] = useState(systemSettings.monthlyDepositAmount.toString())
  const [dueDay, setDueDay] = useState(systemSettings.depositDueDay.toString())
  const [reminderDay, setReminderDay] = useState(systemSettings.reminderDay.toString())
  const [effectiveDate, setEffectiveDate] = useState("")

  const isFinanceManager = user?.role === "finance_manager" || user?.role === "admin"

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

  const handleSaveSettings = () => {
    if (!effectiveDate) {
      toast({
        title: "Missing information",
        description: "Please select an effective date for the new deposit amount.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Deposit settings updated",
      description: `Monthly deposit amount updated to ৳${monthlyAmount} effective from ${effectiveDate}.`,
    })
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
          <Button onClick={handleSaveSettings}>Save Changes</Button>
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
            onClick={() => {
              toast({
                title: "Notification settings updated",
                description: "Deposit reminder and due date settings have been updated.",
              })
            }}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
