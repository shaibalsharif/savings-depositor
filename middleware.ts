import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

export async function middleware(request: NextRequest) {
  const { isAuthenticated } = getKindeServerSession(request)
  const path = request.nextUrl.pathname

  // Public routes
  const publicRoutes = ['/', '/login']

  // If trying to access a protected route and not authenticated
  if (!publicRoutes.includes(path) && !path.startsWith('/_next') && !path.startsWith('/api') && !(await isAuthenticated())) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }
}
