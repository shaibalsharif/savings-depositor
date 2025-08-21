// components/dashboard/DashboardHeader.tsx
"use client";

import { useState } from "react";
import { Bell, Menu, LogOut } from "lucide-react";
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
import { Badge } from "../ui/badge";

interface DashboardHeaderProps {
    user: any;
    permissions: string[];
    unreadNotifications: any[];
    onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle, user, permissions, unreadNotifications }: DashboardHeaderProps) {
    const hasUnread = unreadNotifications.length > 0;
    const isAdmin = permissions.includes("admin");
    const isManager = permissions.includes("manager");



    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={onMenuToggle}
            >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
            </Button>

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

            <div className="ml-auto flex items-center gap-2">
                <ModeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
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
                        {hasUnread ? (
                            unreadNotifications.map((notif) => (
                                <DropdownMenuItem
                                    key={notif.id}
                                    className="flex flex-col space-y-1"
                                >
                                    <Link href={`/dashboard/notifications?id=${notif.id}`} passHref>
                                        <p className="text-sm font-medium truncate">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <DropdownMenuItem disabled>
                                <p className="text-sm text-muted-foreground">No unread notifications</p>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <Link href="/dashboard/notifications" passHref>
                            <DropdownMenuItem className="text-center justify-center">
                                See all notifications
                            </DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                {user?.id && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={user?.picture || `/placeholder.svg?height=32&width=32&text=${user?.email.charAt(0) || "J"}`}
                                        alt={user?.email}
                                    />
                                    <AvatarFallback>{user?.email.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <p className="px-2 text-sm font-thin text-justify w-full">{user.email}</p>
                            <Badge className="text-xs">{isAdmin ? "Admin" : isManager ? "Manager" : "Member"}</Badge>
                            <DropdownMenuSeparator />
                            <Link href={"/dashboard/profile"}>
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                            </Link>
                            <Link hidden={!isAdmin && !isManager} href={"/dashboard/settings"}>
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