import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { isAuthenticated } = getKindeServerSession();
  const auth = await isAuthenticated();

  if (auth) {
    // Already logged in? Go straight to dashboard.
    redirect("/dashboard");
  } else {
    // Not logged in? Immediately trigger Kinde login UI.
    redirect("/api/auth/login");
  }

  return null; // This will never be reached due to redirects
}
