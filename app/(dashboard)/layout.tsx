import { Sidebar } from "@/components/nav/Sidebar";
import { requireMember } from "@/lib/auth";
import { SessionGuard } from "@/components/SessionGuard";
import "@/app/dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMember();

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <SessionGuard />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-14 md:pt-0 w-full min-h-screen">
        <div className="md:ml-[260px] max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
