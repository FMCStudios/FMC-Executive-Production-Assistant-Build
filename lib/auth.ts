import { auth } from '@/lib/auth-config';
import type { RosterType } from '@/lib/crew';

export type AccessLevel = 'Admin' | 'Supervisor' | 'Crew';

export type Session = {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  accessLevel: AccessLevel;
  rosterType: RosterType;
  primaryRole: string;
};

export async function getSession(): Promise<Session | null> {
  const s = await auth();
  if (!s?.user?.email) return null;
  const u = s.user;
  return {
    email: u.email,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    displayName: u.displayName || u.firstName || u.email,
    accessLevel: u.accessLevel || 'Crew',
    rosterType: u.rosterType || 'team',
    primaryRole: u.primaryRole || '',
  };
}

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
