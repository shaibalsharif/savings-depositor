"use client";

import { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { ModeToggle } from "../theme-toggler";
import Link from "next/link";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Badge } from "../ui/badge";

export function DashboardHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { getUser, getPermissions } = useKindeAuth();
  const user = getUser()
  const permissions = getPermissions()

  const isAdmin = permissions?.permissions?.includes("admin")
  const ismanager = permissions?.permissions?.includes("manager")

  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasUnread = unreadNotifications.length > 0;

  useEffect(() => {
    async function fetchUnreadNotifications() {
      if (!user?.id) {
        setUnreadNotifications([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("recipientUserId", user.id);
        params.append("isRead", "false");
        params.append("limit", "5");

        const res = await fetch(`/api/notifications?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setUnreadNotifications(data.notifications || []);
      } catch {
        setUnreadNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUnreadNotifications();
  }, [user?.id]);

  const goToUnreadNotifications = () => {
    window.location.href = "/dashboard/notifications?tab=unread";
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2"
        onClick={onMenuToggle}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search Field */}
      <div className="hidden md:block">
        <form>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>

      {/* Right Side Controls */}
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={goToUnreadNotifications}
            >
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-w-sm">
            <DropdownMenuLabel>Unread Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : hasUnread ? (
              unreadNotifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col space-y-1"
                  onClick={goToUnreadNotifications}
                >
                  <p className="text-sm font-medium truncate">{notif.message}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                <p className="text-sm text-muted-foreground">No unread notifications</p>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {user?.username && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`/placeholder.svg?height=32&width=32&text=${user?.username.charAt(0) || "J"}`}
                    alt={user?.username}
                  />
                  <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <p className="px-2 text-sm font-thin text-justify w-full">{user.username}</p>
              <Badge className="text-xs">{isAdmin ? "Admin" : ismanager ? "Manager" : "Member"}</Badge>
              <DropdownMenuSeparator />
              <Link href={"/dashboard/profile"}>
                <DropdownMenuItem>Profile</DropdownMenuItem>
              </Link>
              <Link hidden={!isAdmin && !ismanager} href={"/dashboard/settings"}>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <LogoutLink>
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </LogoutLink>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
