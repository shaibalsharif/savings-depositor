"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,

}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useKindeAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <DashboardSidebar
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
