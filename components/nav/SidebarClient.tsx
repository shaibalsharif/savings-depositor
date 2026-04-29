"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isManager } from "@/lib/auth";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  TrendingUp,
  ArrowDownUp,
  Users,
  Settings,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const managerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { href: "/deposits", label: "Deposits", icon: <Wallet size={17} /> },
  { href: "/withdrawals", label: "Withdrawals", icon: <ArrowDownUp size={17} /> },
  { href: "/expenses", label: "Expenses", icon: <Receipt size={17} /> },
  { href: "/investments", label: "Investments", icon: <TrendingUp size={17} /> },
  { href: "/revenue", label: "Revenue & Losses", icon: <ArrowDownUp size={17} /> },
  { href: "/members", label: "Members", icon: <Users size={17} /> },
  { href: "/settings/deposits", label: "Settings", icon: <Settings size={17} /> },
];

const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { href: "/my-deposits", label: "My Deposits", icon: <Wallet size={17} /> },
  { href: "/my-profile", label: "My Profile", icon: <User size={17} /> },
];

export function SidebarClient({ isManagerRole }: { isManagerRole: boolean }) {
  const pathname = usePathname();
  const nav = isManagerRole ? managerNav : memberNav;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        background: "hsl(222 47% 8%)",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm"
          style={{ background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }}
        >
          P13
        </div>
        <div>
          <div className="font-bold text-base leading-tight" style={{ color: "hsl(var(--foreground))" }}>
            Project 13
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isManagerRole ? "Manager Portal" : "Member Portal"}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
              isActive(item.href)
                ? "nav-link-active"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span style={{ opacity: isActive(item.href) ? 1 : 0.7 }}>{item.icon}</span>
            {item.label}
            {isActive(item.href) && (
              <ChevronRight size={14} className="ml-auto opacity-60" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "hsl(var(--border))" }}>
        <LogoutLink className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
          <LogOut size={17} style={{ opacity: 0.7 }} />
          Sign Out
        </LogoutLink>
      </div>
    </aside>
  );
}
