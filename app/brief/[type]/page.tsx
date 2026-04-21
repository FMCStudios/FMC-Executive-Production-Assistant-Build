'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { briefTypes } from '@/lib/briefs';

const BriefGenerator = dynamic(() => import('@/components/BriefGenerator'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="glass-panel bg-white/[0.04] h-10 w-1/3 rounded-lg animate-pulse" />
      <div className="glass-panel bg-white/[0.04] h-48 w-full rounded-2xl animate-pulse" />
      <div className="glass-panel bg-white/[0.04] h-12 w-40 rounded-xl animate-pulse" />
    </div>
  ),
});

export default function BriefPage({ params }: { params: { type: string } }) {
  const router = useRouter();
  const briefType = briefTypes[params.type];

  if (!briefType) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-3xl mx-auto px-6 pt-28 pb-16 text-center">
          <h1 className="text-2xl font-bold text-fmc-offwhite mb-4">Brief type not found</h1>
          <button onClick={() => router.push('/')} className="btn-ghost px-5 py-2.5 text-sm">
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header briefTypeName={briefType.name} />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'rgba(224,52,19,0.15)',
                  color: '#E03413',
                  border: '1px solid rgba(224,52,19,0.3)',
                }}
              >
                {briefType.phase}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite">
                {briefType.name}
              </h1>
            </div>
            <p className="text-sm text-white/50">{briefType.description}</p>
          </div>

          <BriefGenerator briefType={briefType} />
        </div>
      </main>
    </div>
  );
}
