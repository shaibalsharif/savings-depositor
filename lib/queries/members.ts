import { db } from "@/db/client";
import { personalInfo, nomineeInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

export async function getMemberFullProfile(userId: string) {
  const profile = await db.query.personalInfo.findFirst({
    where: eq(personalInfo.userId, userId),
  });

  let nominee = await db.query.nomineeInfo.findFirst({
    where: eq(nomineeInfo.userId, userId),
  });

  // Seed nominee info from local file if missing in DB
  if (!nominee) {
    try {
      const nomineeJsonPath = path.join(process.cwd(), "extra", "nominee_info.json");
      if (fs.existsSync(nomineeJsonPath)) {
        const fileContent = fs.readFileSync(nomineeJsonPath, "utf-8");
        const nominees = JSON.parse(fileContent);
        const nomineeData = nominees.find((n: any) => n.user_id === userId);
        if (nomineeData) {
          await db.insert(nomineeInfo).values({
            userId,
            name: nomineeData.name || "",
            relation: nomineeData.relation || "",
            dob: nomineeData.dob || null,
            mobile: nomineeData.mobile || null,
            nidNumber: nomineeData.nid_number || null,
            address: nomineeData.address || null,
            photo: nomineeData.photo || null,
          });

          nominee = await db.query.nomineeInfo.findFirst({
            where: eq(nomineeInfo.userId, userId),
          });
        }
      }
    } catch (err) {
      console.error("Error seeding nominee info for user", userId, err);
    }
  }

  return { profile, nominee };
}
