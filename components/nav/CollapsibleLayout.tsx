"use client";

import { useState, useEffect } from "react";
import { SidebarClient } from "./SidebarClient";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CollapsibleLayout({
  isManagerRole,
  user,
  children,
}: {
  isManagerRole: boolean;
  user: { name: string; picture: string | null };
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <SidebarClient
        isManagerRole={isManagerRole}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        user={user}
      />
      <main
        className={`flex-1 overflow-x-hidden w-full min-h-screen transition-all duration-300 ml-0 ${
          pathname === '/pai2' ? 'overflow-y-hidden max-h-screen' : 'overflow-y-auto'
        } ${isMounted && isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}
      >
        {/* Top Header Bar (Desktop/Tablet) */}
        <div className="hidden md:flex sticky top-0 z-30 h-16 w-full items-center backdrop-blur-md bg-background/60 border-b border-border/40">
          <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 flex items-center justify-end">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-foreground">{user.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isManagerRole ? "Manager" : "Member"}</p>
              </div>
              <Link href="/my-profile" className="transition-transform hover:scale-105 active:scale-95">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-teal/20" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-dim flex items-center justify-center text-xs font-bold text-teal ring-2 ring-teal/20">
                    {user.name.charAt(0)}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>

        <div 
          className={`transition-all duration-300 ${
            pathname === '/pai2'
              ? 'mt-14 h-[calc(100vh-56px)] md:mt-0 md:h-[calc(100vh-64px)]'
              : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 pt-20 md:pt-8'
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
