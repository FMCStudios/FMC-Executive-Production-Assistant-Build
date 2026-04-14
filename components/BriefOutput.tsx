'use client';

import { useState, createElement, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────

type Props = {
  brief: string;
  gaps: string[];
  brandName: string;
  brandTagline: string;
  accentColor: string;
  briefTypeName: string;
  briefTypeId: string;
};

type ParsedSection = {
  header: string;
  content: string;
};

type SCTMode = 'client-narrative' | 'brand-sct' | 'dual' | 'none';

type RenderBlock =
  | { kind: 'section'; section: ParsedSection; index: number }
  | { kind: 'sct-group'; label: string; sections: ParsedSection[]; index: number }
  | { kind: 'gaps'; section: ParsedSection; index: number }
  | { kind: 'nextsteps'; section: ParsedSection; index: number };

// ── SCT logic ─────────────────────────────────────────────────

function getSCTMode(briefTypeId: string): SCTMode {
  switch (briefTypeId) {
    case 'lead-intake':
    case 'discovery':
      return 'client-narrative';
    case 'production':
    case 'post-production':
      return 'brand-sct';
    case 'wrap-retention':
      return 'dual';
    case 'archive':
    default:
      return 'none';
  }
}

const CLIENT_NARRATIVE_HEADERS = ['SITUATION', 'CHALLENGE', 'TRANSFORMATION'];
const BRAND_SCT_HEADERS = ['STRATEGY', 'CREATIVE', 'TACTIC'];
const ALL_SCT_HEADERS = [...CLIENT_NARRATIVE_HEADERS, ...BRAND_SCT_HEADERS];

function isSCTHeader(h: string) {
  const clean = h.replace(/\s*\(SCT\)\s*/i, '').trim();
  return ALL_SCT_HEADERS.includes(clean);
}

function isDeliveryReflection(h: string) {
  return /DELIVERY REFLECTION/i.test(h);
}

function isRebookingFraming(h: string) {
  return /REBOOKING FRAMING/i.test(h);
}

function isGaps(h: string) {
  return /^GAPS/.test(h);
}

function isNextSteps(h: string) {
  return /NEXT STEPS|RECOMMENDED NEXT/.test(h);
}

// ── Parsing helpers ────────────────────────────────────────────

function parseSections(brief: string): ParsedSection[] {
  const parts = brief.split(/\n(?=[A-Z][A-Z\s&\/()]+:)/g);
  return parts
    .map((part) => {
      const m = part.match(/^([A-Z][A-Z\s&\/()]+):([\s\S]*)/);
      return m ? { header: m[1].trim(), content: m[2].trim() } : null;
    })
    .filter((s): s is ParsedSection => s !== null && s.content.length > 0);
}

function buildRenderPlan(sections: ParsedSection[], sctMode: SCTMode): RenderBlock[] {
  const plan: RenderBlock[] = [];
  let idx = 0;

  if (sctMode === 'none') {
    for (const s of sections) {
      if (isSCTHeader(s.header)) continue;
      if (isGaps(s.header)) {
        plan.push({ kind: 'gaps', section: s, index: idx++ });
      } else if (isNextSteps(s.header)) {
        plan.push({ kind: 'nextsteps', section: s, index: idx++ });
      } else {
        plan.push({ kind: 'section', section: s, index: idx++ });
      }
    }
    return plan;
  }

  if (sctMode === 'dual') {
    // For wrap & retention: collect brand SCT and client narrative separately
    const brandBuf: ParsedSection[] = [];
    const clientBuf: ParsedSection[] = [];
    const others: ParsedSection[] = [];
    let inDelivery = false;
    let inRebooking = false;

    for (const s of sections) {
      const clean = s.header.replace(/\s*\(SCT\)\s*/i, '').trim();

      if (isDeliveryReflection(s.header)) {
        inDelivery = true;
        inRebooking = false;
        continue;
      }
      if (isRebookingFraming(s.header)) {
        inRebooking = true;
        inDelivery = false;
        continue;
      }

      if (BRAND_SCT_HEADERS.includes(clean)) {
        brandBuf.push(s);
        continue;
      }
      if (CLIENT_NARRATIVE_HEADERS.includes(clean)) {
        clientBuf.push(s);
        continue;
      }

      inDelivery = false;
      inRebooking = false;

      if (isGaps(s.header)) {
        others.push(s);
      } else if (isNextSteps(s.header)) {
        others.push(s);
      } else {
        others.push(s);
      }
    }

    // Render non-SCT sections first (PROJECT, CLIENT FEEDBACK, etc)
    const regularSections = others.filter(s => !isGaps(s.header) && !isNextSteps(s.header));
    const gapsSections = others.filter(s => isGaps(s.header));
    const nextStepsSections = others.filter(s => isNextSteps(s.header));

    for (const s of regularSections) {
      plan.push({ kind: 'section', section: s, index: idx++ });
    }

    // Brand SCT group
    if (brandBuf.length > 0) {
      plan.push({ kind: 'sct-group', label: 'DELIVERY REFLECTION', sections: brandBuf, index: idx++ });
    }

    // Client narrative group
    if (clientBuf.length > 0) {
      plan.push({ kind: 'sct-group', label: 'REBOOKING FRAMING', sections: clientBuf, index: idx++ });
    }

    // Gaps and next steps at end
    for (const s of gapsSections) {
      plan.push({ kind: 'gaps', section: s, index: idx++ });
    }
    for (const s of nextStepsSections) {
      plan.push({ kind: 'nextsteps', section: s, index: idx++ });
    }

    return plan;
  }

  // Single SCT mode (client-narrative or brand-sct)
  const sctBuf: ParsedSection[] = [];
  const nonSCTBefore: ParsedSection[] = [];
  const nonSCTAfter: ParsedSection[] = [];
  let foundSCT = false;

  for (const s of sections) {
    const clean = s.header.replace(/\s*\(SCT\)\s*/i, '').trim();
    if (ALL_SCT_HEADERS.includes(clean)) {
      sctBuf.push(s);
      foundSCT = true;
    } else if (!foundSCT) {
      nonSCTBefore.push(s);
    } else {
      nonSCTAfter.push(s);
    }
  }

  // Sections before SCT
  for (const s of nonSCTBefore) {
    if (isGaps(s.header)) {
      plan.push({ kind: 'gaps', section: s, index: idx++ });
    } else if (isNextSteps(s.header)) {
      plan.push({ kind: 'nextsteps', section: s, index: idx++ });
    } else {
      plan.push({ kind: 'section', section: s, index: idx++ });
    }
  }

  // SCT group
  if (sctBuf.length > 0) {
    const label = sctMode === 'client-narrative' ? 'CLIENT NARRATIVE' : 'EXECUTION FRAMEWORK';
    plan.push({ kind: 'sct-group', label, sections: sctBuf, index: idx++ });
  }

  // Sections after SCT
  for (const s of nonSCTAfter) {
    if (isGaps(s.header)) {
      plan.push({ kind: 'gaps', section: s, index: idx++ });
    } else if (isNextSteps(s.header)) {
      plan.push({ kind: 'nextsteps', section: s, index: idx++ });
    } else {
      plan.push({ kind: 'section', section: s, index: idx++ });
    }
  }

  return plan;
}

// ── Copy formatting ────────────────────────────────────────────

function formatPlainText(brief: string): string {
  return brief.replace(/\n{3,}/g, '\n\n').trim();
}

function formatMarkdown(brief: string): string {
  const sections = parseSections(brief);
  return sections
    .map((s) => {
      const lines = s.content.split('\n').map((l) => {
        const kv = l.trim().match(/^([A-Z][A-Za-z\s\/&']+?):\s+(.+)$/);
        return kv && kv[1].length < 35 ? `**${kv[1]}:** ${kv[2]}` : l;
      });
      return `## ${s.header}\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

// ── Content renderers ──────────────────────────────────────────

function renderContentLines(content: string) {
  const lines = content.split('\n');
  const out: JSX.Element[] = [];
  let listBuf: string[] = [];
  let numBuf: { num: string; text: string }[] = [];
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length === 0) return;
    const text = paraBuf.join(' ').trim();
    if (text) {
      if (/^".*"$/.test(text)) {
        out.push(
          <div key={out.length} className="pl-3 my-2 border-l-2 border-fmc-copper italic text-sm text-white/70 leading-relaxed">
            {text.slice(1, -1)}
          </div>
        );
      } else {
        out.push(<p key={out.length} className="text-sm text-white/80 leading-relaxed">{text}</p>);
      }
    }
    paraBuf = [];
  };

  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <ul key={out.length} className="space-y-1.5 my-1">
        {listBuf.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
            <span className="text-fmc-copper mt-0.5 flex-shrink-0">&middot;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  const flushNum = () => {
    if (numBuf.length === 0) return;
    out.push(
      <ol key={out.length} className="space-y-3 my-1">
        {numBuf.map((item, i) => renderNextStepItem(item, i))}
      </ol>
    );
    numBuf = [];
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) { flushPara(); flushList(); flushNum(); continue; }

    // List item
    if (/^[-\u2022\u25A1\u2713\u2717\u25AA]\s/.test(t)) {
      flushPara(); flushNum();
      listBuf.push(t.replace(/^[-\u2022\u25A1\u2713\u2717\u25AA]\s*/, ''));
      continue;
    }

    // Numbered item
    const nm = t.match(/^(\d+)[.)]\s+(.+)$/);
    if (nm) { flushPara(); flushList(); numBuf.push({ num: nm[1], text: nm[2] }); continue; }

    // Key-value
    const kv = t.match(/^([A-Z][A-Za-z\s\/&'\u2014]+?):\s+(.+)$/);
    if (kv && kv[1].length < 35) {
      flushPara(); flushList(); flushNum();
      out.push(
        <div key={out.length} className="flex items-baseline gap-2 py-0.5">
          <span className="text-xs text-white/50 flex-shrink-0">{kv[1]}:</span>
          <span className="text-sm font-medium text-fmc-offwhite">{kv[2]}</span>
        </div>
      );
      continue;
    }

    flushList(); flushNum();
    paraBuf.push(t);
  }

  flushPara(); flushList(); flushNum();
  return out;
}

function renderNextStepItem(item: { num: string; text: string }, i: number) {
  const ownerMatch = item.text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+to\s+(.+)$/);
  const dateRe = /\b(within\s+\d+\s+(?:hours?|days?|weeks?)|(?:this|next)\s+(?:week|month)|by\s+(?:end\s+of\s+)?\w+(?:\s+\d+)?(?:,?\s+\d{4})?|Q[1-4]\s+\d{4})\b/i;

  const datePill = item.text.match(dateRe)?.[1] ?? null;

  return (
    <li key={i} className="flex items-start gap-3 text-sm">
      <span className="text-xs font-semibold text-white/30 mt-0.5 w-5 flex-shrink-0 text-right">
        {item.num}.
      </span>
      <span className="text-white/70 leading-relaxed">
        {ownerMatch ? (
          <>
            <span className="font-medium text-fmc-offwhite">{ownerMatch[1]}</span>
            <span className="text-white/50"> to </span>
            {ownerMatch[2]}
          </>
        ) : (
          item.text
        )}
        {datePill && (
          <span className="inline-flex ml-2 bg-white/[0.06] rounded-full px-2 py-0.5 text-xs text-fmc-teal align-middle">
            {datePill}
          </span>
        )}
      </span>
    </li>
  );
}

function renderGapItems(content: string) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];
  let currentItem = '';

  for (const line of lines) {
    if (/^[-\u2022\u25A1\u2717\u26A0]\s/.test(line)) {
      if (currentItem) items.push(currentItem);
      currentItem = line.replace(/^[-\u2022\u25A1\u2717\u26A0]\s*/, '');
    } else if (currentItem) {
      currentItem += ' ' + line;
    } else {
      items.push(line);
    }
  }
  if (currentItem) items.push(currentItem);

  return items;
}

// ── SCT Card Component ────────────────────────────────────────

function SCTGroup({ label, sections }: { label: string; sections: ParsedSection[] }) {
  return (
    <div>
      <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-fmc-copper" />
        {label}
      </h3>
      <div className="border-l-2 border-fmc-copper pl-4 space-y-3">
        {sections.map((s, si) => {
          const cleanLabel = s.header.replace(/\s*\(SCT\)\s*/i, '');
          return (
            <div key={si} className="bg-white/[0.03] rounded-xl p-4">
              <span className="label-upper text-white/50 block mb-2">{cleanLabel}</span>
              <div className="text-sm text-white/80 leading-relaxed">
                {renderContentLines(s.content)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function BriefOutput({
  brief,
  gaps,
  brandName,
  brandTagline,
  accentColor,
  briefTypeName,
  briefTypeId,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const sctMode = getSCTMode(briefTypeId);

  const renderPlan = useMemo(() => {
    const sections = parseSections(brief);
    return buildRenderPlan(sections, sctMode);
  }, [brief, sctMode]);

  const hasGapsSection = renderPlan.some((b) => b.kind === 'gaps');
  const timestamp = useMemo(
    () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
    []
  );

  // ── Handlers ──

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatPlainText(brief));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(formatMarkdown(brief));
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { BriefPDF } = await import('./BriefPDF');
      const doc = createElement(BriefPDF, { brief, brandName, brandTagline, accentColor, briefTypeName });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug = `${brandName.replace(/\s+/g, '-')}_${briefTypeName.replace(/\s+/g, '-')}`;
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `${slug}_${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail — copy still works
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ── Render ──

  return (
    <div className="glass-panel mt-6 animate-fadeUp overflow-hidden">
      {/* Top gradient accent */}
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
          <button onClick={handleCopyMarkdown} className="btn-ghost px-3 py-1.5 text-[11px] flex items-center gap-1.5 text-white/50">
            <span>MD</span>
            {copiedMd ? 'Copied' : 'Markdown'}
          </button>
          <button onClick={handleDownloadPDF} disabled={generatingPDF} className="btn-ghost px-4 py-2 text-xs flex items-center gap-2">
            {generatingPDF ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Building PDF...
              </>
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

        {/* Brief sections */}
        <div>
          {renderPlan.map((block) => {
            const delay = `${block.index * 60}ms`;

            if (block.kind === 'sct-group') {
              return (
                <div
                  key={`sct-${block.index}`}
                  className="opacity-0 animate-fadeUp mt-6 first:mt-0"
                  style={{ animationDelay: delay }}
                >
                  <div className="border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0">
                    <SCTGroup label={block.label} sections={block.sections} />
                  </div>
                </div>
              );
            }

            if (block.kind === 'gaps') {
              const gapItems = renderGapItems(block.section.content);
              return (
                <div
                  key={`gaps-${block.index}`}
                  className="opacity-0 animate-fadeUp mt-6"
                  style={{ animationDelay: delay }}
                >
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(224,52,19,0.06)',
                      borderLeft: '3px solid rgba(224,52,19,0.4)',
                    }}
                  >
                    <h3 className="label-upper text-fmc-firestarter mb-3">GAPS IDENTIFIED</h3>
                    {gapItems.length > 0 ? (
                      <ul className="space-y-2">
                        {gapItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-fmc-offwhite leading-relaxed">
                            <span className="text-fmc-firestarter flex-shrink-0 mt-px">{'\u26A0'}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-fmc-teal flex items-center gap-2">
                        <span>{'\u2713'}</span> No gaps identified
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            if (block.kind === 'nextsteps') {
              return (
                <div
                  key={`ns-${block.index}`}
                  className="opacity-0 animate-fadeUp mt-6"
                  style={{ animationDelay: delay }}
                >
                  <div className="border-t border-white/[0.06] pt-5">
                    <h3 className="label-upper text-white/60 mb-4 flex items-center gap-2">
                      <span className="w-[2px] h-3 bg-fmc-firestarter rounded-full" />
                      {block.section.header}
                    </h3>
                    <div>{renderContentLines(block.section.content)}</div>
                  </div>
                </div>
              );
            }

            // Regular section
            return (
              <div
                key={`s-${block.index}`}
                className="opacity-0 animate-fadeUp mt-6 first:mt-0"
                style={{ animationDelay: delay }}
              >
                <div className="border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0">
                  <h3 className="label-upper text-white/60 mb-3 flex items-center gap-2">
                    <span className="w-[2px] h-3 bg-fmc-firestarter rounded-full" />
                    {block.section.header}
                  </h3>
                  <div>{renderContentLines(block.section.content)}</div>
                </div>
              </div>
            );
          })}

          {/* No-gaps positive signal when gaps section is absent */}
          {!hasGapsSection && gaps.length === 0 && (
            <div className="opacity-0 animate-fadeUp mt-6" style={{ animationDelay: `${renderPlan.length * 60}ms` }}>
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

          {/* Fallback: standalone gaps from API when no GAPS section exists */}
          {!hasGapsSection && gaps.length > 0 && (
            <div className="opacity-0 animate-fadeUp mt-6" style={{ animationDelay: `${renderPlan.length * 60}ms` }}>
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(224,52,19,0.06)',
                  borderLeft: '3px solid rgba(224,52,19,0.4)',
                }}
              >
                <h3 className="label-upper text-fmc-firestarter mb-3">GAPS IDENTIFIED</h3>
                <ul className="space-y-2">
                  {gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fmc-offwhite leading-relaxed">
                      <span className="text-fmc-firestarter flex-shrink-0 mt-px">{'\u26A0'}</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp footer */}
        <div className="mt-8 pt-4 border-t border-white/[0.06] text-xs text-white/30">
          Generated {timestamp}
        </div>
      </div>
    </div>
  );
}
