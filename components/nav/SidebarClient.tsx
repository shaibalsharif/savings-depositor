"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  FileText,
  Bell,
} from "lucide-react";
// Removed LogoutLink as we use a custom logout handler for cache clearing

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
  { href: "/monthly-reports", label: "Monthly Reports", icon: <FileText size={17} /> },
  { href: "/my-profile", label: "My Profile", icon: <User size={17} /> },
  { href: "/settings/deposits", label: "Settings", icon: <Settings size={17} /> },
];

const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { href: "/deposits", label: "Deposits", icon: <Wallet size={17} /> },
  { href: "/expenses", label: "Expenses", icon: <Receipt size={17} /> },
  { href: "/investments", label: "Investments", icon: <TrendingUp size={17} /> },
  { href: "/revenue", label: "Revenue & Losses", icon: <ArrowDownUp size={17} /> },
  { href: "/monthly-reports", label: "Monthly Reports", icon: <FileText size={17} /> },
  { href: "/my-profile", label: "My Profile", icon: <User size={17} /> },
];

export function SidebarClient({
  isManagerRole,
  isCollapsed,
  toggleCollapse,
}: {
  isManagerRole: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}) {
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
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 no-print"
        style={{ background: "hsl(222 47% 8%)", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Project-13 Logo" width={32} height={32} className="rounded-lg object-cover select-none" />
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transform transition-all duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-[260px] ${isCollapsed ? "md:w-[72px]" : "md:w-[260px]"}`}
        style={{
          background: "hsl(222 47% 8%)",
          borderColor: "hsl(var(--border))",
        }}
      >
        {/* Collapse toggle button on desktop, positioned directly over the border/separator */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute top-6 -right-3 h-6 w-6 items-center justify-center rounded-full border bg-card hover:bg-accent text-muted-foreground hover:text-foreground z-50 shadow-md transition-all duration-200 select-none"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            borderColor: "hsl(var(--border))",
          }}
        >
          <ChevronRight size={14} className={`transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
        </button>

        {/* Logo Area */}
        <div
          className={`flex items-center justify-between py-5 border-b transition-all duration-300 ${
            isCollapsed ? "flex-col gap-3 px-2" : "px-5"
          }`}
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? "flex-col" : "flex-row"}`}>
            <Image src="/logo.png" alt="Project-13 Logo" width={36} height={36} className="rounded-lg object-cover select-none" />
            {!isCollapsed && (
              <div>
                <div className="font-bold text-base leading-tight" style={{ color: "hsl(var(--foreground))" }}>
                  Project 13
                </div>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {isManagerRole ? "Manager Portal" : "Member Portal"}
                </div>
              </div>
            )}
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
        <nav className={`flex-1 overflow-y-auto px-3 py-4 space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`relative flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all group ${
                isCollapsed ? "justify-center px-0" : "gap-3"
              } ${
                isActive(item.href)
                  ? "nav-link-active"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span style={{ opacity: isActive(item.href) ? 1 : 0.7 }}>{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && isActive(item.href) && (
                <ChevronRight size={14} className="ml-auto opacity-60 flex-shrink-0" />
              )}

              {/* Tooltip on collapse on hover */}
              {isCollapsed && (
                <div className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-3 py-2 rounded-md border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={`py-4 border-t space-y-1 ${isCollapsed ? "px-2" : "px-3"}`} style={{ borderColor: "hsl(var(--border))" }}>
          <Link
            href="/notifications"
            title={isCollapsed ? "Notifications" : undefined}
            className={`relative flex items-center rounded-md text-sm font-medium transition-all group mb-1 ${
              isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            } ${
              isActive("/notifications")
                ? "nav-link-active"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span style={{ opacity: isActive("/notifications") ? 1 : 0.7 }}>
              <Bell size={17} />
            </span>
            {!isCollapsed && <span>Notifications</span>}
            {isCollapsed && (
              <div className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-3 py-2 rounded-md border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                Notifications
              </div>
            )}
          </Link>

          <button 
            onClick={async () => {
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: "CLEAR_PAGES_CACHE" });
              }
              window.location.href = "/api/auth/logout";
            }}
            className={`relative flex w-full items-center rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all group ${isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}`}
          >
            <LogOut size={17} style={{ opacity: 0.7 }} />
            {!isCollapsed && <span>Sign Out</span>}
            {isCollapsed && (
              <div className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-3 py-2 rounded-md border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </button>
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
