// app/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getKindeServerSession, LoginLink } from "@kinde-oss/kinde-auth-nextjs/server";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const { isAuthenticated } = getKindeServerSession();
  const auth = await isAuthenticated();

  if (auth) {
    // Redirect authenticated users to dashboard
    return (
      <meta httpEquiv="refresh" content="0;url=/dashboard" />
    );
  }

  // Show login prompt if not authenticated
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Welcome to Group Savings</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LoginLink className={buttonVariants({ variant: "outline" })}>Sign in</LoginLink>
        </CardContent>
      </Card>
    </div>
  );
}
