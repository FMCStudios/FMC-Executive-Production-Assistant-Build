'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useSession } from '@/context/SessionContext';

type Brief = {
  date: string;
  briefType: string;
  phase: string;
  project: string;
  client: string;
  status: string;
  description: string;
  briefId: string;
};

export default function DashboardPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [wrote, setWrote] = useState<Brief[]>([]);
  const [onBrief, setOnBrief] = useState<Brief[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/briefs')
      .then(r => r.json())
      .then(d => { setWrote(d.wrote || []); setOnBrief(d.onBrief || []); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-1">
              {user ? `Hey, ${user.displayName}` : 'Dashboard'}
            </h1>
            <p className="text-sm text-white/40">
              {user?.accessLevel === 'Crew' ? 'Your briefs and assignments.' : 'Your briefs and pipeline.'}
            </p>
          </div>

          {/* Quick actions for supervisors */}
          {user && user.accessLevel !== 'Crew' && (
            <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={() => router.push('/')} className="btn-ghost px-4 py-2 text-xs active:scale-[0.97]">
                New Brief
              </button>
              <button onClick={() => router.push('/crew')} className="btn-ghost px-4 py-2 text-xs active:scale-[0.97]">
                Crew &amp; Gear
              </button>
              <button onClick={() => router.push('/profile')} className="btn-ghost px-4 py-2 text-xs active:scale-[0.97]">
                My Profile
              </button>
            </div>
          )}

          {fetching && <div className="text-sm text-white/40 animate-pulse">Loading briefs...</div>}

          {/* Briefs I Wrote */}
          {!fetching && (
            <div className="mb-10">
              <h2 className="text-sm font-semibold text-fmc-offwhite mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fmc-firestarter" />
                Briefs I Wrote
              </h2>
              {wrote.length === 0 ? (
                <div className="glass-panel p-5 text-sm text-white/40">No briefs yet.</div>
              ) : (
                <div className="space-y-3">
                  {wrote.slice(0, 20).map((b, i) => (
                    <div key={i} className="glass-panel p-4 opacity-0 animate-fadeUp" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter/60">Phase {b.phase}</span>
                        <span className="text-[10px] text-white/30">{b.briefType}</span>
                        <span className="text-[10px] text-white/20 ml-auto">{new Date(b.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium text-fmc-offwhite">{b.project || 'Untitled'}</p>
                      {b.description && <p className="text-xs text-white/40 mt-0.5">{b.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Briefs I'm On */}
          {!fetching && onBrief.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-fmc-offwhite mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fmc-teal" />
                Briefs I&rsquo;m On
              </h2>
              <div className="space-y-3">
                {onBrief.slice(0, 20).map((b, i) => (
                  <div key={i} className="glass-panel p-4 opacity-0 animate-fadeUp" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-teal/60">Phase {b.phase}</span>
                      <span className="text-[10px] text-white/30">{b.briefType}</span>
                      <span className="text-[10px] text-white/20 ml-auto">{new Date(b.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-fmc-offwhite">{b.project || 'Untitled'}</p>
                    {b.description && <p className="text-xs text-white/40 mt-0.5">{b.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
