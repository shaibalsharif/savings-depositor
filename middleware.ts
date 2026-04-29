import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default function middleware(req: Request) {
  return withAuth(req);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/deposits/:path*",
    "/expenses/:path*",
    "/investments/:path*",
    "/revenue/:path*",
    "/members/:path*",
    "/settings/:path*",
    "/my-deposits",
    "/my-profile",
  ]
};
