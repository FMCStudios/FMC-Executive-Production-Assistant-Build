'use client';

import { useState, createElement } from 'react';

export default function BriefOutput({
  brief,
  gaps,
  brandName,
  brandTagline,
  accentColor,
  briefTypeName,
}: {
  brief: string;
  gaps: string[];
  brandName: string;
  brandTagline: string;
  accentColor: string;
  briefTypeName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { BriefPDF } = await import('./BriefPDF');
      const doc = createElement(BriefPDF, {
        brief,
        brandName,
        brandTagline,
        accentColor,
        briefTypeName,
      });
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
      // silent fail — copy is still available
    } finally {
      setGeneratingPDF(false);
    }
  };

  const sections = brief.split(/\n(?=[A-Z][A-Z\s&\/()]+:)/g);

  return (
    <div className="glass-panel p-6 mt-6 animate-fadeUp">
      {/* Action bar */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
        <button
          onClick={handleCopy}
          className="btn-ghost px-4 py-2 text-xs flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {copied ? 'Copied' : 'Copy Brief'}
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          className="btn-ghost px-4 py-2 text-xs flex items-center gap-2"
        >
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

      {/* Brief content */}
      <div className="space-y-5">
        {sections.map((section, i) => {
          const headerMatch = section.match(/^([A-Z][A-Z\s&\/()]+):([\s\S]*)/);
          if (headerMatch) {
            const header = headerMatch[1].trim();
            const content = headerMatch[2].trim();
            const isGaps = /^GAPS/.test(header);

            return (
              <div key={i}>
                <h3
                  className="label-upper mb-2"
                  style={{ color: isGaps ? 'var(--fmc-firestarter)' : 'rgba(255,255,255,0.5)' }}
                >
                  {header}
                </h3>
                <div
                  className="text-sm text-fmc-offwhite whitespace-pre-wrap leading-relaxed"
                  style={isGaps ? { borderLeft: '2px solid var(--fmc-firestarter)', paddingLeft: '12px' } : undefined}
                >
                  {content}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="text-sm text-fmc-offwhite whitespace-pre-wrap leading-relaxed">
              {section}
            </div>
          );
        })}
      </div>

      {gaps.length > 0 && !brief.toUpperCase().includes('GAPS:') && (
        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <h3 className="label-upper mb-2" style={{ color: 'var(--fmc-firestarter)' }}>
            GAPS IDENTIFIED
          </h3>
          <ul className="space-y-1" style={{ borderLeft: '2px solid var(--fmc-firestarter)', paddingLeft: '12px' }}>
            {gaps.map((gap, i) => (
              <li key={i} className="text-sm text-fmc-offwhite">{gap}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
