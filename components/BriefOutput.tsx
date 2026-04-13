'use client';

import { useState } from 'react';

export default function BriefOutput({
  brief,
  gaps,
}: {
  brief: string;
  gaps: string[];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = brief.split(/\n(?=[A-Z][A-Z\s&\/()]+:)/g);

  return (
    <div className="glass-panel p-6 mt-6 relative animate-fadeUp">
      <button
        onClick={handleCopy}
        className="btn-ghost absolute top-4 right-4 px-3 py-1.5 text-xs"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>

      <div className="space-y-5 pr-20">
        {sections.map((section, i) => {
          const headerMatch = section.match(/^([A-Z][A-Z\s&\/()]+):([\s\S]*)/);
          if (headerMatch) {
            const header = headerMatch[1].trim();
            const content = headerMatch[2].trim();
            const isGaps = header === 'GAPS';

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
