'use client';

import { useState, useMemo } from 'react';
import type { BriefSchema, SCTMode, LeadState, SourceAttribution } from '@/types/brief-schema';
import { COLD_LEAD_STATES } from '@/types/brief-schema';

type Props = {
  data: BriefSchema;
  brandId: string;
  brandName: string;
  brandTagline: string;
  accentColor: string;
  briefTypeName: string;
  sctMode: SCTMode;
};

function formatHeader(data: BriefSchema, briefTypeName: string): string {
  const name = [data.clientFirstName, data.clientLastName].filter(Boolean).join(' ').trim();
  const parts = [name, data.companyName, briefTypeName].filter(Boolean);
  if (parts.length >= 2) return parts.join(' \u00B7 ');
  return data.projectName || briefTypeName;
}

function leadPillStyle(state: LeadState): { bg: string; border: string; color: string } {
  if (state === 'Won') return { bg: 'rgba(73,121,123,0.15)', border: 'rgba(73,121,123,0.4)', color: '#49797B' };
  if (state === 'In Production' || state === 'Formal Quote Requested' || state === 'Formal Pitch Requested') {
    return { bg: 'rgba(224,52,19,0.15)', border: 'rgba(224,52,19,0.4)', color: '#E03413' };
  }
  if (state === 'Nurture Needed' || state === 'On Hold') {
    return { bg: 'rgba(180,95,52,0.15)', border: 'rgba(180,95,52,0.4)', color: '#B45F34' };
  }
  return { bg: 'rgba(62,62,62,0.25)', border: 'rgba(62,62,62,0.5)', color: '#888880' };
}

function SourceBadge({ source }: { source?: SourceAttribution }) {
  if (!source) return null;
  const palette = source === 'transcript'
    ? { bg: 'rgba(224,52,19,0.08)', border: 'rgba(224,52,19,0.3)', color: '#E03413', label: 'TRANSCRIPT' }
    : source === 'reflection'
      ? { bg: 'rgba(180,95,52,0.08)', border: 'rgba(180,95,52,0.3)', color: '#B45F34', label: 'REFLECTION' }
      : { bg: 'rgba(73,121,123,0.08)', border: 'rgba(73,121,123,0.3)', color: '#49797B', label: 'INHERITED' };
  return (
    <span
      className="text-[9px] font-bold tracking-[0.15em] px-1.5 py-0.5 rounded-full"
      style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color }}
    >
      {palette.label}
    </span>
  );
}

export default function BriefOutput({
  data,
  brandId,
  brandName,
  brandTagline: _brandTagline,
  accentColor: _accentColor,
  briefTypeName,
  sctMode,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [driveLinks, setDriveLinks] = useState<{ pdf?: string; json?: string } | null>(null);

  void brandId;
  void _brandTagline;
  void _accentColor;

  const timestamp = useMemo(
    () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
    []
  );

  const headerLine = formatHeader(data, briefTypeName);
  const pill = leadPillStyle(data.leadState);
  const isCold = COLD_LEAD_STATES.includes(data.leadState);

  const sectionsFiltered = isCold
    ? data.sections.filter(s => !/tiers?|three\s*tiers/i.test(s.header))
    : data.sections;

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push(headerLine);
    if (data.projectDescription) lines.push(data.projectDescription);
    lines.push('');
    if (data.strategicNote) {
      lines.push('STRATEGIC NOTE:');
      lines.push(data.strategicNote);
      lines.push('');
    }
    if (data.context.length > 0) {
      for (const kv of data.context) lines.push(`${kv.label}: ${kv.value}`);
      lines.push('');
    }
    for (const section of sectionsFiltered) {
      lines.push(section.header.toUpperCase() + ':');
      if (section.body) lines.push(section.body);
      if (section.items) section.items.forEach(i => lines.push(`- ${i}`));
      if (section.keyValues) section.keyValues.forEach(kv => lines.push(`${kv.label}: ${kv.value}`));
      if (section.checklist) section.checklist.forEach(c => lines.push(`${c.checked ? '[x]' : '[ ]'} ${c.label}`));
      lines.push('');
    }
    if (isCold && data.reEngagementTrigger) {
      lines.push('RE-ENGAGEMENT CONDITIONS:');
      lines.push(data.reEngagementTrigger);
      lines.push('');
    }
    if (data.sctPrimary) {
      lines.push(data.sctPrimary.groupLabel.toUpperCase() + ':');
      for (const b of data.sctPrimary.blocks) lines.push(`${b.label}: ${b.content}`);
      lines.push('');
    }
    if (data.sctSecondary) {
      lines.push(data.sctSecondary.groupLabel.toUpperCase() + ':');
      for (const b of data.sctSecondary.blocks) lines.push(`${b.label}: ${b.content}`);
      lines.push('');
    }
    if (data.gaps.length > 0) {
      lines.push('GAPS:');
      data.gaps.forEach(g => lines.push(`- [${g.severity || 'moderate'}] ${g.text}`));
      lines.push('');
    }
    if (data.nextSteps.length > 0) {
      lines.push('NEXT STEPS:');
      data.nextSteps.forEach(s => {
        const dl = s.deadline ? ` (${s.deadline})` : '';
        lines.push(`${s.owner}: ${s.action}${dl}`);
      });
    }
    if (data.gammaPrompt) {
      lines.push('');
      lines.push('GAMMA PROMPT:');
      lines.push(data.gammaPrompt);
    }
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    setPdfError(false);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, brandId, brandName, briefTypeName, sctMode }),
      });
      if (!res.ok) throw new Error('PDF generation failed');

      const pdfUrl = res.headers.get('X-Drive-Pdf-Url') || undefined;
      const jsonUrl = res.headers.get('X-Drive-Json-Url') || undefined;
      if (pdfUrl || jsonUrl) setDriveLinks({ pdf: pdfUrl, json: jsonUrl });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        || `${brandName.replace(/\s+/g, '-')}_${briefTypeName.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfError(true);
      setTimeout(() => setPdfError(false), 4000);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const nextStepGroups = (() => {
    const groups = new Map<string, typeof data.nextSteps>();
    for (const step of data.nextSteps) {
      const owner = step.owner || 'General';
      if (!groups.has(owner)) groups.set(owner, []);
      groups.get(owner)!.push(step);
    }
    const orderedKeys = Array.from(groups.keys()).filter(k => k !== 'General');
    if (groups.has('General')) orderedKeys.push('General');
    return { groups, orderedKeys };
  })();

  return (
    <div className="glass-panel mt-6 animate-fadeUp overflow-hidden">
      <div
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(to right, #E03413, #B45F34, transparent)' }}
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-1 rounded-full"
              style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}
            >
              {data.leadState}
            </span>
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/40">{briefTypeName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="btn-ghost px-4 py-2 text-xs flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? 'Copied' : 'Copy Brief'}
            </button>
            <button onClick={handleDownloadPDF} disabled={generatingPDF} className="btn-ghost px-4 py-2 text-xs flex items-center gap-2">
              {generatingPDF ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating PDF...
                </>
              ) : pdfError ? (
                <span className="text-fmc-firestarter">PDF failed — try Copy Brief</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Header line */}
        <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-1">
          {headerLine}
        </h1>
        {data.projectDescription && (
          <p className="text-sm text-white/50 mb-5">{data.projectDescription}</p>
        )}

        {/* Drive links banner */}
        {driveLinks && (driveLinks.pdf || driveLinks.json) && (
          <div
            className="mb-5 rounded-lg px-3 py-2 flex flex-wrap items-center gap-3 text-[11px]"
            style={{ background: 'rgba(73,121,123,0.08)', border: '1px solid rgba(73,121,123,0.25)' }}
          >
            <span className="text-fmc-teal font-semibold tracking-[0.15em] uppercase">Uploaded to Drive</span>
            {driveLinks.pdf && (
              <a href={driveLinks.pdf} target="_blank" rel="noreferrer" className="text-fmc-teal underline underline-offset-2">View PDF</a>
            )}
            {driveLinks.json && (
              <a href={driveLinks.json} target="_blank" rel="noreferrer" className="text-fmc-teal underline underline-offset-2">JSON sidecar</a>
            )}
          </div>
        )}

        {/* Strategic note — promoted to top */}
        {data.strategicNote && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(224,52,19,0.06)',
              borderLeft: '3px solid rgba(224,52,19,0.5)',
            }}
          >
            <h3 className="label-upper text-fmc-firestarter mb-2">Strategic Note</h3>
            <p className="text-sm text-white/85 leading-relaxed">{data.strategicNote}</p>
          </div>
        )}

        {/* Context grid */}
        {data.context.length > 0 && (
          <div className="mb-6">
            <h3 className="label-upper text-white/60 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-fmc-copper" />
              Context
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.context.map((kv, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-fmc-firestarter/80 block mb-1">{kv.label}</span>
                  <span className="text-sm font-medium text-fmc-offwhite">{kv.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content sections */}
        {sectionsFiltered.map((section, si) => (
          <div
            key={`s-${si}`}
            className="opacity-0 animate-fadeUp mt-5 first:mt-0"
            style={{ animationDelay: `${si * 60}ms` }}
          >
            <div className="border-t border-white/[0.06] pt-4 first:border-t-0 first:pt-0">
              <h3 className="label-upper text-white/60 mb-3 flex items-center gap-2">
                <span className="w-[2px] h-3 bg-fmc-firestarter rounded-full" />
                {section.header}
                <SourceBadge source={section.source} />
              </h3>

              {section.body && (
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{section.body}</p>
              )}

              {section.items && section.items.length > 0 && (
                <ul className="space-y-1.5 my-1">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="text-fmc-copper mt-0.5 flex-shrink-0">&middot;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.keyValues && section.keyValues.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {section.keyValues.map((kv, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 block mb-0.5">{kv.label}</span>
                      <span className="text-sm text-fmc-offwhite">{kv.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {section.checklist && section.checklist.length > 0 && (
                <div className="space-y-1.5 mt-1">
                  {section.checklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`flex-shrink-0 mt-0.5 ${item.checked ? 'text-fmc-teal' : 'text-white/30'}`}>
                        {item.checked ? '\u2713' : '\u25A1'}
                      </span>
                      <span className="text-white/80">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Re-engagement conditions */}
        {isCold && data.reEngagementTrigger && (
          <div className="mt-6">
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="label-upper text-fmc-copper mb-3">Re-Engagement Conditions</h3>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{data.reEngagementTrigger}</p>
            </div>
          </div>
        )}

        {/* SCT groups */}
        {data.sctPrimary && sctMode !== 'none' && (
          <div className="opacity-0 animate-fadeUp mt-6" style={{ animationDelay: `${sectionsFiltered.length * 60}ms` }}>
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fmc-copper" />
                {data.sctPrimary.groupLabel}
              </h3>
              <div className="border-l-2 border-fmc-copper pl-4 space-y-3">
                {data.sctPrimary.blocks.map((block, bi) => (
                  <div key={bi} className="bg-white/[0.03] rounded-xl p-4">
                    <span className="label-upper text-white/50 block mb-2">{block.label}</span>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{block.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data.sctSecondary && sctMode === 'dual' && (
          <div className="opacity-0 animate-fadeUp mt-6">
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fmc-copper" />
                {data.sctSecondary.groupLabel}
              </h3>
              <div className="border-l-2 border-fmc-copper pl-4 space-y-3">
                {data.sctSecondary.blocks.map((block, bi) => (
                  <div key={bi} className="bg-white/[0.03] rounded-xl p-4">
                    <span className="label-upper text-white/50 block mb-2">{block.label}</span>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{block.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gaps */}
        {data.gaps.length > 0 ? (
          <div className="opacity-0 animate-fadeUp mt-6">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(224,52,19,0.06)',
                borderLeft: '3px solid rgba(224,52,19,0.4)',
              }}
            >
              <h3 className="label-upper text-fmc-firestarter mb-3">GAPS IDENTIFIED</h3>
              <ul className="space-y-2">
                {data.gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-fmc-offwhite leading-relaxed">
                    <span className="text-fmc-firestarter flex-shrink-0 mt-px">{'\u26A0'}</span>
                    <span>{gap.text}</span>
                    <SourceBadge source={gap.source} />
                    {gap.severity && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-auto whitespace-nowrap ${
                        gap.severity === 'critical' ? 'bg-fmc-firestarter/10 text-fmc-firestarter' :
                        gap.severity === 'moderate' ? 'bg-fmc-copper/10 text-fmc-copper' :
                        'bg-white/[0.06] text-white/40'
                      }`}>
                        {gap.severity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="opacity-0 animate-fadeUp mt-6">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(73,121,123,0.06)',
                borderLeft: '3px solid rgba(73,121,123,0.3)',
              }}
            >
              <p className="text-sm text-fmc-teal flex items-center gap-2">
                <span>{'\u2713'}</span> No gaps identified
              </p>
            </div>
          </div>
        )}

        {/* Next steps */}
        {data.nextSteps.length > 0 && (
          <div className="opacity-0 animate-fadeUp mt-6">
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
                <span className="w-[2px] h-3 bg-fmc-firestarter rounded-full" />
                Next Steps
              </h3>
              <div className="space-y-5">
                {nextStepGroups.orderedKeys.map((owner, gi) => (
                  <div key={gi}>
                    <span className="label-upper text-fmc-firestarter block mb-2">{owner}</span>
                    <div className="border-l-2 border-fmc-copper pl-4 space-y-1.5">
                      {nextStepGroups.groups.get(owner)!.map((step, ai) => (
                        <div key={ai} className="flex items-baseline gap-2 text-sm text-white/70 leading-relaxed">
                          <span className="text-fmc-firestarter/40 flex-shrink-0">{'\u2192'}</span>
                          <span className="flex-1">{step.action}</span>
                          <SourceBadge source={step.source} />
                          {step.deadline && (
                            <span className="inline-flex bg-white/[0.06] rounded-full px-2 py-0.5 text-xs text-fmc-teal whitespace-nowrap">
                              {step.deadline}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gamma prompt (pitch briefs) */}
        {data.gammaPrompt && (
          <div className="opacity-0 animate-fadeUp mt-6">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(180,95,52,0.06)',
                borderLeft: '3px solid rgba(180,95,52,0.4)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="label-upper text-fmc-copper">Gamma Prompt</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(data.gammaPrompt || '')}
                  className="btn-ghost px-3 py-1.5 text-[11px] active:scale-[0.97]"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap font-mono">
                {data.gammaPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Version history footer */}
        {data.versionHistory && data.versionHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 block mb-1">Version history</span>
            <span className="text-xs text-white/40">
              {data.versionHistory.map(v => {
                const d = new Date(v.timestamp);
                const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return v.regeneratedReason
                  ? `v${v.version} \u00B7 regenerated ${date} ${time}`
                  : `v${v.version} \u00B7 generated ${date}`;
              }).join('   \u00B7   ')}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-4 text-xs text-white/30">
          Viewed {timestamp}
        </div>
      </div>
    </div>
  );
}
