'use client';

import Header from '@/components/Header';
import LifecycleView from '@/components/LifecycleView';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-fmc-offwhite mb-3">
              Executive Production Assistant
            </h1>
            <p className="text-sm text-white/50">
              Lifecycle pipeline — from first call to final archive.
            </p>
          </div>

          <LifecycleView />
        </div>
      </main>
    </div>
  );
}
