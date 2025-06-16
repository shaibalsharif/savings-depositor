import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getKindeServerSession, LoginLink } from "@kinde-oss/kinde-auth-nextjs/server";


export default async function HomePage() {
  const { isAuthenticated } = getKindeServerSession();
  const auth = await isAuthenticated();
  console.log(auth);

  if (auth) {
    // Redirect to dashboard root (formerly /dashboard)
    return (
      <meta http-equiv="refresh" content="0;url=/dashboard" />
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
          <Button variant="outline" className="text-primary-foreground" asChild>
            <LoginLink>
              Sign in
            </LoginLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}