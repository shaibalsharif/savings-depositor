"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Eye } from "lucide-react";
import { toggleMemberRole } from "@/lib/actions/members";
import { MemberEditModal } from "./MemberEditModal";
import { MemberViewModal } from "./MemberViewModal";
import { UserAvatar } from "@/components/ui/user-avatar";

export function MemberListTable({
  members,
  isAdmin,
  currentUserId,
}: {
  members: any[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [selectedEditMember, setSelectedEditMember] = useState<any | null>(null);
  const [selectedViewMember, setSelectedViewMember] = useState<any | null>(null);
  const [rolePending, setRolePending] = useState<string | null>(null);

  async function handleToggleRole(userId: string, currentPosition: string) {
    setRolePending(userId);
    try {
      await toggleMemberRole(userId, currentPosition);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRolePending(null);
    }
  }

  function handleNavigate(direction: "prev" | "next") {
    if (!selectedViewMember || members.length === 0) return;
    const currentIndex = members.findIndex((m) => m.userId === selectedViewMember.userId);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === "prev") {
      newIndex = currentIndex === 0 ? members.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === members.length - 1 ? 0 : currentIndex + 1;
    }
    setSelectedViewMember(members[newIndex]);
  }

  return (
    <>
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="members-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-name">Name</th>
                <th className="col-profession max-w-[120px]">Profession</th>
                <th className="col-mobile">Contact</th>
                <th className="col-position">Position</th>
                <th className="col-joined">Joined Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isUserAdminMode = isAdmin && m.userId !== currentUserId;
                return (
                  <tr key={m.userId} className="group">
                    <td className="col-id font-mono text-xs text-muted-foreground">#{m.id}</td>
                    <td className="col-name font-medium">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={m.photo} name={m.name} className="w-8 h-8" />
                        <span
                          className="line-clamp-2 overflow-hidden text-ellipsis leading-tight max-h-[2.5rem]"
                          title={m.name}
                        >
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="col-profession max-w-[120px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="line-clamp-2 overflow-hidden text-ellipsis leading-tight max-h-[2.5rem]" title={m.profession}>
                        {m.profession || "—"}
                      </span>
                    </td>
                    <td className="col-mobile">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{m.mobile}</span>
                        <span className="text-[10px] text-muted-foreground lowercase truncate max-w-[150px]" title={m.email || ""}>
                          {m.email || "no-email@set.com"}
                        </span>
                      </div>
                    </td>
                    <td className="col-position">
                      <div className="flex flex-col justify-center min-h-[44px] gap-1 relative select-none">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium self-start ${
                            m.position === "manager" ? "badge-purple" : "badge-teal"
                          }`}
                        >
                          {m.position}
                        </span>
                        {isUserAdminMode && (
                          <div className="hidden group-hover:block transition duration-200">
                            <button
                              onClick={() => handleToggleRole(m.userId, m.position)}
                              disabled={rolePending === m.userId}
                              className="text-xs font-semibold px-2 py-0.5 rounded bg-muted hover:bg-muted/80 transition text-foreground whitespace-nowrap mt-1 border"
                            >
                              {rolePending === m.userId
                                ? "Updating..."
                                : m.position === "manager"
                                ? "Revoke"
                                : "Make Manager"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="col-joined text-muted-foreground">
                      {format(new Date(m.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="col-actions">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedViewMember(m)}
                          title={`View ${m.name}`}
                          className="p-1.5 rounded-lg text-xs font-semibold border hover:bg-muted/60 bg-muted/30 transition text-foreground"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedEditMember(m)}
                          title={`Edit ${m.name}`}
                          className="p-1.5 rounded-lg text-xs font-semibold border hover:bg-muted/60 bg-muted/30 transition text-foreground"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MemberViewModal
        isOpen={!!selectedViewMember}
        onClose={() => setSelectedViewMember(null)}
        member={selectedViewMember}
        onPrev={() => handleNavigate("prev")}
        onNext={() => handleNavigate("next")}
      />

      <MemberEditModal
        isOpen={!!selectedEditMember}
        onClose={() => setSelectedEditMember(null)}
        member={selectedEditMember}
      />
    </>
  );
}
