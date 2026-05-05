import { getMemberFullProfile } from "@/lib/queries/members";
import { requireMember, isManager } from "@/lib/auth";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { formatLocalDate } from "@/lib/format-date";
import { formatPhoneNumber } from "@/lib/utils/format-phone";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const user = await requireMember();
  const manager = await isManager();
  const { profile, nominee } = await getMemberFullProfile(user.id);

  if (profile) {
    profile.mobile = formatPhoneNumber(profile.mobile);
  }
  if (nominee) {
    nominee.mobile = formatPhoneNumber(nominee.mobile);
  }

  if (!profile) {
    return (
      <div className="p-8 text-center glass rounded-xl border max-w-xl mx-auto mt-12">
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-muted-foreground mt-2 text-sm">We couldn't load your profile details.</p>
      </div>
    );
  }

  if (!profile.photo && user.picture) {
    profile.photo = user.picture;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Profile" }]} />

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View your personal details, nominee information, and update your photo.
          </p>
        </div>
        {manager && (
          <span className="badge-purple px-3 py-1.5 rounded-full text-xs font-semibold">
            Manager Access
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Photo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-xl flex flex-col items-center text-center space-y-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 bg-muted/30 flex items-center justify-center">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground select-none">
                  {profile.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{profile.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{profile.position || "Member"}</p>
            </div>
            {/* Direct self-photo update tool */}
            <div className="w-full pt-2">
              <ProfilePhotoUploader currentPhoto={profile.photo || ""} />
            </div>
          </div>

          {/* Identification / Documents */}
          <div className="glass p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Identification</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">National ID (NID)</div>
                <div className="text-sm font-mono font-medium mt-0.5">{profile.nidNumber}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {profile.nidFront && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">NID Front</div>
                    <a
                      href={profile.nidFront}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border hover:opacity-80 transition bg-muted/40 aspect-[3/2] flex items-center justify-center"
                    >
                      <img src={profile.nidFront} alt="NID Front" className="w-full h-full object-cover" />
                    </a>
                  </div>
                )}
                {profile.nidBack && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">NID Back</div>
                    <a
                      href={profile.nidBack}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border hover:opacity-80 transition bg-muted/40 aspect-[3/2] flex items-center justify-center"
                    >
                      <img src={profile.nidBack} alt="NID Back" className="w-full h-full object-cover" />
                    </a>
                  </div>
                )}
              </div>
              {profile.signature && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Signature</div>
                  <div className="overflow-hidden rounded-lg border bg-muted/20 p-2 aspect-[4/1] flex items-center justify-center">
                    <img src={profile.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Personal & Nominee details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Details */}
          <div className="glass p-6 rounded-xl space-y-4">
            <h3 className="text-base font-semibold tracking-wider text-foreground">Member Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Full Name (English)</div>
                <div className="font-medium text-foreground">{profile.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Name (Bengali)</div>
                <div className="font-medium text-foreground">{profile.nameBn}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Father's Name</div>
                <div className="font-medium text-foreground">{profile.father}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Mother's Name</div>
                <div className="font-medium text-foreground">{profile.mother || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Date of Birth</div>
                <div className="font-medium text-foreground">{formatLocalDate(profile.dob)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Profession</div>
                <div className="font-medium text-foreground">{profile.profession}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Religion</div>
                <div className="font-medium text-foreground">{profile.religion}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Mobile Contact</div>
                <div className="font-medium text-foreground font-mono text-xs">{profile.mobile}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground mb-0.5">Present Address</div>
                <div className="font-medium text-foreground">{profile.presentAddress}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground mb-0.5">Permanent Address</div>
                <div className="font-medium text-foreground">{profile.permanentAddress}</div>
              </div>
            </div>
          </div>

          {/* Nominee Details */}
          <div className="glass p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-wider text-foreground">Nominee Information</h3>
              {nominee && (
                <span className="badge-teal px-2.5 py-0.5 rounded-full text-xs">
                  {nominee.relation}
                </span>
              )}
            </div>
            {nominee ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Full Name</div>
                  <div className="font-medium text-foreground">{nominee.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Relationship</div>
                  <div className="font-medium text-foreground">{nominee.relation}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Date of Birth</div>
                  <div className="font-medium text-foreground">{nominee.dob ? formatLocalDate(nominee.dob) : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Mobile Contact</div>
                  <div className="font-medium text-foreground font-mono text-xs">{nominee.mobile || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">NID Number</div>
                  <div className="font-medium text-foreground font-mono text-xs">{nominee.nidNumber || "—"}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-0.5">Address</div>
                  <div className="font-medium text-foreground">{nominee.address || "—"}</div>
                </div>
                <div className="sm:col-span-2 pt-2 border-t mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Nominee Photo</div>
                  <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted/40 flex items-center justify-center">
                    {nominee.photo ? (
                      <img src={nominee.photo} alt="Nominee" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground select-none">
                        {nominee.name ? nominee.name.charAt(0) : "N"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No nominee information saved.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
