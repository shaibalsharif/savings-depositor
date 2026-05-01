"use client";

import { useState, useEffect } from "react";
import { SidebarClient } from "./SidebarClient";

export function CollapsibleLayout({
  isManagerRole,
  children,
}: {
  isManagerRole: boolean;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
      />
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto pt-14 md:pt-0 w-full min-h-screen transition-all duration-300"
        style={{
          marginLeft: isMounted && isCollapsed ? "72px" : "260px",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
