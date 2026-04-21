'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BriefCard, { BriefDetailModal, type PipelineBrief } from '@/components/BriefCard';
import { useSession } from '@/context/SessionContext';

export default function DashboardPage() {
  const { user, loading } = useSession();
  const [wrote, setWrote] = useState<PipelineBrief[]>([]);
  const [onBrief, setOnBrief] = useState<PipelineBrief[]>([]);
  const [fetching, setFetching] = useState(true);
  const [detail, setDetail] = useState<PipelineBrief | null>(null);

  useEffect(() => {
    fetch('/api/briefs')
      .then(r => r.json())
      .then(d => { setWrote(d.wrote || []); setOnBrief(d.onBrief || []); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  if (loading) return null;

  const modalOpen = !!detail;

  return (
    <div className="min-h-screen">
      <div
        style={{
          transform: modalOpen ? 'scale(0.96)' : 'scale(1)',
          filter: modalOpen ? 'blur(8px)' : 'blur(0)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
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
                      <div
                        key={b.briefId || `${b.date}-${i}`}
                        className="opacity-0 animate-fadeUp"
                        style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
                      >
                        <BriefCard brief={b} onOpen={setDetail} />
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
                    <div
                      key={b.briefId || `${b.date}-${i}`}
                      className="opacity-0 animate-fadeUp"
                      style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
                    >
                      <BriefCard brief={b} onOpen={setDetail} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <BriefDetailModal brief={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
