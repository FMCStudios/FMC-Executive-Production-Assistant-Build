'use client';

import Link from 'next/link';
import OperatorSelector from './OperatorSelector';

export default function Header({ briefTypeName }: { briefTypeName?: string }) {
  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-bold tracking-[0.15em] text-fmc-offwhite"
            style={{ transition: 'opacity 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            EPA
          </Link>
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(224,52,19,0.25)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#E03413' }}
            />
            <span className="text-white/70">FMC Studios</span>
          </div>
        </div>

        {briefTypeName && (
          <span className="label-upper text-white/40">{briefTypeName}</span>
        )}

        <OperatorSelector />
      </div>
    </header>
  );
}
