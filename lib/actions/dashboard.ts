"use server";

import { requireManager } from "@/lib/auth";
import { getHeatmapData, getAllTimeHeatmapData } from "@/lib/queries/dashboard";

export async function getHeatmapDataAction(year: number) {
  await requireManager();
  return await getHeatmapData(year);
}

export async function getAllTimeHeatmapDataAction() {
  await requireManager();
  return await getAllTimeHeatmapData();
}
