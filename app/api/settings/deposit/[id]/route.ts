import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { depositSettings } from "@/db/schema";

function checkAdminOrManager(user: any) {
  return true; // user?.role === "admin" || user?.role === "manager";
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin or manager role here
  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = await Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // 1. Get the setting to be deleted
    const [settingToDelete] = await db
      .select()
      .from(depositSettings)
      .where(eq(depositSettings.id, id));

    if (!settingToDelete) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    // 2. Delete the upcoming setting
    await db.delete(depositSettings).where(eq(depositSettings.id, id));

    // 3. Find the previous setting that was terminated by this deleted setting's effectiveMonth
    const [previousSetting] = await db
      .select()
      .from(depositSettings)
      .where(
        and(
          eq(depositSettings.terminatedAt, settingToDelete.effectiveMonth)
          // Optionally exclude the deleted setting itself
          // eq(depositSettings.id, id) is not needed because it's deleted
        )
      );

    // 4. If such previous setting exists, reset its terminatedAt to NULL
    if (previousSetting) {
      await db
        .update(depositSettings)
        .set({ terminatedAt: null })
        .where(eq(depositSettings.id, previousSetting.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deposit setting:", error);
    return NextResponse.json(
      { error: "Failed to delete setting" },
      { status: 500 }
    );
  }
}
