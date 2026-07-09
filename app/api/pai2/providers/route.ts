/**
 * PAI2 Providers API Route
 *
 * GET /api/pai2/providers — Get available providers and models (safe for client)
 */

import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getProviderInfoList } from "@/lib/ai/providers";

export async function GET() {
  try {
    const { isAuthenticated } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = getProviderInfoList();
    return NextResponse.json({ providers });
  } catch (err) {
    console.error("[PAI2 Providers Error]", err);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}
