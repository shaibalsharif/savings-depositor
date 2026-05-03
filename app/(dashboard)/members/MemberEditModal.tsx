"use client";

import { useState, useEffect } from "react";
import { updateMemberFullProfile } from "@/lib/actions/members";
import { UploadThingButton } from "@/components/UploadThingButton";

export function MemberEditModal({
  isOpen,
  onClose,
  member,
}: {
  isOpen: boolean;
  onClose: () => void;
  member: any | null;
}) {
  const [personal, setPersonal] = useState({
    name: "",
    nameBn: "",
    father: "",
    mother: "",
    dob: "",
    profession: "",
    religion: "",
    presentAddress: "",
    permanentAddress: "",
    mobile: "",
    nidNumber: "",
    photo: "",
  });

  const [nominee, setNominee] = useState({
    name: "",
    relation: "",
    dob: "",
    mobile: "",
    nidNumber: "",
    address: "",
    photo: "",
  });

  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (member) {
      setPersonal({
        name: member.name || "",
        nameBn: member.nameBn || "",
        father: member.father || "",
        mother: member.mother || "",
        dob: member.dob ? member.dob.split("T")[0] : "",
        profession: member.profession || "",
        religion: member.religion || "",
        presentAddress: member.presentAddress || "",
        permanentAddress: member.permanentAddress || "",
        mobile: member.mobile || "",
        nidNumber: member.nidNumber || "",
        photo: member.photo || "",
      });

      const nom = member.nominee;
      setNominee({
        name: nom?.name || "",
        relation: nom?.relation || "",
        dob: nom?.dob ? nom.dob.split("T")[0] : "",
        mobile: nom?.mobile || "",
        nidNumber: nom?.nidNumber || "",
        address: nom?.address || "",
        photo: nom?.photo || "",
      });
      setMessage("");
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setMessage("");
    try {
      await updateMemberFullProfile(member.userId, personal, nominee);
      setMessage("✓ Profile updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setMessage(`✕ Error: ${err.message}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card glass border p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative select-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Edit Member Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Edit personal and nominee information</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center border hover:bg-muted/60 transition"
          >
            ✕
          </button>
        </div>

        {message && (
          <p className={`p-3 rounded-lg text-xs font-semibold ${message.startsWith("✓") ? "bg-green/10 text-green border border-green/20" : "bg-red/10 text-red border border-red/20"}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Personal Details Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
                Personal Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    value={personal.name}
                    onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Name (Bengali)</label>
                  <input
                    type="text"
                    required
                    value={personal.nameBn}
                    onChange={(e) => setPersonal({ ...personal, nameBn: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Father's Name</label>
                  <input
                    type="text"
                    required
                    value={personal.father}
                    onChange={(e) => setPersonal({ ...personal, father: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Mother's Name</label>
                  <input
                    type="text"
                    value={personal.mother}
                    onChange={(e) => setPersonal({ ...personal, mother: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={personal.dob}
                    onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Profession</label>
                  <input
                    type="text"
                    required
                    value={personal.profession}
                    onChange={(e) => setPersonal({ ...personal, profession: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Religion</label>
                  <input
                    type="text"
                    required
                    value={personal.religion}
                    onChange={(e) => setPersonal({ ...personal, religion: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Mobile</label>
                  <input
                    type="text"
                    required
                    value={personal.mobile}
                    onChange={(e) => setPersonal({ ...personal, mobile: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">NID Number</label>
                  <input
                    type="text"
                    required
                    value={personal.nidNumber}
                    onChange={(e) => setPersonal({ ...personal, nidNumber: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Photo URL</label>
                  <input
                    type="url"
                    value={personal.photo}
                    onChange={(e) => setPersonal({ ...personal, photo: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div className="sm:col-span-2 border-t pt-3 flex flex-col items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground self-start select-none">Or Upload New Image</label>
                  <UploadThingButton
                    endpoint="userImage"
                    onComplete={(url) => {
                      setPersonal({ ...personal, photo: url });
                      setMessage("✓ Member Photo uploaded!");
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Present Address</label>
                  <textarea
                    required
                    rows={2}
                    value={personal.presentAddress}
                    onChange={(e) => setPersonal({ ...personal, presentAddress: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Permanent Address</label>
                  <textarea
                    required
                    rows={2}
                    value={personal.permanentAddress}
                    onChange={(e) => setPersonal({ ...personal, permanentAddress: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Right: Nominee Details Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">
                Nominee Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Nominee Full Name</label>
                  <input
                    type="text"
                    value={nominee.name}
                    onChange={(e) => setNominee({ ...nominee, name: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Relationship</label>
                  <input
                    type="text"
                    value={nominee.relation}
                    onChange={(e) => setNominee({ ...nominee, relation: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    value={nominee.dob}
                    onChange={(e) => setNominee({ ...nominee, dob: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Mobile</label>
                  <input
                    type="text"
                    value={nominee.mobile}
                    onChange={(e) => setNominee({ ...nominee, mobile: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">NID Number</label>
                  <input
                    type="text"
                    value={nominee.nidNumber}
                    onChange={(e) => setNominee({ ...nominee, nidNumber: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Photo URL</label>
                  <input
                    type="url"
                    value={nominee.photo}
                    onChange={(e) => setNominee({ ...nominee, photo: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
                <div className="sm:col-span-2 border-t pt-3 flex flex-col items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground self-start select-none">Or Upload Nominee Image</label>
                  <UploadThingButton
                    endpoint="nomineePhoto"
                    onComplete={(url) => {
                      setNominee({ ...nominee, photo: url });
                      setMessage("✓ Nominee Photo uploaded!");
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Nominee Address</label>
                  <textarea
                    rows={2}
                    value={nominee.address}
                    onChange={(e) => setNominee({ ...nominee, address: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border rounded-lg bg-muted/20 text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-bold border rounded-lg bg-muted/20 hover:bg-muted/40 transition select-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-bold rounded-lg transition select-none disabled:opacity-50"
              style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
