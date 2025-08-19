// app/dashboard/deposits/layout.tsx
import { DepositsTabsNav } from "@/components/dashboard/DepositsTabsNav";

export default function DepositsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Deposit Management</h1>
      <p className="mb-6 text-muted-foreground">Upload and track your deposit receipts</p>
      
      {/* The Tabs Navigation is a client component and is shared across all child pages */}
      <DepositsTabsNav />
      
      <div className="mt-6">
        {children} {/* This will render the content of the active page */}
      </div>
    </div>
  );
}

