'use client';

import Link from 'next/link';
import Image from 'next/image';
import OperatorSelector from './OperatorSelector';

export default function Header({ briefTypeName }: { briefTypeName?: string }) {
  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <Image
            src="/logos/fmc-cube.png"
            alt="FMC"
            width={28}
            height={28}
            className="transition-all duration-200"
            style={{
              filter: 'drop-shadow(0 0 0px rgba(224,52,19,0))',
              transition: 'filter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 8px rgba(224,52,19,0.3))';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 0px rgba(224,52,19,0))';
            }}
          />
          <span className="text-xs tracking-[0.15em] uppercase text-white/40 font-medium">
            EPA
          </span>
        </Link>

        {briefTypeName && (
          <span className="label-upper text-white/40">{briefTypeName}</span>
        )}

        <OperatorSelector />
      </div>
    </header>
  );
}
