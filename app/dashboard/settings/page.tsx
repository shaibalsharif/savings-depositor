"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { Card } from "@/components/ui/card"
import TermsTab from "@/components/dashboard/settings/TermsTab"
import DepositSettingsTab from "@/components/dashboard/settings/DepositSettingsTab"
import NotificationsTab from "@/components/dashboard/settings/NotificationsTab"

export default function SettingsPage() {
  const { user, isLoading } = useKindeAuth()
  const [activeTab, setActiveTab] = useState("notifications")

  if (isLoading) return <div>Loading...</div>

  const isAdminOrManager = true//user?.role === "admin" || user?.role === "manager"

  if (!isAdminOrManager) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="max-w-md">
          <h2 className="text-xl font-semibold p-6 text-center">Access Restricted</h2>
          <p className="p-6 text-center text-muted-foreground">
            You do not have permission to access settings.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 rounded-md border bg-muted p-1">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="deposit" className="data-[state=active]:bg-background data-[state=active]:shadow">
            Deposit Settings
          </TabsTrigger>
          <TabsTrigger value="terms" className="data-[state=active]:bg-background data-[state=active]:shadow">
            Terms & Conditions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="deposit">
          <DepositSettingsTab />
        </TabsContent>

        <TabsContent value="terms">
          <TermsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
