import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

export async function middleware(request: NextRequest) {
  const { isAuthenticated } = getKindeServerSession()
  const path = request.nextUrl.pathname

  // Public routes
  const publicRoutes = ['/', ]

  // If trying to access a protected route and not authenticated
  if (!publicRoutes.includes(path) && !path.startsWith('/_next') && !path.startsWith('/api') && !(await isAuthenticated())) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }
}
