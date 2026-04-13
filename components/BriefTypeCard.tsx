'use client';

import type { BriefType } from '@/lib/briefs';

export default function BriefTypeCard({
  brief,
  onClick,
}: {
  brief: BriefType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel hover-glow p-5 text-left cursor-pointer active:scale-[0.97]"
      style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <div className="text-2xl mb-3">{brief.emoji}</div>
      <h3 className="text-base font-semibold text-fmc-offwhite mb-1">
        {brief.name}
      </h3>
      <p className="text-xs text-white/50">{brief.description}</p>
    </button>
  );
}
