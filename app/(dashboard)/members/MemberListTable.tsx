"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Edit2 } from "lucide-react";
import { toggleMemberRole } from "@/lib/actions/members";
import { MemberEditModal } from "./MemberEditModal";

export function MemberListTable({
  members,
  isAdmin,
  currentUserId,
}: {
  members: any[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
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

  return (
    <>
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="members-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-name">Name</th>
                <th className="col-profession">Profession</th>
                <th className="col-mobile">Mobile</th>
                <th className="col-position">Position</th>
                <th className="col-joined">Joined Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isUserAdminMode = isAdmin && m.userId !== currentUserId;
                return (
                  <tr key={m.userId}>
                    <td className="col-id font-mono text-xs text-muted-foreground">#{m.id}</td>
                    <td className="col-name font-medium">{m.name}</td>
                    <td className="col-profession text-muted-foreground">{m.profession}</td>
                    <td className="col-mobile font-mono text-sm">{m.mobile}</td>
                    <td className="col-position">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.position === "manager" ? "badge-purple" : "badge-teal"
                          }`}
                        >
                          {m.position}
                        </span>
                        {isUserAdminMode && (
                          <button
                            onClick={() => handleToggleRole(m.userId, m.position)}
                            disabled={rolePending === m.userId}
                            className="text-xs font-semibold px-2.5 py-1 rounded transition-colors bg-muted/60 hover:bg-muted"
                          >
                            {rolePending === m.userId
                              ? "Updating..."
                              : m.position === "manager"
                              ? "Revoke"
                              : "Make Manager"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="col-joined text-muted-foreground">
                      {format(new Date(m.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="col-actions">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted/60 border bg-muted/30 transition text-foreground"
                      >
                        <Edit2 size={12} /> Edit Profile
                      </button>
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

      <MemberEditModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </>
  );
}
