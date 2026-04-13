'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BriefGenerator from '@/components/BriefGenerator';
import { briefTypes } from '@/lib/briefs';

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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{briefType.emoji}</span>
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
