import webpush from "web-push";
import type { NotificationPayload, PushSubscriptionData } from "./types";

webpush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPush(
  subscription: PushSubscriptionData,
  payload: NotificationPayload
): Promise<"ok" | "expired"> {
  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/dashboard",
      icon: "/icons/icon-192x192.png",
    });
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      pushPayload
    );
    console.log(`[PushAdapter] Sent push to ${subscription.endpoint.slice(0, 50)}... Payload length: ${pushPayload.length}`);
    return "ok";
  } catch (err: any) {
    const status = err?.statusCode;
    if (status === 404 || status === 410) {
      // Subscription is gone — caller should delete it
      return "expired";
    }
    console.error("[PushAdapter] Error:", err?.body ?? err);
    return "ok"; // non-fatal
  }
}
