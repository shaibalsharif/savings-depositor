// components/dashboard/DashboardLayoutClient.tsx
"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: any;
  permissions: string[];
  unreadNotifications: any[];
}

export default function DashboardLayoutClient({
  children,
  user,
  permissions,
  unreadNotifications,
}: DashboardLayoutClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader
        user={user}
        permissions={permissions}
        unreadNotifications={unreadNotifications}
        onMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
      />
      <div className="flex flex-1 overflow-hidden max-h-[calc(100vh-56px)]">
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <DashboardSidebar
          user={user}
          permissions={permissions}
          isMobileOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
        />

        <main className="flex-1 overflow-auto p-6 ">
          {children}
        </main>
      </div>
    </div>
  );
}