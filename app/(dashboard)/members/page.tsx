import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { requireManager, getCurrentUserRole } from "@/lib/auth";
import { format } from "date-fns";
import { MemberRow } from "./member-row";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";

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
        <div className="flex items-center gap-3">
          <ColumnConfigurator 
            tableId="members-table" 
            columns={[
              { id: "id", label: "ID", defaultHidden: true },
              { id: "name", label: "Name" },
              { id: "profession", label: "Profession" },
              { id: "mobile", label: "Mobile" },
              { id: "position", label: "Position" },
              { id: "joined", label: "Joined Date" }
            ]} 
          />
        </div>
      </div>

      <div className="glass overflow-hidden">
        <table id="members-table" className="data-table">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th className="col-name">Name</th>
              <th className="col-profession">Profession</th>
              <th className="col-mobile">Mobile</th>
              <th className="col-position">Position</th>
              <th className="col-joined">Joined Date</th>
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
