// app/api/notifications/send/route.ts

import { createNotification } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, recipients, senderUserId, type, metadata } = await req.json();

    if (!message || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Create notifications for all recipients in parallel
    await Promise.all(
      recipients.map((recipientUserId: string) =>
        createNotification({
          recipientUserId,
          senderUserId: senderUserId || null,
          type: type || "custom",
          message,
          metadata: metadata || null,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send bulk notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
