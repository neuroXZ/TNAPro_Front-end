import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token and user from cookies or headers
  const token = request.cookies.get('token')?.value
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/']
  const isPublicPath = publicPaths.includes(pathname)
  
  // Check if path is admin or staff route
  const isAdminPath = pathname.startsWith('/admin')
  const isStaffPath = pathname.startsWith('/staff')
  
  // If no token and trying to access protected route
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If has token, check localStorage on client side
  // Note: We can't access localStorage in middleware, so we'll rely on client-side checks
  // This middleware only prevents completely unauthenticated access
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
