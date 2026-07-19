import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Wrap Kinde's handleAuth to catch OAuth state mismatch errors (common on
// Android PWA where Chrome Custom Tabs use a different cookie context) and
// redirect to a friendly recovery page instead of showing raw JSON.
async function wrappedHandleAuth(
  req: NextRequest,
  ctx: { params: Promise<{ kindeAuth: string }> }
) {
  try {
    const res = await (handleAuth() as Function)(req, ctx);

    // Kinde returns a JSON body with an "error" key on state-mismatch failures.
    // Detect this on the callback route so we can intercept before the browser
    // renders the raw error JSON.
    const contentType = res?.headers?.get?.("content-type") ?? "";
    if (contentType.includes("application/json") && res.status !== 200) {
      try {
        const clone = res.clone();
        const data = await clone.json();
        if (
          data?.error &&
          typeof data.error === "string" &&
          data.error.toLowerCase().includes("state mismatch")
        ) {
          return NextResponse.redirect(
            new URL("/auth-error?reason=state_mismatch", req.url)
          );
        }
      } catch {
        // If we can't parse the body, fall through to the original response
      }
    }

    return res;
  } catch (err: any) {
    // Catch synchronous errors (state mismatch can also throw)
    const message = err?.message ?? "";
    if (
      message.toLowerCase().includes("state mismatch") ||
      message.toLowerCase().includes("state")
    ) {
      return NextResponse.redirect(
        new URL("/auth-error?reason=state_mismatch", req.url)
      );
    }
    // Re-throw unknown errors
    throw err;
  }
}

export const GET = wrappedHandleAuth;
