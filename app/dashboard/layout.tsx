// Updated DashboardLayout.tsx
"use client"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { useState } from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = getKindeServerSession()
  const isUserAuthenticated = await isAuthenticated()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  if (!isUserAuthenticated) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Overlay */}
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
        
        <main className="flex-1 overflow-auto p-6 md:ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}
