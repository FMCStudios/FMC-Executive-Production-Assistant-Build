'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BrandSelector from '@/components/BrandSelector';
import BriefTypeCard from '@/components/BriefTypeCard';
import { briefTypesList } from '@/lib/briefs';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-fmc-offwhite mb-3">
              Executive Production Assistant
            </h1>
            <p className="text-sm text-white/50">
              Standardized briefs for every stage of production.
            </p>
          </div>

          <div className="mb-16">
            <p className="label-upper text-white/40 mb-4 text-center">Select Brand</p>
            <BrandSelector />
          </div>

          <div>
            <p className="label-upper text-white/40 mb-4 text-center">Select Brief Type</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefTypesList.map((brief) => (
                <BriefTypeCard
                  key={brief.id}
                  brief={brief}
                  onClick={() => router.push(`/brief/${brief.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
