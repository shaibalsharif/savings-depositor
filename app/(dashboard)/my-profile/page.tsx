import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { requireMember } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { eq } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function MyProfilePage() {
  const user = await requireMember();
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  const profile = await db.query.personalInfo.findFirst({
    where: eq(personalInfo.userId, user.id)
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your registered details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Name</div>
            <div className="text-lg font-semibold">{profile?.name ?? `${kindeUser?.given_name ?? ""} ${kindeUser?.family_name ?? ""}`.trim()}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Email</div>
            <div className="text-lg">{kindeUser?.email ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Phone</div>
            <div className="text-lg">{profile?.mobile ?? "Not provided"}</div>
          </div>
          {profile?.profession && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Profession</div>
              <div className="text-lg">{profile.profession}</div>
            </div>
          )}
          {profile?.position && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Role</div>
              <div className="text-lg capitalize">{profile.position}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
