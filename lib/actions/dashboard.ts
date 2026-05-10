"use server";

import { requireMember } from "@/lib/auth";
import { getHeatmapData, getAllTimeHeatmapData } from "@/lib/queries/dashboard";

export async function getHeatmapDataAction(year: number) {
  await requireMember();
  return await getHeatmapData(year);
}

export async function getAllTimeHeatmapDataAction() {
  await requireMember();
  return await getAllTimeHeatmapData();
}
