"use server";

import { requireManager } from "@/lib/auth";
import { getHeatmapData } from "@/lib/queries/dashboard";

export async function getHeatmapDataAction(year: number) {
  await requireManager();
  return await getHeatmapData(year);
}
