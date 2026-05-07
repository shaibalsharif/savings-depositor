// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/kinde-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { PwaInit } from "@/components/PwaInit";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});



export const metadata: Metadata = {
  title: "Project-13",
  description: "Track monthly savings and manage deposits in a collective goal-based system.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  themeColor: "#0b0f19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <PwaInit />
            {children}
            <Toaster position="top-right" expand={false} richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
