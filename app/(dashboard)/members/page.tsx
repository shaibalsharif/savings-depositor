import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { requireMember, isManager } from "@/lib/auth";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ColumnConfigurator } from "@/components/ui/column-configurator";
import { MemberListTable } from "./MemberListTable";
import { getMemberFullProfile } from "@/lib/queries/members";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireMember();
  const manager = await isManager();

  if (!manager) {
    return (
      <div className="max-w-xl mx-auto text-center glass p-8 rounded-xl border mt-12 space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">
          You must be a manager to view the full list of members and edit their information.
        </p>
      </div>
    );
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const isAdmin = user?.email === "shaibalsharif@gmail.com";

  // Get full member information
  const allMembers = await db.select().from(personalInfo);

  // Read full profiles including nominees for all members
  const profilesWithNominees = await Promise.all(
    allMembers.map(async (m) => {
      const full = await getMemberFullProfile(m.userId);
      const photoClean = m.photo && m.photo.startsWith("blob:") ? "" : m.photo;
      return {
        ...m,
        photo: photoClean,
        nominee: full.nominee,
      };
    })
  );

  const tableCols = [
    { id: "id", label: "ID", defaultHidden: true },
    { id: "name", label: "Name" },
    { id: "profession", label: "Profession" },
    { id: "mobile", label: "Mobile" },
    { id: "position", label: "Position" },
    { id: "joined", label: "Joined Date" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Members" }]} />
      
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allMembers.length} active members {isAdmin && "(Admin Mode)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ColumnConfigurator tableId="members-table" columns={tableCols} />
        </div>
      </div>

      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
        style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "var(--purple)" }}
      >
        <span>👁</span>
        <span>Manager Dashboard — click Edit Profile to update any member's complete details.</span>
      </div>

      <MemberListTable members={profilesWithNominees} isAdmin={isAdmin} currentUserId={user?.id || ""} />
    </div>
  );
}
