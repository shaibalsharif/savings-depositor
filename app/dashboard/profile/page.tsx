// app/dashboard/profile/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import ProfileTabs from "@/components/dashboard/profileTabs/ProfileTabs";
import { fetchUserProfile, fetchPersonalInfo, fetchNomineeInfo } from "@/lib/actions/profile/profile";

export default async function ProfilePage() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser?.id) {
    return <div>Please log in to view your profile.</div>;
  }

  // Fetch all data for the tabs in parallel
  const [profileData, personalInfoData, nomineeInfoData] = await Promise.all([
    fetchUserProfile(kindeUser.id),
    fetchPersonalInfo(kindeUser.id),
    fetchNomineeInfo(kindeUser.id),
  ]);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <ProfileTabs
        user={{ ...kindeUser, phone: kindeUser.phone_number || null }}
        profileData={profileData}
        personalInfoData={personalInfoData}
        nomineeInfoData={nomineeInfoData}
      />
    </div>
  );
}