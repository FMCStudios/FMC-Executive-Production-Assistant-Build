import { cookies } from 'next/headers';
import crypto from 'crypto';

export type AccessLevel = 'Admin' | 'Supervisor' | 'Crew';

export type Session = {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  accessLevel: AccessLevel;
};

const SECRET = () => process.env.AUTH_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'epa-session';

// ── Token helpers (HMAC-SHA256) ──

function sign(payload: Record<string, unknown>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify<T>(token: string): T | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET()).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload as T;
  } catch {
    return null;
  }
}

// ── Magic link token (30 min) ──

export function createMagicToken(email: string): string {
  return sign({ email, exp: Date.now() + 30 * 60 * 1000 });
}

export function verifyMagicToken(token: string): { email: string } | null {
  return verify<{ email: string }>(token);
}

// ── Session cookie (30 days) ──

export function createSessionToken(session: Session): string {
  return sign({ ...session, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
}

export function verifySessionToken(token: string): Session | null {
  return verify<Session>(token);
}

// ── Cookie management ──

export function setSessionCookie(session: Session): string {
  const token = createSessionToken(session);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return token;
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function getSession(): Session | null {
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}

// ── Role checks ──

export function isAdmin(session: Session | null): boolean {
  return session?.accessLevel === 'Admin';
}

export function isSupervisor(session: Session | null): boolean {
  return session?.accessLevel === 'Admin' || session?.accessLevel === 'Supervisor';
}

export function canViewRates(session: Session | null): boolean {
  return isSupervisor(session);
}

export function canAccessBriefs(session: Session | null): boolean {
  return isSupervisor(session);
}
