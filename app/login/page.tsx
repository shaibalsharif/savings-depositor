"use client";
import {LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in with your email (passwordless)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginLink  >{/* No props needed */}
      
              Sign in
            
            </LoginLink> 
        </CardContent>
      </Card>
    </div>
  );
}
