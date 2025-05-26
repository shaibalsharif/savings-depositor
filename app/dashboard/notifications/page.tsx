"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notificationData } from "@/lib/dummy-data"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function NotificationsPage() {
  const { user } = useKindeAuth()
  const [notifications, setNotifications] = useState(notificationData)

  // Filter notifications for the current user
  const userNotifications = notifications.filter((notification) => notification.userId === user?.id)

  // Group notifications by type
  const depositNotifications = userNotifications.filter(
    (notification) =>
      notification.type === "monthly" || notification.type === "reminder" || notification.type === "late",
  )
  const verificationNotifications = userNotifications.filter((notification) => notification.type === "verification")

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) =>
        notification.userId === user?.id ? { ...notification, read: true } : notification,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">View your system notifications and alerts</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {userNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            userNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          {depositNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No deposit notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            depositNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="verifications" className="space-y-4">
          {verificationNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No verification notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            verificationNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationCard({ notification }: { notification: any }) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "monthly":
        return <Bell className="h-5 w-5 text-primary" />
      case "reminder":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "late":
        return <Clock className="h-5 w-5 text-destructive" />
      case "verification":
        return <CheckCircle className="h-5 w-5 text-success" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "monthly":
        return <Badge variant="outline">Monthly</Badge>
      case "reminder":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
            Reminder
          </Badge>
        )
      case "late":
        return <Badge variant="destructive">Late</Badge>
      case "verification":
        return <Badge variant="success">Verified</Badge>
      default:
        return <Badge variant="outline">Notification</Badge>
    }
  }

  return (
    <Card className={notification.read ? "bg-card" : "bg-muted/30"}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold">{notification.title}</h3>
            {getNotificationBadge(notification.type)}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">{notification.date}</p>
        </div>
      </CardContent>
    </Card>
  )
}
