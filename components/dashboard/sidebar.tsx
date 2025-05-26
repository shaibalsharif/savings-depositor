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

export function DashboardSidebar() {
  const { user, permissions, logout } = useKindeAuth()
  
  const pathname = usePathname()// In real use, you might use usePathname from next/navigation

  // Permission checks (adjust as per your Kinde permissions)
  const isAdmin = permissions?.admin === 'true'
  const isFinanceManager = permissions?.finance_manager === 'true' || isAdmin

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
      active: false,
    },
    {
      label: "Deposit Status",
      icon: Calendar,
      href: "/dashboard/deposit-status",
      active: false,
    },
    {
      label: "Deposit Settings",
      icon: Settings,
      href: "/dashboard/deposit-settings",
      active: false,
      showIf: isFinanceManager,
    },
    {
      label: "Withdrawals",
      icon: CreditCard,
      href: "/dashboard/withdrawals",
      active: false,
    },
    {
      label: "Fund Management",
      icon: Banknote,
      href: "/dashboard/funds",
      active: false,
      showIf: isFinanceManager,
    },
    {
      label: "Users",
      icon: Users,
      href: "/dashboard/users",
      active: false,
      showIf: isAdmin,
    },
    {
      label: "Members",
      icon: Users,
      href: "/dashboard/members",
      active: false,
      showIf: !isAdmin,
    },
    {
      label: "Activity Logs",
      icon: History,
      href: "/dashboard/logs",
      active: false,
      disabled: true,
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      active: false,
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      active: false,
      showIf: isFinanceManager,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: false,
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
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  route.active ? "bg-muted text-primary" : "text-muted-foreground",
                  route.disabled ? "opacity-50 pointer-events-none" : ""
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
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
            onClick={() => logout({ returnTo: window.location.origin })}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
