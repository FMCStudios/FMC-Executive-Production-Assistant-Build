'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import type { CrewMember } from '@/lib/crew';

export default function CrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/crew')
      .then((res) => res.json())
      .then((data) => {
        if (data.crew) setCrew(data.crew);
        else setError(data.error || 'Failed to load crew roster');
      })
      .catch(() => setError('Failed to fetch crew roster'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-2">
              Crew Roster
            </h1>
            <p className="text-sm text-white/50">
              Managed in Google Sheets — read-only view.
            </p>
          </div>

          {loading && (
            <div className="text-sm text-white/40 animate-pulse">Loading roster...</div>
          )}

          {error && (
            <div
              className="glass-panel p-5 text-sm text-fmc-firestarter/80"
              style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
            >
              {error}
            </div>
          )}

          {!loading && !error && crew.length === 0 && (
            <div className="glass-panel p-5 text-sm text-white/50">
              No crew members found. Add rows to the &ldquo;Crew&rdquo; tab in Google Sheets.
            </div>
          )}

          {crew.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crew.map((member, i) => (
                <div
                  key={i}
                  className="glass-panel p-5 opacity-0 animate-fadeUp"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: 'rgba(224,52,19,0.15)',
                        color: '#E03413',
                        border: '1px solid rgba(224,52,19,0.3)',
                      }}
                    >
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-fmc-offwhite block">
                        {member.name}
                      </span>
                      <span className="text-xs text-fmc-copper">{member.role}</span>
                    </div>
                  </div>

                  {member.dayRate && (
                    <div className="text-xs text-white/50 mb-1">
                      <span className="text-fmc-firestarter/60">${member.dayRate}</span>
                      {member.kitFee && <span className="text-white/30"> + ${member.kitFee} kit</span>}
                    </div>
                  )}

                  {member.gear.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {member.gear.map((g, gi) => (
                        <span
                          key={gi}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {member.notes && (
                    <p className="text-xs text-white/30 mt-2 italic">{member.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
