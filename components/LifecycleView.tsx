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
  subModules: string[];
};

const phaseMeta: Record<number, PhaseMeta> = {
  1: {
    fills: 'Supervising Producer or Production Assistant',
    reads: 'Supervising Producer',
    time: 'Under 2 min',
    failure: 'Too slow or formal — momentum dies, lead goes cold',
    output: 'One-card lead summary — glance and decide next move',
    subModules: [
      'Client name + company',
      'How they found us',
      'What they think they need',
      'Gut read + next step',
      'Deadlines + contact info',
    ],
  },
  2: {
    fills: 'Supervising Producer (post-call)',
    reads: 'Supervising Producer, Biz Dev, Gamma proposal engine',
    time: '5-10 min voice dump',
    failure: "Doesn't surface the gap between ask vs need — underprice or misscope",
    output: 'Scoping doc with 3-tier pricing, feeds into Gamma proposal',
    subModules: [
      'What they asked for vs what they need',
      'SCT narrative (Situation / Challenge / Transformation)',
      '3 tiers: lean / right / dream',
      'Budget signals + timeline + decision maker',
      'Red flags + competitive context',
    ],
  },
  3: {
    fills: 'Supervising Producer, may delegate to Production Assistant',
    reads: 'Crew, talent, vendors, Post Supervisor',
    time: 'Varies — modular',
    failure: 'Wrong gear, wrong crew count, no location pin — someone shows up unprepared',
    output: 'Modular crew-ready brief: call sheet, gear, crew, creative, strategy',
    subModules: [
      'Call Sheet — times, location, schedule, weather backup',
      'Gear List — cameras, audio, lighting, grip, power',
      'Crew Sheet — name, role, rate, call time, needs',
      'Creative Ref — moodboard, tone words, shot list, wardrobe',
      'Paper Edit — story arc, questions, soundbites (if interview)',
      'Strategy Echo — why, audience, platform, CTA, success metric',
    ],
  },
  4: {
    fills: 'Supervising Producer',
    reads: 'Post Supervisor, Editor, colourist, sound mixer',
    time: '10-15 min — most critical brief',
    failure: 'Editor guesses — wrong tone, wrong pacing, revision hell',
    output: 'Editor-ready brief with full technical, creative, and delivery specs',
    subModules: [
      'Technical — codec, frame rate, audio layout, known issues',
      'Assets — footage location, selects, music, graphics, VO',
      'Paper Edit — story arc, scene order, must-include, must-avoid',
      'Creative Direction — tone, grade, graphics, sound design',
      'Strategy Echo — audience, platform, CTA',
      'Deliverables — formats, versions, captions, thumbnails',
      'Timeline — rough cut, revisions, final delivery',
    ],
  },
  5: {
    fills: 'Client (survey) + Supervising Producer (debrief)',
    reads: 'Supervising Producer, Production Assistant (follow-up), Biz Dev (revenue)',
    time: 'Client: 3 min. Producer: 5 min',
    failure: 'Skip it — lose the upsell, the testimonial, the data',
    output: 'Client survey + internal debrief + retention triggers',
    subModules: [
      'Client Survey — satisfaction, referral, testimonial, portfolio permission',
      'Internal Debrief — wins, time leaks, crew notes, scope creep, budget vs actual',
      'Retention Trigger — next project, retainer potential, follow-up date, cross-sell',
    ],
  },
  6: {
    fills: 'Production Assistant or Post Supervisor. Supervising Producer reviews',
    reads: 'Anyone who touches storage, future production teams',
    time: '5 min checklist',
    failure: "Can't prove delivery, storage liability, can't find old work",
    output: 'Delivery proof + asset map + storage status + portfolio flags',
    subModules: [
      'Delivery Log — finals sent, method, confirmation',
      'Asset Map — raw, project files, exports, music, graphics',
      'Storage Status — size, backup, cloud vs local',
      'Deletion Auth — retention policy, client response, legal hold',
      'Portfolio Flag — approved for reel, best clips, case study potential',
    ],
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
                className="py-5 opacity-0 animate-fadeUp"
                style={{ animationDelay: `${(index) * 60}ms` }}
              >
                {/* Top: S·C·T with up arrow */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fmc-teal/50">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span className="text-[10px] font-medium tracking-wide text-fmc-teal/60">
                    situation &middot; challenge &middot; transformation
                  </span>
                </div>

                {/* Center: handshake pill with lines */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-fmc-copper/30" />
                  <div
                    className="px-4 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(180,95,52,0.08)',
                      border: '1px solid rgba(180,95,52,0.2)',
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-fmc-copper/70">
                      handshake
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-fmc-copper/30" />
                </div>

                {/* Bottom: S·C·T with down arrow */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fmc-copper/50">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                  <span className="text-[10px] font-medium tracking-wide text-fmc-copper/60">
                    strategy &middot; creative &middot; tactics
                  </span>
                </div>
              </div>
            )}

            {/* Phase card */}
            <div
              className="opacity-0 animate-fadeUp"
              style={{ animationDelay: `${(index + 1) * 60}ms` }}
            >
              <button
                onClick={() => toggleExpand(brief.id)}
                className={`group w-full glass-panel p-5 text-left cursor-pointer active:scale-[0.97] ${
                  index < briefTypesList.length - 1 && !showHinge ? 'mb-3' : ''
                } ${showHinge ? 'mb-3' : ''} ${isExpanded ? 'glass-panel-active border-l-2 border-fmc-firestarter' : ''}`}
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
                        background: 'rgba(224,52,19,0.15)',
                        color: '#E03413',
                        border: '1px solid rgba(224,52,19,0.3)',
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
                            ? 'situation \u00b7 challenge \u00b7 transformation'
                            : 'strategy \u00b7 creative \u00b7 tactics'
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
                    className="flex-shrink-0 mt-2 text-white/30 group-hover:text-fmc-firestarter"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-0.5">
                          Who fills
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.fills}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-0.5">
                          Who reads
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.reads}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-0.5">
                          Time to fill
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.time}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-0.5">
                          Output
                        </span>
                        <span className="text-xs text-fmc-offwhite">{meta.output}</span>
                      </div>
                    </div>

                    {/* Sub-modules */}
                    <div className="mb-4">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-2">
                        What it captures
                      </span>
                      <div className="space-y-1">
                        {meta.subModules.map((mod, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <span className="text-fmc-copper mt-0.5 flex-shrink-0">&middot;</span>
                            <span>{mod}</span>
                          </div>
                        ))}
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
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-fmc-firestarter/60 block mb-0.5">
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
