'use client';

import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';

export default function Header({ briefTypeName }: { briefTypeName?: string }) {
  const { activeBrand } = useBrand();

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.15em] text-fmc-offwhite"
          style={{ transition: 'opacity 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          EPA
        </Link>

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${activeBrand.accentColor}40`,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: activeBrand.accentColor }}
          />
          <span className="text-white/70">{activeBrand.name}</span>
        </div>

        {briefTypeName ? (
          <span className="label-upper text-white/40">{briefTypeName}</span>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </header>
  );
}
