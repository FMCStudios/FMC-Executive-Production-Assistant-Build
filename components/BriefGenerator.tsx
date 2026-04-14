'use client';

import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import type { BriefType } from '@/lib/briefs';
import BriefOutput from './BriefOutput';
import Toast from './ui/Toast';

export default function BriefGenerator({ briefType }: { briefType: BriefType }) {
  const { brandId, activeBrand } = useBrand();
  const [input, setInput] = useState('');
  const [brief, setBrief] = useState<string | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setBrief(null);
    setGaps([]);

    try {
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          briefType: briefType.id,
          rawInput: input,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate brief');

      const data = await res.json();
      setBrief(data.brief);
      setGaps(data.gaps || []);
    } catch {
      setError('Failed to generate brief. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={`glass-panel p-6 ${loading ? 'animate-pulse' : ''}`}>
        <textarea
          className="glass-input w-full min-h-[200px] p-4 text-sm resize-y"
          placeholder={briefType.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <div className="mt-4 flex justify-end">
          <button
            className="btn-firestarter px-6 py-3 text-sm flex items-center gap-2"
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Brief'
            )}
          </button>
        </div>
      </div>

      {brief && (
        <BriefOutput
          brief={brief}
          gaps={gaps}
          brandName={activeBrand.name}
          brandTagline={activeBrand.tagline}
          accentColor={activeBrand.accentColor}
          briefTypeName={briefType.name}
        />
      )}
      {error && <Toast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
