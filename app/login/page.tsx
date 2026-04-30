import { redirect } from "next/navigation";

export default function LoginPage() {
  // Silent redirect back to the home gateway.
  // Home gateway will then trigger the Kinde login flow if the user is logged out.
  redirect("/");
}
