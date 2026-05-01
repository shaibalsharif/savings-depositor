"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
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
  { href: "/expenses", label: "Expenses", icon: <Receipt size={17} /> },
  { href: "/investments", label: "Investments", icon: <TrendingUp size={17} /> },
  { href: "/revenue", label: "Revenue & Losses", icon: <ArrowDownUp size={17} /> },
  { href: "/members", label: "Members", icon: <Users size={17} /> },
  { href: "/projection", label: "Fund Projection", icon: <TrendingUp size={17} /> },
  { href: "/settings/deposits", label: "Settings", icon: <Settings size={17} /> },
];

const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { href: "/deposits", label: "Deposits", icon: <Wallet size={17} /> },
  { href: "/expenses", label: "Expenses", icon: <Receipt size={17} /> },
  { href: "/investments", label: "Investments", icon: <TrendingUp size={17} /> },
  { href: "/revenue", label: "Revenue & Losses", icon: <ArrowDownUp size={17} /> },
  { href: "/members", label: "Members", icon: <Users size={17} /> },
  { href: "/projection", label: "Fund Projection", icon: <TrendingUp size={17} /> },
  { href: "/my-profile", label: "My Profile", icon: <User size={17} /> },
];

export function SidebarClient({ isManagerRole }: { isManagerRole: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  const nav = isManagerRole ? managerNav : memberNav;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top App Bar */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4" 
        style={{ background: "hsl(222 47% 8%)", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs"
            style={{ background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)" }}
          >
            P13
          </div>
          <span className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>
            Project 13
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1.5 -mr-1.5 rounded-md text-muted-foreground hover:bg-accent"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "260px",
          background: "hsl(222 47% 8%)",
          borderColor: "hsl(var(--border))",
        }}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-3">
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
          {/* Close button inside sidebar on mobile */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden p-1 -mr-2 text-muted-foreground rounded-md hover:bg-accent"
          >
            <X size={20} />
          </button>
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

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
