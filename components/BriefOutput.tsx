'use client';

import { useState, useMemo } from 'react';
import type { BriefSchema, SCTMode } from '@/types/brief-schema';

// ── Types ──────────────────────────────────────────────────────

type Props = {
  data: BriefSchema;
  brandId: string;
  brandName: string;
  brandTagline: string;
  accentColor: string;
  briefTypeName: string;
  sctMode: SCTMode;
};

// ── Main component ─────────────────────────────────────────────

export default function BriefOutput({
  data,
  brandId,
  brandName,
  brandTagline,
  accentColor,
  briefTypeName,
  sctMode,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const timestamp = useMemo(
    () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
    []
  );

  // ── Copy as plain text ──

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push(data.projectName);
    if (data.projectDescription) lines.push(data.projectDescription);
    lines.push('');

    if (data.context.length > 0) {
      for (const kv of data.context) {
        lines.push(`${kv.label}: ${kv.value}`);
      }
      lines.push('');
    }

    for (const section of data.sections) {
      lines.push(section.header.toUpperCase() + ':');
      if (section.body) lines.push(section.body);
      if (section.items) section.items.forEach(i => lines.push(`- ${i}`));
      if (section.keyValues) section.keyValues.forEach(kv => lines.push(`${kv.label}: ${kv.value}`));
      if (section.checklist) section.checklist.forEach(c => lines.push(`${c.checked ? '[x]' : '[ ]'} ${c.label}`));
      lines.push('');
    }

    if (data.sctPrimary) {
      lines.push(data.sctPrimary.groupLabel.toUpperCase() + ':');
      for (const b of data.sctPrimary.blocks) {
        lines.push(`${b.label}: ${b.content}`);
      }
      lines.push('');
    }
    if (data.sctSecondary) {
      lines.push(data.sctSecondary.groupLabel.toUpperCase() + ':');
      for (const b of data.sctSecondary.blocks) {
        lines.push(`${b.label}: ${b.content}`);
      }
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

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── PDF export ──

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

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="glass-panel mt-6 animate-fadeUp overflow-hidden">
      <div
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(to right, #E03413, #B45F34, transparent)' }}
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 mb-6 pb-4 border-b border-white/[0.06]">
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

        {/* Context grid */}
        {data.context.length > 0 && (
          <div className="opacity-0 animate-fadeUp mb-6">
            <h3 className="label-upper text-white/60 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-fmc-copper" />
              Context
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.context.map((kv, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-fmc-firestarter/80 block mb-1">{kv.label}</span>
                  <span className="text-sm font-medium text-fmc-offwhite">{kv.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content sections */}
        {data.sections.map((section, si) => (
          <div
            key={`s-${si}`}
            className="opacity-0 animate-fadeUp mt-5 first:mt-0"
            style={{ animationDelay: `${si * 60}ms` }}
          >
            <div className="border-t border-white/[0.06] pt-4 first:border-t-0 first:pt-0">
              <h3 className="label-upper text-white/60 mb-3 flex items-center gap-2">
                <span className="w-[2px] h-3 bg-fmc-firestarter rounded-full" />
                {section.header}
              </h3>

              {section.body && (
                <p className="text-sm text-white/80 leading-relaxed">{section.body}</p>
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
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-0.5">{kv.label}</span>
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

        {/* SCT groups */}
        {data.sctPrimary && sctMode !== 'none' && (
          <div className="opacity-0 animate-fadeUp mt-6" style={{ animationDelay: `${data.sections.length * 60}ms` }}>
            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fmc-copper" />
                {data.sctPrimary.groupLabel}
              </h3>
              <div className="border-l-2 border-fmc-copper pl-4 space-y-3">
                {data.sctPrimary.blocks.map((block, bi) => (
                  <div key={bi} className="bg-white/[0.03] rounded-xl p-4">
                    <span className="label-upper text-white/50 block mb-2">{block.label}</span>
                    <p className="text-sm text-white/80 leading-relaxed">{block.content}</p>
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
                    <p className="text-sm text-white/80 leading-relaxed">{block.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Strategic note */}
        {data.strategicNote && (
          <div className="opacity-0 animate-fadeUp mt-6">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(73,121,123,0.06)',
                borderLeft: '3px solid rgba(73,121,123,0.3)',
              }}
            >
              <h3 className="label-upper text-fmc-teal mb-2">Strategic Note</h3>
              <p className="text-sm text-white/80 leading-relaxed">{data.strategicNote}</p>
            </div>
          </div>
        )}

        {/* Gaps */}
        {data.gaps.length > 0 && (
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
        )}

        {data.gaps.length === 0 && (
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

        {/* Next steps grouped by owner */}
        {data.nextSteps.length > 0 && (() => {
          const groups = new Map<string, typeof data.nextSteps>();
          for (const step of data.nextSteps) {
            const owner = step.owner || 'General';
            if (!groups.has(owner)) groups.set(owner, []);
            groups.get(owner)!.push(step);
          }
          const orderedKeys = Array.from(groups.keys()).filter(k => k !== 'General');
          if (groups.has('General')) orderedKeys.push('General');

          return (
            <div className="opacity-0 animate-fadeUp mt-6">
              <div className="border-t border-white/[0.06] pt-5">
                <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
                  <span className="w-[2px] h-3 bg-fmc-firestarter rounded-full" />
                  Next Steps
                </h3>
                <div className="space-y-5">
                  {orderedKeys.map((owner, gi) => (
                    <div key={gi}>
                      <span className="label-upper text-fmc-firestarter block mb-2">{owner}</span>
                      <div className="border-l-2 border-fmc-copper pl-4 space-y-1.5">
                        {groups.get(owner)!.map((step, ai) => (
                          <div key={ai} className="flex items-baseline gap-2 text-sm text-white/70 leading-relaxed">
                            <span className="text-fmc-firestarter/40 flex-shrink-0">{'\u2192'}</span>
                            <span>{step.action}</span>
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
          );
        })()}

        {/* Timestamp footer */}
        <div className="mt-8 pt-4 border-t border-white/[0.06] text-xs text-white/30">
          Generated {timestamp}
        </div>
      </div>
    </div>
  );
}
