"use client";

import { toggleMemberRole } from "@/lib/actions/members";
import { useState } from "react";
import { format } from "date-fns";

type Member = {
  id: number;
  userId: string;
  name: string;
  profession: string;
  mobile: string;
  position: string;
  createdAt: Date;
};

export function MemberRow({ member, isAdmin }: { member: Member; isAdmin: boolean }) {
  const [isPending, setIsPending] = useState(false);
  const [position, setPosition] = useState(member.position);

  async function handleToggle() {
    setIsPending(true);
    try {
      const res = await toggleMemberRole(member.userId, position);
      if (res.success) {
        setPosition(res.newPosition);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <tr>
      <td className="col-id font-mono text-xs text-muted-foreground">#{member.id}</td>
      <td className="col-name font-medium">{member.name}</td>
      <td className="col-profession text-muted-foreground">{member.profession}</td>
      <td className="col-mobile font-mono text-sm">{member.mobile}</td>
      <td className="col-position">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              position === "manager" ? "badge-purple" : "badge-teal"
            }`}
          >
            {position}
          </span>
          {isAdmin && (
            <button
              onClick={handleToggle}
              disabled={isPending}
              className="text-xs font-semibold px-2 py-1 rounded transition-colors"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--foreground))",
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {position === "manager" ? "Revoke Manager" : "Make Manager"}
            </button>
          )}
        </div>
      </td>
      <td className="col-joined text-muted-foreground">
        {format(new Date(member.createdAt), "dd MMM yyyy")}
      </td>
    </tr>
  );
}
