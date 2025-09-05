"use server";

import { db } from "@/lib/db";
import { personalInfo, nomineeInfo, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserDataCompleteness(userId: string) {
  try {
    // Fetch user data from the database by joining the three relevant tables
    const [userData] = await db
      .select()
      .from(users)
      .leftJoin(personalInfo, eq(users.id, personalInfo.userId))
      .leftJoin(nomineeInfo, eq(users.id, nomineeInfo.userId))
      .where(eq(users.id, userId));

    if (!userData) {
      return { success: false, message: "User not found." };
    }

    const missingFields: string[] = [];

    // Check for missing fields in personalInfo and nomineeInfo tables
    const personalInfoFields = [
      "name",
      "nameBn",
      "father",
      "mother",
      "dob",
      "profession",
      "religion",
      "presentAddress",
      "permanentAddress",
      "mobile",
      "nidNumber",
      "nidFront",
      "nidBack",
    ];

    const nomineeInfoFields = [
      "name",
      "relation",
      "dob",
      "mobile",
      "nidNumber",
      "address",
      "photo",
    ];

    // Use a dynamic check on the combined joined data
    const combinedData = {
      ...userData.users,
      ...(userData.personal_info || {}),
      ...(userData.nominee_info || {}),
    } as any; // Type assertion here

    personalInfoFields.forEach((field) => {
      // Now this line is valid because `combinedData` is treated as if it can be indexed by any string
      const value = combinedData[field];
      if (!value) {
        missingFields.push(`personalInfo.${field}`);
      }
    });

    nomineeInfoFields.forEach((field) => {
      // This line is also now valid
      const value = combinedData[field];
      if (!value) {
        missingFields.push(`nomineeInfo.${field}`);
      }
    });

    const isComplete = missingFields.length === 0;

    return {
      success: true,
      data: {
        isComplete,
        missingFields: isComplete ? [] : missingFields,
        user_name: userData.users.name,
        personal_name: userData.personal_info?.name,
        personal_name_bn: userData.personal_info?.nameBn,
      },
    };
  } catch (error) {
    console.error("Error fetching user data completeness:", error);
    return { success: false, message: "Failed to fetch data completeness." };
  }
}
