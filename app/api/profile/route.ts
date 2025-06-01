import { getKindeManagementToken } from "@/lib/kinde-management";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

const utapi = new UTApi();

const updateSchema = z.object({
  given_name: z.string().min(1, "First name is required"),
  family_name: z.string().min(1, "Last name is required"),
  picture: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Handle old image deletion if picture changed
    let oldImageKey: string | null = null;
    if (body.picture && user.picture && user.picture !== body.picture) {
      try {
        const url = new URL(user.picture);
        if (url.host === "uploadthing.com") {
          oldImageKey = url.pathname.split("/").pop() || null;
        }
      } catch {
        // ignore
      }
    }

    const token = await getKindeManagementToken();

    const updateBody = {
      given_name: body.given_name,
      family_name: body.family_name,
      picture: body.picture || null,
    };

    const updateRes = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/user?id=${user.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      return NextResponse.json({ error: errData.message || "Failed to update user" }, { status: 500 });
    }

    const updatedUser = await updateRes.json();

    if (oldImageKey) {
      try {
        await utapi.deleteFiles(oldImageKey);
      } catch (error) {
        console.error("Failed to delete old image:", error);
      }
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
