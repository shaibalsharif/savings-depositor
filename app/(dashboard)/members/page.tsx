import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { requireManager, getCurrentUserRole } from "@/lib/auth";
import { format } from "date-fns";
import { MemberRow } from "./member-row";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function MembersPage() {
  await requireManager();

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const isAdmin = user?.email === "shaibalsharif@gmail.com";

  const allMembers = await db.select().from(personalInfo);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Members" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allMembers.length} active members {isAdmin && "(Admin Mode)"}
          </p>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Profession</th>
              <th>Mobile</th>
              <th>Position</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.map((m) => (
              <MemberRow key={m.userId} member={m} isAdmin={isAdmin && m.userId !== user?.id} />
            ))}
            {allMembers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
