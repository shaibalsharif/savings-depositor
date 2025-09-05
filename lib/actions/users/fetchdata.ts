// /lib/actions/data.ts

"use server";

import { db } from "@/lib/db";
import { personalInfo, nomineeInfo, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserDataCompleteness(userId: string) {
  try {
    // Fetch user data by performing left joins on personalInfo and nomineeInfo tables.
    // This query will return a single combined object for the user.
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

    // Define the required fields for each information type
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

    // Check for missing fields in personalInfo
    // We check the personal_info object directly to avoid conflicts with nominee_info
    personalInfoFields.forEach((field) => {
      const value = userData.personal_info?.[field as keyof typeof userData.personal_info];
      if (!value) {
        missingFields.push(`personalInfo.${field}`);
      }
    });

    // Check for missing fields in nomineeInfo
    // We check the nominee_info object directly to avoid conflicts with personal_info
    nomineeInfoFields.forEach((field) => {
      const value = userData.nominee_info?.[field as keyof typeof userData.nominee_info];
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