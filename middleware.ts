import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// First-line filter for signed-in-ness. The real JWT verification lives in
// route handlers / server components via `getSession()` (which calls
// NextAuth `auth()`); middleware only checks that a NextAuth session cookie
// is present so we can bounce anonymous users to /login fast.

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',          // NextAuth catchall (signin/callback/session/signout)
  '/crew/join',
  '/api/crew/join',
  '/_next',
  '/logos',
  '/fonts',
  '/favicon.ico',
];

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Read-only API escape hatches
  if (pathname.startsWith('/api/crew') && request.method === 'GET') return NextResponse.next();
  if (pathname.startsWith('/api/gear')) return NextResponse.next();
  if (pathname.startsWith('/api/generate')) return NextResponse.next();
  if (pathname.startsWith('/api/sheets')) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some(name => !!request.cookies.get(name)?.value);
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos|fonts).*)'],
};
