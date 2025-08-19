"use server";

import { db } from "@/lib/db";
import { terms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export async function getTerms(): Promise<string | { error: string }> {
  try {
    const [latestTerm] = await db.select().from(terms).orderBy(desc(terms.createdAt)).limit(1);
    if (!latestTerm) return "";
    return latestTerm.content;
  } catch (error) {
    console.error("Error fetching terms:", error);
    return { error: "Failed to fetch terms" };
  }
}

export async function saveTerms(content: string, createdBy: string): Promise<{ success: boolean } | { error: string }> {
  try {
    await db.insert(terms).values({ content, createdBy });
    return { success: true };
  } catch (error) {
    console.error("Error updating terms:", error);
    return { error: "Failed to update terms" };
  }
}