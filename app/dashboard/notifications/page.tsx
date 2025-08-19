"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useToast } from "@/hooks/use-toast";

import { SendDepositReminderButton } from "@/components/dashboard/settings/SendDepositReminderButton";

const PAGE_LIMIT = 10;



export default function NotificationsPage() {
  const { user } = useKindeAuth();
  const { toast } = useToast();

  // Notifications state & pagination
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<"all" | "read" | "unread" | "send">("all");

  // Users for sending notifications (all loaded at once)
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Custom notification message and sending states
  const [customMessage, setCustomMessage] = useState("");
  const [sendingCustom, setSendingCustom] = useState(false);
  const [lastReminderSent, setLastReminderSent] = useState<string | null>(null);

  const isAdminOrManager = true//user?.role === "admin" || user?.role === "manager";

  // Fetch notifications with cursor-based pagination
  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("recipientUserId", user.id);
        params.append("limit", PAGE_LIMIT.toString());
        params.append("isRead", tab === "all" ? "all" : tab === "read" ? "true" : "false");
        if (!reset && nextCursor) {
          params.append("cursor", nextCursor);
        }

        const res = await fetch(`/api/notifications?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();

        setNotifications((prev) => (reset ? data.notifications : [...prev, ...data.notifications]));
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.nextCursor));
      } catch {
        toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [user?.id, nextCursor, tab, toast]
  );

  // Initial and tab-change fetch
  useEffect(() => {
    setNextCursor(null);
    setHasMore(true);
    fetchNotifications(true);
    if (tab === "unread" && notifications.length > 0) {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length === 0) return;

      async function markUnreadAsRead() {
        try {
          const res = await fetch("/api/notifications/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationIds: unreadIds }),
          });
          if (!res.ok) throw new Error("Failed to mark notifications as read");
          setNotifications((prev) =>
            prev.map((n) => (unreadIds.includes(n.id) ? { ...n, isRead: true } : n))
          );
        } catch {
          toast({ title: "Error", description: "Failed to mark notifications as read", variant: "destructive" });
        }
      }

      markUnreadAsRead();
    }

  }, [fetchNotifications, tab]);

  // Load all users at once from Kinde Management API for Send Notification tab
  useEffect(() => {
    if (!isAdminOrManager || tab !== "send") return;

    async function fetchAllUsers() {
      setLoadingUsers(true);
      try {
        const tokenRes = await fetch("/api/kinde/token"); // your token API
        const tokenData = await tokenRes.json();
        const res = await fetch(`${process.env.NEXT_PUBLIC_KINDE_ISSUER_URL}/api/v1/users`, {
          headers: { Authorization: `Bearer ${tokenData.token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data); // assuming data is full user array
      } catch {
        toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchAllUsers();
  }, [isAdminOrManager, tab, toast]);

  // Mark all unread as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    setMarkingRead(true);
    try {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length === 0) {
        toast({ title: "Success", description: "All notifications are already read" });
        setMarkingRead(false);
        return;
      }
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch {
      toast({ title: "Error", description: "Failed to mark notifications as read", variant: "destructive" });
    } finally {
      setMarkingRead(false);
    }
  };

  useEffect(() => {
    if (!isAdminOrManager) return;

    async function fetchLastReminder() {
      try {
        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
        const res = await fetch(`/api/notifications/last-deposit-reminder?month=${month}`);
        if (!res.ok) throw new Error("Failed to fetch last deposit reminder");
        const data = await res.json();
        setLastReminderSent(data.lastReminderSent);
      } catch {
        // Optionally handle error or ignore
      }
    }

    fetchLastReminder();
  }, [isAdminOrManager]);


  // Send custom notification
  const sendCustomNotification = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }
    if (!customMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }
    if (selectedUserIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one user", variant: "destructive" });
      return;
    }
    setSendingCustom(true);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: customMessage,
          recipients: selectedUserIds,
          senderUserId: user.id,
          type: "custom",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send notifications");
      }
      toast({ title: `Notification sent to ${selectedUserIds.length} users.` });
      setCustomMessage("");
      setSelectedUserIds([]);
    } catch (error: any) {
      toast({ title: error.message || "Error sending notification", variant: "destructive" });
    } finally {
      setSendingCustom(false);
    }
  };

  // Load more notifications
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(false);
    }
  };

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((n) => {
    if (tab === "all") return true;
    if (tab === "read") return n.isRead === true;
    if (tab === "unread") return n.isRead === false;
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">View your system notifications and alerts</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={markingRead || loading}>
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          {isAdminOrManager && <TabsTrigger value="send">Send Notification</TabsTrigger>}
        </TabsList>

        {/* Notifications List Tabs */}
        <TabsContent value="all" className="space-y-4">
          {loading && notifications.length === 0 ? (
            <p className="text-center text-muted-foreground">Loading notifications...</p>
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotification />
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
              {/* {hasMore && <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />} */}
            </>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {loading && notifications.length === 0 ? (
            <p className="text-center text-muted-foreground">Loading notifications...</p>
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotification message="No read notifications" />
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
              {/* {hasMore && <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />} */}
            </>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {loading && notifications.length === 0 ? (
            <p className="text-center text-muted-foreground">Loading notifications...</p>
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotification message="No unread notifications" />
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
              {/* {hasMore && <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />} */}
            </>
          )}
        </TabsContent>

        {/* Send Notification Tab */}
        {isAdminOrManager && (
          <TabsContent value="send" className="space-y-6">
            {/* Deposit Reminder Section */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Send Deposit Reminder</h3>
                <SendDepositReminderButton
                  senderUserId={user?.id || ""}
                  onSuccess={() => setLastReminderSent(new Date().toISOString())}
                />
                {lastReminderSent && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last deposit reminder sent: {new Date(lastReminderSent).toLocaleString()}
                  </p>
                )}

              </CardContent>
            </Card>

            {/* Custom Notification Section */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Send Custom Notification</h3>
                <label htmlFor="custom-message" className="mb-2 block font-medium">
                  Custom Notification Message
                </label>
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
                {loadingUsers ? (
                  <p className="text-muted-foreground">Loading users...</p>
                ) : (
                  <select
                    multiple
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={selectedUserIds}
                    onChange={(e) =>
                      setSelectedUserIds(Array.from(e.target.selectedOptions, (option) => option.value))
                    }
                    size={8}
                    disabled={sendingCustom}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email || u.id}
                      </option>
                    ))}
                  </select>
                )}

                <Button
                  onClick={sendCustomNotification}
                  disabled={sendingCustom || loadingUsers}
                  className="mt-4"
                >
                  {sendingCustom ? "Sending..." : "Send Custom Notification"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function EmptyNotification({ message = "No notifications" }: { message?: string }) {
  return (
    <Card>
      <CardContent className="flex h-40 items-center justify-center">
        <div className="text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationCard({ notification }: { notification: any }) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deposit_request":
      case "deposit_approved":
      case "deposit_reminder":
        return <Bell className="h-5 w-5 text-primary" />;
      case "verification":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "late":
        return <Clock className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "deposit_request":
        return <Badge variant="outline">Deposit Request</Badge>;
      case "deposit_approved":
        return <Badge variant="success">Deposit Approved</Badge>;
      case "deposit_reminder":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
            Reminder
          </Badge>
        );
      case "verification":
        return <Badge variant="success">Verified</Badge>;
      case "late":
        return <Badge variant="destructive">Late</Badge>;
      default:
        return <Badge variant="outline">Notification</Badge>;
    }
  };

  return (
    <Card className={notification.isRead ? "bg-card" : "bg-muted/30"}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold">{notification.type.replace(/_/g, " ").toUpperCase()}</h3>
            {getNotificationBadge(notification.type)}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
