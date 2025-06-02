"use client"
import Link from "next/link"
import {
  BarChart3,
  CreditCard,
  Home,
  LogOut,
  Settings,
  Users,
  Wallet,
  Calendar,
  Bell,
  History,
  Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

export function DashboardSidebar() {
  const { user, /* permissions, logout */ } = useKindeAuth()

  const pathname = usePathname()// In real use, you might use usePathname from next/navigation

  // Permission checks (adjust as per your Kinde permissions)
  const isAdmin = true//permissions?.admin === 'true'
  const isFinanceManager = true//permissions?.finance_manager === 'true' || isAdmin

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
    {
      label: "Deposit Settings",
      icon: Settings,
      href: "/dashboard/deposit-settings",
      active: pathname === "/dashboard/deposit-settings",
      showIf: isFinanceManager,
      disabled: true,
    },
    {
      label: "Withdrawals",
      icon: CreditCard,
      href: "/dashboard/withdrawals",
      active: pathname === "/dashboard/withdrawals",
    },
    {
      label: "Fund Management",
      icon: Banknote,
      href: "/dashboard/funds",
      active: pathname === "/dashboard/funds",
      showIf: isFinanceManager,
    },
    {
      label: "Users",
      icon: Users,
      href: "/dashboard/users",
      active: pathname === "/dashboard/users",
      showIf: isAdmin,
    },
    {
      label: "Members",
      icon: Users,
      href: "/dashboard/members",
      active: pathname === "/dashboard/members",
      showIf: !isAdmin,
    },
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
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      active: pathname === "/dashboard/analytics",
      showIf: isFinanceManager,
      disabled: true, // Disable for now, implement later
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
      showIf: isAdmin,
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4 py-2">
        <h2 className="text-lg font-semibold">Group Savings</h2>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {routes.map((route) => {
            if (route.showIf === false) return null
            const isActive = route.active

            const linkContent = (
              <>
                <route.icon className="h-4 w-4" />
                {route.label}
              </>
            )

            return (
              <Link
                key={route.href}
                href={route.href}
                className="relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute inset-0 z-0 rounded-lg bg-muted"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActive ? "text-primary scale-[1.05] font-semibold" : "text-muted-foreground hover:text-primary scale-100",
                    route.disabled ? "opacity-50 pointer-events-none" : ""
                  )}
                >
                  {linkContent}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1">
            <p className="font-medium">{user?.given_name} {user?.family_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
          // onClick={() => logout({ returnTo: window.location.origin })}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
