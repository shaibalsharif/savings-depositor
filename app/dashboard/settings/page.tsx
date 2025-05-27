"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user } = useKindeAuth()
  const [groupName, setGroupName] = useState("Group Savings")
  const [targetAmount, setTargetAmount] = useState("500000")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [withdrawalApproval, setWithdrawalApproval] = useState(true)
  const [termsAndConditions, setTermsAndConditions] = useState(
    "These are the terms and conditions for the group savings program. All members must adhere to these guidelines.",
  )

  const isAdmin = true//user?.role === "admin"

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to access settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Only administrators can access and modify system settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSaveGeneralSettings = () => {
    toast({
      title: "Settings saved",
      description: "General settings have been updated successfully.",
    })
  }

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notification settings saved",
      description: "Notification preferences have been updated successfully.",
    })
  }

  const handleSaveTermsAndConditions = () => {
    toast({
      title: "Terms and conditions saved",
      description: "Terms and conditions have been updated successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and configurations</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage basic system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-amount">Target Savings Amount (৳)</Label>
                <Input
                  id="target-amount"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="withdrawal-approval">Require dual approval for withdrawals</Label>
                  <Switch
                    id="withdrawal-approval"
                    checked={withdrawalApproval}
                    onCheckedChange={setWithdrawalApproval}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, withdrawals require approval from two finance managers or admins
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneralSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for deposit verifications, withdrawal requests, and monthly reminders
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <Switch id="sms-notifications" checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Send SMS notifications for important updates and reminders
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotificationSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>Update the terms and conditions for group members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  rows={10}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveTermsAndConditions}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
