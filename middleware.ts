import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Allow requests to API routes and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/' ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  const userRole = token.role as string

  // Admin and staff can access admin routes
  if (pathname.startsWith('/admin/')) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Students can only access student routes
  if (pathname.startsWith('/student/')) {
    if (userRole !== 'STUDENT') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Parents can only access parent routes
  if (pathname.startsWith('/parent/')) {
    if (userRole !== 'PARENT') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

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
