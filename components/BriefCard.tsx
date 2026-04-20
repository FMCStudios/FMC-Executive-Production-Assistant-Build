'use client';

import type { LeadState } from '@/types/brief-schema';

export type PipelineBrief = {
  date: string;
  brand: string;
  briefType: string;
  phase: string;
  operator: string;
  project: string;
  client: string;
  status: string;
  criticalGaps: number;
  totalGaps: number;
  owners: string;
  budget: string;
  timeline: string;
  gapsDetail: string;
  nextStepsDetail: string;
  description: string;
  briefId: string;
  operatorEmail: string;
  crewOnBrief: string;
  leadState: string;
  company: string;
};

function leadPillStyle(state: string): { bg: string; border: string; color: string } {
  if (state === 'Won') return { bg: 'rgba(73,121,123,0.15)', border: 'rgba(73,121,123,0.4)', color: '#49797B' };
  if (state === 'In Production' || state === 'Formal Quote Requested' || state === 'Formal Pitch Requested') {
    return { bg: 'rgba(224,52,19,0.15)', border: 'rgba(224,52,19,0.4)', color: '#E03413' };
  }
  if (state === 'Nurture Needed' || state === 'On Hold') {
    return { bg: 'rgba(180,95,52,0.15)', border: 'rgba(180,95,52,0.4)', color: '#B45F34' };
  }
  return { bg: 'rgba(62,62,62,0.25)', border: 'rgba(62,62,62,0.5)', color: '#888880' };
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BriefCard({
  brief,
  onOpen,
  compact = false,
}: {
  brief: PipelineBrief;
  onOpen?: (brief: PipelineBrief) => void;
  compact?: boolean;
}) {
  const pill = leadPillStyle(brief.leadState);
  const headline = [brief.client, brief.company, brief.briefType].filter(Boolean).join(' \u00B7 ') || brief.project;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(brief)}
      className={`glass-panel text-left w-full p-4 active:scale-[0.97] ${compact ? 'min-w-[260px]' : ''}`}
      style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: 'rgba(224,52,19,0.15)', color: '#E03413', border: '1px solid rgba(224,52,19,0.3)' }}
        >
          {brief.phase || '?'}
        </span>
        {brief.leadState && (
          <span
            className="text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
            style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
          >
            {brief.leadState}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-fmc-offwhite leading-snug mb-1 truncate">
        {headline}
      </p>
      {!compact && brief.description && (
        <p className="text-xs text-white/50 line-clamp-2 mb-2">{brief.description}</p>
      )}
      <div className="flex items-center justify-between text-[10px] text-white/40 mt-2">
        <span className="truncate">{brief.operator || 'Unassigned'}</span>
        <span>{formatDate(brief.date)}</span>
      </div>
      {brief.criticalGaps > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-fmc-firestarter">{'\u26A0'}</span>
          <span className="text-[10px] text-fmc-firestarter/80">
            {brief.criticalGaps} critical gap{brief.criticalGaps === 1 ? '' : 's'}
          </span>
        </div>
      )}
    </button>
  );
}

export function BriefDetailModal({
  brief,
  onClose,
}: {
  brief: PipelineBrief | null;
  onClose: () => void;
}) {
  if (!brief) return null;
  const pill = leadPillStyle(brief.leadState);
  const headline = [brief.client, brief.company, brief.briefType].filter(Boolean).join(' \u00B7 ') || brief.project;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100]"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'fmcBackdropFade 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none px-6">
        <div
          className="glass-modal pointer-events-auto max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            animation: 'fmcFadeScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {brief.leadState && (
                    <span
                      className="text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                      style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
                    >
                      {brief.leadState}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">Phase {brief.phase}</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-fmc-offwhite mb-1">{headline}</h1>
                {brief.description && (
                  <p className="text-sm text-white/50">{brief.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white/40 hover:text-white/80 text-xl leading-none active:scale-[0.97]"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MetaCard label="Operator" value={brief.operator} />
                <MetaCard label="Generated" value={formatDate(brief.date)} />
                {brief.owners && <MetaCard label="Owners" value={brief.owners} />}
                {brief.budget && <MetaCard label="Budget" value={brief.budget} />}
                {brief.timeline && <MetaCard label="Timeline" value={brief.timeline} />}
                <MetaCard
                  label="Gaps"
                  value={`${brief.criticalGaps} critical / ${brief.totalGaps} total`}
                />
              </div>

              {brief.gapsDetail && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(224,52,19,0.06)', borderLeft: '3px solid rgba(224,52,19,0.4)' }}
                >
                  <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter block mb-2">Gaps</span>
                  <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                    {brief.gapsDetail.split(' | ').join('\n')}
                  </p>
                </div>
              )}

              {brief.nextStepsDetail && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(180,95,52,0.06)', borderLeft: '3px solid rgba(180,95,52,0.4)' }}
                >
                  <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-copper block mb-2">Next Steps</span>
                  <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                    {brief.nextStepsDetail.split(' | ').join('\n')}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-white/30 italic">
                Full brief JSON lives in Drive under the company folder. Open the sidecar there for the complete render.
              </p>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fmcFadeScale {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fmcBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-fmc-firestarter/80 block mb-0.5">
        {label}
      </span>
      <span className="text-xs font-medium text-fmc-offwhite">{value || '—'}</span>
    </div>
  );
}

// Re-export the LeadState type for convenience in page code.
export type { LeadState };
