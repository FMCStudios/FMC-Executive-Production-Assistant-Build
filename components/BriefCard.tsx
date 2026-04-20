'use client';

import { useState, useEffect } from 'react';
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

// Priority: [Client · Company · Type] → [Client · Type] → [Project · Type] → Untitled · Type.
// The sheet stores `client` (extracted from the brief's context), `company`,
// and `project` — we never want a bare "[phase] · [Type]" to leak out.
export function resolveBriefTitle(b: PipelineBrief): string {
  const type = (b.briefType || 'Brief').trim();
  const client = b.client?.trim();
  const company = b.company?.trim();
  const project = b.project?.trim();

  if (client && company) return `${client} \u00B7 ${company} \u00B7 ${type}`;
  if (client) return `${client} \u00B7 ${type}`;
  if (project) return `${project} \u00B7 ${type}`;
  return `Untitled \u00B7 ${type}`;
}

export default function BriefCard({
  brief,
  onOpen,
  onArchive,
  onUnarchive,
  onDelete,
  compact = false,
}: {
  brief: PipelineBrief;
  onOpen?: (brief: PipelineBrief) => void;
  onArchive?: (brief: PipelineBrief) => void;
  onUnarchive?: (brief: PipelineBrief) => void;
  onDelete?: (brief: PipelineBrief) => void;
  compact?: boolean;
}) {
  const pill = leadPillStyle(brief.leadState);
  const title = resolveBriefTitle(brief);
  const hasMenu = !!onArchive || !!onUnarchive || !!onDelete;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(brief)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(brief);
        }
      }}
      className={`glass-panel text-left w-full p-4 overflow-hidden cursor-pointer active:scale-[0.97] relative ${compact ? 'min-w-[260px]' : ''}`}
      style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: 'rgba(224,52,19,0.15)', color: '#E03413', border: '1px solid rgba(224,52,19,0.3)' }}
        >
          {brief.phase || '?'}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {brief.leadState && (
            <span
              className="text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
              style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
            >
              {brief.leadState}
            </span>
          )}
          {hasMenu && (
            <KebabMenu
              onArchive={onArchive ? () => onArchive(brief) : undefined}
              onUnarchive={onUnarchive ? () => onUnarchive(brief) : undefined}
              onDelete={onDelete ? () => onDelete(brief) : undefined}
            />
          )}
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-fmc-offwhite leading-snug mb-1 line-clamp-2 break-words">
          {title}
        </h3>
        {!compact && brief.description && (
          <p className="text-xs text-white/50 line-clamp-2 mb-2 break-words">{brief.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/40 mt-2 min-w-0">
        <span className="truncate min-w-0">{brief.operator || 'Unassigned'}</span>
        <span className="flex-shrink-0 ml-2">{formatDate(brief.date)}</span>
      </div>
      {brief.criticalGaps > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-fmc-firestarter">{'\u26A0'}</span>
          <span className="text-[10px] text-fmc-firestarter/80">
            {brief.criticalGaps} critical gap{brief.criticalGaps === 1 ? '' : 's'}
          </span>
        </div>
      )}
    </div>
  );
}

function KebabMenu({
  onArchive,
  onUnarchive,
  onDelete,
}: {
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDocClick = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-fmc-offwhite active:scale-[0.97]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-label="Card menu"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <div
          className="glass-modal absolute right-0 top-full mt-1.5 w-40 rounded-xl overflow-hidden animate-fadeIn z-10"
          onClick={stop}
        >
          <div className="p-1">
            {onArchive && (
              <MenuItem label="Archive" onClick={() => { setOpen(false); onArchive(); }} />
            )}
            {onUnarchive && (
              <MenuItem label="Unarchive" onClick={() => { setOpen(false); onUnarchive(); }} />
            )}
            {onDelete && (
              <MenuItem label="Delete" destructive onClick={() => { setOpen(false); onDelete(); }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-xs rounded-lg active:scale-[0.97]"
      style={{
        color: destructive ? '#E03413' : 'rgba(240,235,225,0.85)',
        transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = destructive ? 'rgba(224,52,19,0.1)' : 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {label}
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
  const isOpen = !!brief;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!brief) return null;
  const pill = leadPillStyle(brief.leadState);
  const headline = resolveBriefTitle(brief);

  return (
    <>
      <div
        onClick={onClose}
        className="glass-modal-backdrop fixed inset-0 z-[100] animate-fadeIn"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none px-6">
        <div
          className="glass-modal pointer-events-auto max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-modalIn relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0 flex-1">
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
                <h1 className="text-xl font-bold tracking-tight text-fmc-offwhite mb-1 break-words">{headline}</h1>
                {brief.description && (
                  <p className="text-sm text-white/50 break-words">{brief.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white/40 hover:text-fmc-offwhite active:scale-[0.97] flex-shrink-0"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
