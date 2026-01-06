import { canAccessPage, type UserRole } from '@/lib/auth/canAccess';
import { NextRequest, NextResponse } from 'next/server';

// Lightweight session checker for middleware (no Prisma)
async function getSessionFromCookie(
  request: NextRequest,
): Promise<UserRole | undefined> {
  const sessionToken = request.cookies.get('session_token')?.value;

  if (!sessionToken || !sessionToken.includes('::')) {
    return undefined;
  }

  // For now, we need to make an API call to get the user role
  // since we can't use Prisma in Edge runtime
  try {
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Middleware] API Response:', data);
      // The API returns { user: { role: ... } }
      return data?.user?.role as UserRole;
    }
  } catch (error) {
    console.error('[Middleware] Error fetching user role:', error);
  }

  return undefined;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and public paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/' ||
    pathname === '/user-landing' ||
    pathname === '/unauthorized'
  ) {
    return NextResponse.next();
  }

  // Extract the base route (e.g., '/user', '/admin', '/super-admin', '/services', '/facilities')
  const baseRoute = `/${pathname.split('/')[1]}`;

  // Only check for protected routes
  const protectedPaths = [
    '/user',
    '/admin',
    '/super-admin',
    '/services',
    '/facilities',
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Get user role from session
  const role = await getSessionFromCookie(request);

  // Debug logging
  console.log('[Middleware] Path:', pathname);
  console.log('[Middleware] Base Route:', baseRoute);
  console.log('[Middleware] User Role:', role);
  console.log('[Middleware] Can Access:', canAccessPage(baseRoute, role));

  // Use canAccessPage to check if user can access this route
  if (!canAccessPage(baseRoute, role)) {
    // Redirect to unauthorized page or login
    console.log('[Middleware] BLOCKING ACCESS - Redirecting to /unauthorized');
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  console.log('[Middleware] ALLOWING ACCESS');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
