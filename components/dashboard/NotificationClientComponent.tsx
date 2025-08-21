// components/dashboard/NotificationsClientComponent.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SendNotificationActionsTab } from "@/components/dashboard/tabs/SendNotificationActionsTab";
import Link from "next/link";
import { fetchNotificationsForUser, markNotificationsAsRead } from "@/lib/actions/notifications/notifications";

interface NotificationData {
    id: number;
    isRead: boolean;
    notification: {
        id: string; // The UUID from notifications table
        type: string;
        title: string;
        message: string;
        createdAt: Date;
        // Corrected to allow for null values from the database
        relatedEntityId: string | null; 
        relatedEntityType: string | null;
    }
}

interface NotificationsClientComponentProps {
    initialNotifications: NotificationData[];
    initialNextCursor: string | null;
    initialPrevCursor: string | null;
    initialUsers: any[];
    user: any;
    isAdminOrManager: boolean;
}

export default function NotificationsClientComponent({ initialNotifications, initialNextCursor, initialPrevCursor, initialUsers, user, isAdminOrManager }: NotificationsClientComponentProps) {
    const { toast } = useToast();

    const [notifications, setNotifications] = useState<NotificationData[]>(initialNotifications);
    const [loading, setLoading] = useState(false);
    const [markingRead, setMarkingRead] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
    const [prevCursor, setPrevCursor] = useState<string | null>(initialPrevCursor);
    const [tab, setTab] = useState<"all" | "read" | "unread" | "send">("all");
    const [users, setUsers] = useState<any[]>(initialUsers);

    // Fetch notifications with cursor-based pagination
    const fetchNotifications = useCallback(
        async (cursor: string | null, direction: 'next' | 'prev' = 'next') => {
            if (!user?.id || (!cursor && direction === 'next' && nextCursor === null)) {
                return;
            }
            setLoading(true);
            try {
                const isReadFilter = tab === "all" ? "all" : tab === "read" ? "read" : "unread";
                const data = await fetchNotificationsForUser(user.id, cursor, isReadFilter);
                
                setNotifications(data.notifications);
                setNextCursor(data.nextCursor);
                setPrevCursor(data.prevCursor);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        },
        [user?.id, tab, toast]
    );

    const markNotificationAsRead = async (id: number) => {
        try {
            const result = await markNotificationsAsRead([id]);
            if (result.success) {
                setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
        }
    };

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
            const result = await markNotificationsAsRead(unreadIds);
            if (!result.success) throw new Error(result.error);
            
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            toast({ title: "Success", description: "All notifications marked as read" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to mark notifications as read", variant: "destructive" });
        } finally {
            setMarkingRead(false);
        }
    };

    useEffect(() => {
        fetchNotifications(null, 'next');
    }, [tab, fetchNotifications]);

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

            <Tabs value={tab} onValueChange={(value) => setTab(value as any)}>
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
                    ) : notifications.length === 0 ? (
                        <EmptyNotification />
                    ) : (
                        <>
                            {notifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} onMarkAsRead={() => markNotificationAsRead(notification.id)} />
                            ))}
                            <div className="flex justify-between items-center mt-4">
                                <Button onClick={() => fetchNotifications(prevCursor, 'prev')} disabled={!prevCursor || loading}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>
                                <Button onClick={() => fetchNotifications(nextCursor, 'next')} disabled={!nextCursor || loading}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="read" className="space-y-4">
                    {loading && notifications.length === 0 ? (
                        <p className="text-center text-muted-foreground">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <EmptyNotification message="No read notifications" />
                    ) : (
                        <>
                            {notifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} onMarkAsRead={() => markNotificationAsRead(notification.id)} />
                            ))}
                            <div className="flex justify-between items-center mt-4">
                                <Button onClick={() => fetchNotifications(prevCursor, 'prev')} disabled={!prevCursor || loading}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>
                                <Button onClick={() => fetchNotifications(nextCursor, 'next')} disabled={!nextCursor || loading}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    {loading && notifications.length === 0 ? (
                        <p className="text-center text-muted-foreground">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <EmptyNotification message="No unread notifications" />
                    ) : (
                        <>
                            {notifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} onMarkAsRead={() => markNotificationAsRead(notification.id)} />
                            ))}
                            <div className="flex justify-between items-center mt-4">
                                <Button onClick={() => fetchNotifications(prevCursor, 'prev')} disabled={!prevCursor || loading}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>
                                <Button onClick={() => fetchNotifications(nextCursor, 'next')} disabled={!nextCursor || loading}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </TabsContent>

                {isAdminOrManager && (
                    <TabsContent value="send" className="space-y-6">
                        {loading ? (
                            <p className="text-center text-muted-foreground">Loading user data...</p>
                        ) : (
                            <SendNotificationActionsTab senderUserId={user?.id || ""} users={users} />
                        )}
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

function NotificationCard({ notification, onMarkAsRead }: { notification: NotificationData, onMarkAsRead: () => void }) {
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
                return <Badge variant="success">Approved</Badge>;
            case "deposit_reminder":
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                        Reminder
                    </Badge>
                );
            case "withdrawal_approved":
                return <Badge variant="success">Withdrawal Approved</Badge>;
            case "withdrawal_rejected":
                return <Badge variant="destructive">Withdrawal Rejected</Badge>;
            case "system_stats_update":
                return <Badge>Stats</Badge>;
            default:
                return <Badge variant="secondary">Notification</Badge>;
        }
    };

    return (
        <Card className={notification.isRead ? "bg-card" : "bg-muted/30"}>
            <CardContent className="flex items-start gap-4 p-4">
                <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.notification.type)}</div>
                <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                        <h3 className="font-semibold">{notification.notification.title}</h3>
                        <div className="flex items-center gap-2">
                            {!notification.isRead && (
                                <Button size="sm" variant="ghost" className="h-6" onClick={onMarkAsRead}>
                                    Mark as Read
                                </Button>
                            )}
                            {getNotificationBadge(notification.notification.type)}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{notification.notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{notification.notification.createdAt.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}