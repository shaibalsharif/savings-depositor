"use client";

import { useEffect } from "react";
import { formatLocalDate } from "@/lib/format-date";
import { ImagePreview } from "@/components/ui/image-preview";
import { UserAvatar } from "@/components/ui/user-avatar";

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card glass border p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar src={member.photo} name={member.name} className="w-16 h-16 text-xl" />
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
            <div className="text-xs text-muted-foreground mb-0.5">Contact Info</div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground font-mono text-xs">{member.mobile}</span>
              <span className="text-[11px] text-muted-foreground lowercase">{member.email || "no-email@set.com"}</span>
            </div>
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

        {/* NID Documents */}
        {(member.nidFront || member.nidBack) && (
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">NID Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {member.nidFront && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Front Side</span>
                  <ImagePreview src={member.nidFront} alt="NID Front" className="aspect-video" />
                </div>
              )}
              {member.nidBack && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Back Side</span>
                  <ImagePreview src={member.nidBack} alt="NID Back" className="aspect-video" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nominee Info */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-4 mb-2">
            <UserAvatar src={member.nominee?.photo} name={member.nominee?.name || "Nominee"} className="w-14 h-14 text-lg" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nominee Info</h3>
              <p className="text-xs text-muted-foreground">{member.nominee?.relation || "Nominee"}</p>
            </div>
          </div>

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
            ← Previous
          </button>
          <button
            onClick={onNext}
            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-muted/40 transition flex items-center gap-1 bg-muted/20"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
