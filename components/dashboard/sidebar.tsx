"use client"
import Link from "next/link"
import {

  CreditCard,
  Home,
  LogOut,
  Settings,
  Users,
  Wallet,
  Calendar,
  Bell,
  History,
  Banknote, X, Menu,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogoutLink, useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

export function DashboardSidebar({
  isMobileOpen,
  onClose,
}: {
  isMobileOpen?: boolean
  onClose?: () => void
}) {
  const { user, permissions } = useKindeAuth()

  const pathname = usePathname()// In real use, you might use usePathname from next/navigation

  // Permission checks (adjust as per your Kinde permissions)
  const isAdmin = permissions?.permissions?.includes('admin')
  const isManager = permissions?.permissions?.includes('manager')

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Deposits",
      icon: Wallet,
      href: "/dashboard/deposits",
      active: pathname === "/dashboard/deposits",
    },
    {
      label: "Deposit Status",
      icon: Calendar,
      href: "/dashboard/deposit-status",
      active: pathname === "/dashboard/deposit-status",
    },
    // {
    //   label: "Deposit Settings",
    //   icon: Settings,
    //   href: "/dashboard/deposit-settings",
    //   active: pathname === "/dashboard/deposit-settings",
    //   showIf: isManager,
    //   disabled: true,
    // },
    {
      label: "Withdrawals",
      icon: CreditCard,
      href: "/dashboard/withdrawals",
      active: pathname === "/dashboard/withdrawals",
      disabled: false
    },
    {
      label: "Fund Management",
      icon: Banknote,
      href: "/dashboard/funds",
      active: pathname === "/dashboard/funds",
      showIf: isManager || isAdmin,
    },
    {
      label: "Users",
      icon: Users,
      href: "/dashboard/users",
      active: pathname === "/dashboard/users",
      showIf: isAdmin,
    },
    // {
    //   label: "Members",
    //   icon: Users,
    //   href: "/dashboard/members",
    //   active: pathname === "/dashboard/members",
    //   showIf: !isAdmin,
    // },
    {
      label: "Activity Logs",
      icon: History,
      href: "/dashboard/logs",
      active: pathname === "/dashboard/logs",

    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      active: pathname === "/dashboard/notifications",
    },
    // {
    //   label: "Analytics",
    //   icon: BarChart3,
    //   href: "/dashboard/analytics",
    //   active: pathname === "/dashboard/analytics",
    //   showIf: isManager,
    //   disabled: true, // Disable for now, implement later
    // },
    {
      label: "Profile",
      icon: User,
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
      showIf: isAdmin || isManager,
    },
  ]

  return (
    <div
      className={cn(
        "fixed left-0 top-14 z-40 w-64 flex flex-col bg-muted/90 border-r", // start below header
        "h-[calc(100vh-56px)]", // header height = h-14 = 56px
        "transform transition-transform duration-300 ease-in-out",
        "md:relative md:top-0  md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Only needed for mobile close */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Group Savings</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Optional static header for sidebar on desktop */}
      <div className="hidden md:flex h-14 items-center border-b px-4 py-2">
        <h2 className="text-lg font-semibold">Group Savings</h2>
      </div>

      {/* Scrollable nav section */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {routes.map((route) => {
            if (route.showIf === false) return null;

            return (
              <Link key={route.href} href={route.href} className="relative">
                {route.active && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute inset-0 z-0 rounded-lg bg-muted"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    route.active
                      ? "text-primary scale-[1.05] font-semibold"
                      : "text-muted-foreground hover:text-primary scale-100",
                    route.disabled ? "opacity-50 pointer-events-none" : ""
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Pinned logout section */}
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1">
            <p className="font-medium">{user?.given_name} {user?.family_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <LogoutLink>
            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </LogoutLink>
        </div>
      </div>
    </div>


  )
}
