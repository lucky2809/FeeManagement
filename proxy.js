/**
 * Next.js Proxy (formerly Middleware)
 * Protects dashboard routes - redirects to login if not authenticated
 */
import { NextResponse } from 'next/server';
import { verifyToken, extractToken } from './lib/auth';

// Routes that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/setup'];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For API routes, let the route handler deal with auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For dashboard pages, check auth cookie
  const token = extractToken(request);

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
