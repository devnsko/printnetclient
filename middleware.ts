import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect routes by checking for an auth cookie named 'token'.
// Excludes the root path (`/`) and any path under `/auth/*`.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // // Allow public/excluded paths
  // if (
  //   pathname === '/' ||
  //   pathname.startsWith('/auth') ||
  //   pathname.startsWith('/_next') ||
  //   pathname.startsWith('/static') ||
  //   pathname === '/favicon.ico'
  // ) {
  //   return NextResponse.next();
  // }

  // // Check cookie named 'printnettoken'
  // const token = req.cookies.get('printnettoken')?.value;

  // if (!token) {
  //   // Redirect unauthenticated users to the home page (login/register are under /auth/*)
  //   const url = req.nextUrl.clone();
  //   url.pathname = '/';
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

// Run middleware for all routes. We still explicitly skip common Next.js internals above.
export const config = {
  matcher: '/:path*',
};
