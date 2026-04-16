import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/crew/join',
  '/api/crew/join',
  '/_next',
  '/logos',
  '/fonts',
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const [data, sig] = token.split('.');
  if (!data || !sig) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const expected = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  if (sig !== expected) return false;

  try {
    const payload = JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || Date.now() <= payload.exp;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Allow read-only API routes without auth
  if (pathname.startsWith('/api/crew') && request.method === 'GET') return NextResponse.next();
  if (pathname.startsWith('/api/gear')) return NextResponse.next();
  if (pathname.startsWith('/api/generate')) return NextResponse.next();
  if (pathname.startsWith('/api/sheets')) return NextResponse.next();

  const token = request.cookies.get('epa-session')?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const valid = await verifyToken(token, secret);
  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos|fonts).*)'],
};
