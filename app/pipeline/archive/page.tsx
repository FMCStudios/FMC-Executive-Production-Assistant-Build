'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BriefCard, { BriefDetailModal, resolveBriefTitle, type PipelineBrief } from '@/components/BriefCard';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useSession } from '@/context/SessionContext';

export default function PipelineArchivePage() {
  const { user } = useSession();
  const [briefs, setBriefs] = useState<PipelineBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PipelineBrief | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PipelineBrief | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchBriefs = useCallback(() => {
    setLoading(true);
    const isPriv = user?.accessLevel === 'Admin' || user?.accessLevel === 'Supervisor';
    const url = isPriv ? '/api/briefs?scope=all&status=archived' : '/api/briefs?status=archived';
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          const list: PipelineBrief[] = d.all || [...(d.wrote || []), ...(d.onBrief || [])];
          setBriefs(list);
        }
      })
      .catch(() => setError('Failed to load archive'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchBriefs(); }, [fetchBriefs]);

  const handleUnarchive = async (brief: PipelineBrief) => {
    if (!brief.briefId || busy) return;
    setBusy(true);
    setBriefs(prev => prev.filter(b => b.briefId !== brief.briefId));
    try {
      await fetch(`/api/briefs/${encodeURIComponent(brief.briefId)}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Generated' }),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (brief: PipelineBrief) => {
    if (!brief.briefId || busy) return;
    setBusy(true);
    setBriefs(prev => prev.filter(b => b.briefId !== brief.briefId));
    try {
      await fetch(`/api/briefs/${encodeURIComponent(brief.briefId)}`, { method: 'DELETE' });
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  };

  const modalOpen = !!detail || !!confirmDelete;

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
        <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
          <div className="stagger">
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-2">Archive</h1>
                <p className="text-sm text-white/50">
                  Briefs hidden from the active pipeline.
                </p>
              </div>
              <Link
                href="/pipeline"
                className="text-[11px] uppercase tracking-[0.15em] text-white/50 hover:text-fmc-firestarter active:scale-[0.97]"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                ← Back to pipeline
              </Link>
            </div>

            {loading && (
              <div className="text-sm text-white/40 animate-pulse">Loading archive...</div>
            )}

            {error && (
              <div
                className="glass-panel p-5 text-sm text-fmc-firestarter/80"
                style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
              >
                {error}
              </div>
            )}

            {!loading && !error && briefs.length === 0 && (
              <div className="glass-panel p-8 text-center">
                <p className="text-sm text-white/50 mb-3">No archived briefs yet.</p>
                <Link
                  href="/pipeline"
                  className="text-[11px] uppercase tracking-[0.15em] text-fmc-firestarter/80 hover:text-fmc-firestarter"
                  style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  ← Back to active pipeline
                </Link>
              </div>
            )}

            {briefs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {briefs.map((b, i) => (
                  <div
                    key={b.briefId || `${b.date}-${i}`}
                    className="opacity-0 animate-fadeUp"
                    style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
                  >
                    <BriefCard
                      brief={b}
                      onOpen={setDetail}
                      onUnarchive={handleUnarchive}
                      onDelete={setConfirmDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <BriefDetailModal brief={detail} onClose={() => setDetail(null)} />
      <DeleteConfirmModal
        brief={confirmDelete}
        title={confirmDelete ? resolveBriefTitle(confirmDelete) : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}
