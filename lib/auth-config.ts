// NextAuth v5 (Auth.js) — Google SSO for EPA.
//
// Redirect URIs to whitelist in the Google Cloud Console OAuth client:
//   - http://localhost:3000/api/auth/callback/google
//   - https://fmc-epa.vercel.app/api/auth/callback/google
//
// Required env vars (.env.local and Vercel):
//   AUTH_GOOGLE_ID       Google OAuth client ID
//   AUTH_GOOGLE_SECRET   Google OAuth client secret
//   AUTH_SECRET          JWT signing secret (same as existing — reuse)
//   NEXTAUTH_URL         https://fmc-epa.vercel.app in production
//
// Sign-in is gated on the Roster sheet. If a Google email isn't on the
// roster we reject with AccessDenied — surfaced on /login via the error
// query param.

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { findCrewByEmail, type RosterType } from '@/lib/crew';

export type AccessLevel = 'Admin' | 'Supervisor' | 'Crew';

type EpaTokenFields = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  accessLevel?: AccessLevel;
  rosterType?: RosterType;
  primaryRole?: string;
};

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      firstName: string;
      lastName: string;
      displayName: string;
      accessLevel: AccessLevel;
      rosterType: RosterType;
      primaryRole: string;
      image?: string | null;
      name?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user }) {
      const email = user?.email?.toLowerCase();
      if (!email) return false;
      try {
        const member = await findCrewByEmail(email);
        if (!member) return '/login?error=AccessDenied';
        return true;
      } catch {
        return '/login?error=Configuration';
      }
    },
    async jwt({ token, user, trigger }) {
      const t = token as typeof token & EpaTokenFields;

      // On sign-in (user present) OR first session read, look up the Roster
      // row and stamp the token with the fields every downstream helper
      // expects. On subsequent reads the token already carries them.
      const needsEnrich = !!user || trigger === 'signIn' || !t.accessLevel;
      if (!needsEnrich) return token;

      const email = (user?.email || token.email || '').toLowerCase();
      if (!email) return token;

      try {
        const member = await findCrewByEmail(email);
        if (member) {
          const validLevels: AccessLevel[] = ['Admin', 'Supervisor', 'Crew'];
          const accessLevel: AccessLevel = validLevels.includes(member.accessLevel as AccessLevel)
            ? (member.accessLevel as AccessLevel)
            : 'Crew';
          t.email = member.email;
          t.firstName = member.firstName;
          t.lastName = member.lastName;
          t.displayName = member.displayName;
          t.accessLevel = accessLevel;
          t.rosterType = member.rosterType || 'team';
          t.primaryRole = member.primaryRole;
        }
      } catch {
        // leave existing token values in place
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as typeof token & EpaTokenFields;
      session.user = {
        ...session.user,
        email: t.email || session.user?.email || '',
        firstName: t.firstName || '',
        lastName: t.lastName || '',
        displayName: t.displayName || t.firstName || session.user?.email || '',
        accessLevel: t.accessLevel || 'Crew',
        rosterType: t.rosterType || 'team',
        primaryRole: t.primaryRole || '',
      };
      return session;
    },
  },
});
