"use client";

import { useEffect } from "react";
import { formatLocalDate } from "@/lib/format-date";

export function MemberViewModal({
  isOpen,
  onClose,
  member,
  onPrev,
  onNext,
}: {
  isOpen: boolean;
  onClose: () => void;
  member: any | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onPrev, onNext, onClose]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card glass border p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border bg-muted/30 flex items-center justify-center font-bold text-lg text-foreground select-none flex-shrink-0">
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{member.name}</h2>
              <p className="text-xs text-muted-foreground capitalize">{member.position || "Member"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center border hover:bg-muted/60 transition"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm py-2">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Name (Bengali)</div>
            <div className="font-medium text-foreground">{member.nameBn || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Profession</div>
            <div className="font-medium text-foreground">{member.profession}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Father's Name</div>
            <div className="font-medium text-foreground">{member.father || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Mother's Name</div>
            <div className="font-medium text-foreground">{member.mother || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Mobile Contact</div>
            <div className="font-medium text-foreground font-mono text-xs">{member.mobile}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Date of Birth</div>
            <div className="font-medium text-foreground">
              {member.dob ? formatLocalDate(member.dob) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">NID Number</div>
            <div className="font-medium text-foreground font-mono text-xs">{member.nidNumber}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Religion</div>
            <div className="font-medium text-foreground">{member.religion || "—"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-0.5">Present Address</div>
            <div className="font-medium text-foreground">{member.presentAddress}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-0.5">Permanent Address</div>
            <div className="font-medium text-foreground">{member.permanentAddress}</div>
          </div>
        </div>

        {/* Nominee Info */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nominee Info</h3>
          {member.nominee ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Nominee Name</div>
                <div className="font-medium text-foreground">{member.nominee.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Relationship</div>
                <div className="font-medium text-foreground">{member.nominee.relation}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Mobile Contact</div>
                <div className="font-medium font-mono text-xs text-foreground">{member.nominee.mobile || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">NID Number</div>
                <div className="font-medium font-mono text-xs text-foreground">{member.nominee.nidNumber || "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground mb-0.5">Address</div>
                <div className="font-medium text-foreground">{member.nominee.address || "—"}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No nominee information saved.</p>
          )}
        </div>

        {/* Navigation actions */}
        <div className="flex items-center justify-between border-t pt-4 select-none">
          <button
            onClick={onPrev}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-muted/40 transition flex items-center gap-1 bg-muted/20"
          >
            ← Previous (Left Arrow)
          </button>
          <button
            onClick={onNext}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-muted/40 transition flex items-center gap-1 bg-muted/20"
          >
            Next (Right Arrow) →
          </button>
        </div>
      </div>
    </div>
  );
}
