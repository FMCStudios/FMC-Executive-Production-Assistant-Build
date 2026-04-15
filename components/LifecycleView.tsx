'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { briefTypesList } from '@/lib/briefs';
import { useOperator } from '@/context/OperatorContext';

type PhaseMeta = {
  fills: string;
  reads: string;
  time: string;
  failure: string;
  output: string;
};

const phaseMeta: Record<number, PhaseMeta> = {
  1: {
    fills: 'Brandon or Junior',
    reads: 'Brandon',
    time: 'Under 2 min',
    failure: 'Lead goes cold — no structured follow-up',
    output: 'Structured lead brief',
  },
  2: {
    fills: 'Brandon (post-call)',
    reads: 'Brandon, crew lead',
    time: '5-10 min',
    failure: 'Scope creep — no confirmed boundaries',
    output: 'Scoped brief with pricing tiers',
  },
  3: {
    fills: 'Brandon',
    reads: 'Crew',
    time: '10-15 min',
    failure: 'Crew shows up unprepared — missed shots, wrong gear',
    output: 'Crew-ready production brief',
  },
  4: {
    fills: 'Brandon',
    reads: 'Editor / post supervisor',
    time: '10-15 min',
    failure: 'Editor guesses — wrong tone, wrong pacing, revision hell',
    output: 'Editor-ready post brief',
  },
  5: {
    fills: 'Brandon + client survey',
    reads: 'Brandon',
    time: '5-10 min',
    failure: 'Client ghosts — no rebooking, no referral, no testimonial',
    output: 'Retention brief + follow-up plan',
  },
  6: {
    fills: 'Junior / Corey',
    reads: 'Anyone who needs the project later',
    time: '5 min',
    failure: "Files lost — can't find project when client comes back",
    output: 'Archive action plan',
  },
};

export default function LifecycleView() {
  const router = useRouter();
  const { activeOperator } = useOperator();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-0">
      {briefTypesList.map((brief, index) => {
        const meta = phaseMeta[brief.phase];
        const isExpanded = expanded === brief.id;
        const isTeal = brief.phase <= 2;
        const isOperatorPhase = activeOperator.phases.includes(brief.phase);
        const showHinge = brief.phase === 3;

        return (
          <div key={brief.id}>
            {/* Hinge divider between phase 2 and 3 */}
            {showHinge && (
              <div
                className="flex items-center gap-3 py-5 opacity-0 animate-fadeUp"
                style={{ animationDelay: `${(index) * 60}ms` }}
              >
                <div className="flex-1 h-px bg-fmc-copper/30" />
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(180,95,52,0.08)',
                    border: '1px solid rgba(180,95,52,0.2)',
                  }}
                >
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-fmc-copper/70">
                    handshake
                  </span>
                  <span className="text-fmc-copper/40 text-[10px]">—</span>
                  <span className="text-[10px] font-medium tracking-wide text-fmc-copper/50">
                    SCT flips to strategy · creative · tactics
                  </span>
                </div>
                <div className="flex-1 h-px bg-fmc-copper/30" />
              </div>
            )}

            {/* Phase card */}
            <div
              className="opacity-0 animate-fadeUp"
              style={{ animationDelay: `${(index + 1) * 60}ms` }}
            >
              <button
                onClick={() => toggleExpand(brief.id)}
                className={`w-full glass-panel hover-glow p-5 text-left active:scale-[0.97] ${
                  index < briefTypesList.length - 1 && !showHinge ? 'mb-3' : ''
                } ${showHinge ? 'mb-3' : ''} ${isExpanded ? 'glass-panel-active' : ''}`}
                style={{
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: isOperatorPhase ? undefined : 0.5,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Phase number circle */}
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: isTeal ? 'rgba(73,121,123,0.15)' : 'rgba(180,95,52,0.15)',
                        color: isTeal ? '#49797B' : '#B45F34',
                        border: `1px solid ${isTeal ? 'rgba(73,121,123,0.3)' : 'rgba(180,95,52,0.3)'}`,
                      }}
                    >
                      {brief.phase}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-fmc-offwhite">
                          {brief.name}
                        </h3>
                        {/* SCT badge */}
                        <span
                          className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: isTeal ? 'rgba(73,121,123,0.1)' : 'rgba(180,95,52,0.1)',
                            color: isTeal ? 'rgba(73,121,123,0.7)' : 'rgba(180,95,52,0.7)',
                            border: `1px solid ${isTeal ? 'rgba(73,121,123,0.2)' : 'rgba(180,95,52,0.2)'}`,
                          }}
                        >
                          {isTeal
                            ? 'situation · challenge · transformation'
                            : 'strategy · creative · tactics'
                          }
                        </span>
                      </div>
                      <p className="text-sm text-white/40 italic">
                        &ldquo;{brief.tagline}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 mt-2 text-white/30"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Expanded details */}
                {isExpanded && meta && (
                  <div
                    className="mt-4 pt-4 border-t border-white/[0.06] animate-fadeUp"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-0.5">
                          Who fills
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.fills}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-0.5">
                          Who reads
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.reads}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-0.5">
                          Time to fill
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.time}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-0.5">
                          Output
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.output}</span>
                      </div>
                    </div>

                    {/* Failure mode */}
                    <div
                      className="rounded-lg px-3 py-2.5 mb-4"
                      style={{
                        background: 'rgba(224,52,19,0.06)',
                        border: '1px solid rgba(224,52,19,0.15)',
                      }}
                    >
                      <span className="text-[10px] font-bold tracking-widest uppercase text-fmc-firestarter/60 block mb-0.5">
                        Failure mode
                      </span>
                      <span className="text-xs text-fmc-firestarter/80">{meta.failure}</span>
                    </div>

                    {/* Start Brief button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/brief/${brief.id}`);
                      }}
                      className="btn-firestarter px-5 py-2.5 text-xs flex items-center gap-2"
                    >
                      Start Brief
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
