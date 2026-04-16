'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ClientSession = {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  accessLevel: 'Admin' | 'Supervisor' | 'Crew';
};

type SessionContextType = {
  user: ClientSession | null;
  loading: boolean;
  refresh: () => void;
};

const SessionContext = createContext<SessionContextType>({ user: null, loading: true, refresh: () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = () => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSession(); }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
