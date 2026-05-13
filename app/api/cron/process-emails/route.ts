import { processPendingNotifications } from "@/lib/notifications/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Only allow Vercel cron or manual trigger with a secret in production
  // Note: Vercel sends `x-vercel-cron` header for scheduled crons
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  if (
    process.env.NODE_ENV === 'production' &&
    !isVercelCron &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processPendingNotifications();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Cron / process-emails error:", e);
    return NextResponse.json({ error: "Failed to process emails" }, { status: 500 });
  }
}
