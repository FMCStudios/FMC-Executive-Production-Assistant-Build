'use client';

import Header from '@/components/Header';
import LifecycleView from '@/components/LifecycleView';
import ActiveBriefs from '@/components/ActiveBriefs';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-fmc-offwhite mb-3">
              Executive Production Assistant
              <span
                className="block h-[2px] w-16 mx-auto mt-3 rounded-full"
                style={{ background: 'linear-gradient(to right, transparent, #E03413, transparent)' }}
              />
            </h1>
            <p className="text-sm text-white/50">
              Lifecycle pipeline — from first call to final archive.
            </p>
          </div>

          <section>
            <h2 className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter/70 mb-4">Tools</h2>
            <LifecycleView />
          </section>

          <ActiveBriefs />
        </div>
      </main>
    </div>
  );
}
