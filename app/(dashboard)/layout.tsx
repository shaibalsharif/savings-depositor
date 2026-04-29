import { Sidebar } from "@/components/nav/Sidebar";
import { requireMember } from "@/lib/auth";
import "@/app/dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMember();

  return (
    <div className="flex min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-width)", minHeight: "100vh" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
