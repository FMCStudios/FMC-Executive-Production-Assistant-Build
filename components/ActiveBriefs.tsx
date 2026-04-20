'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BriefCard, { BriefDetailModal, type PipelineBrief } from '@/components/BriefCard';
import { useSession } from '@/context/SessionContext';

export default function ActiveBriefs() {
  const { user } = useSession();
  const [briefs, setBriefs] = useState<PipelineBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PipelineBrief | null>(null);

  useEffect(() => {
    if (!user) return;
    const url = user.accessLevel === 'Admin' || user.accessLevel === 'Supervisor'
      ? '/api/briefs?scope=all'
      : '/api/briefs';
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const list: PipelineBrief[] = d.all || [...(d.wrote || []), ...(d.onBrief || [])];
        setBriefs(list.slice(0, 10));
      })
      .catch(() => setBriefs([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="mt-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-fmc-offwhite">Active Briefs</h2>
        </div>
        <div className="text-sm text-white/40 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="mt-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-fmc-offwhite">Active Briefs</h2>
          <Link
            href="/pipeline"
            className="text-[11px] uppercase tracking-[0.15em] text-fmc-firestarter/70 hover:text-fmc-firestarter"
            style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            View all in Pipeline →
          </Link>
        </div>
        <div className="glass-panel p-6 text-sm text-white/50 italic">
          No briefs yet. Fire up a Tool above and write the first one.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-fmc-offwhite">Active Briefs</h2>
        <Link
          href="/pipeline"
          className="text-[11px] uppercase tracking-[0.15em] text-fmc-firestarter/70 hover:text-fmc-firestarter active:scale-[0.97]"
          style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          View all in Pipeline →
        </Link>
      </div>
      <div className="overflow-x-auto pb-2 -mx-6 px-6">
        <div className="flex items-stretch gap-3" style={{ minWidth: 'min-content' }}>
          {briefs.map((b, i) => (
            <BriefCard key={b.briefId || `${b.date}-${i}`} brief={b} onOpen={setDetail} compact />
          ))}
        </div>
      </div>
      <BriefDetailModal brief={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
