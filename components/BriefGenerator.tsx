'use client';

import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import type { BriefType } from '@/lib/briefs';
import BriefOutput from './BriefOutput';
import Toast from './ui/Toast';

type PipelineStatus = 'idle' | 'saving' | 'saved' | 'failed';

export default function BriefGenerator({ briefType }: { briefType: BriefType }) {
  const { brandId, activeBrand } = useBrand();
  const [input, setInput] = useState('');
  const [brief, setBrief] = useState<string | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');

  const saveToPipeline = async (briefText: string, briefGaps: string[]) => {
    setPipelineStatus('saving');
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          brandName: activeBrand.name,
          briefType: briefType.id,
          briefTypeName: briefType.name,
          rawInput: input,
          briefOutput: briefText,
          gaps: briefGaps,
        }),
      });
      if (!res.ok) throw new Error('Sheet write failed');
      setPipelineStatus('saved');
    } catch {
      setPipelineStatus('failed');
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setBrief(null);
    setGaps([]);
    setPipelineStatus('idle');

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

      // Fire background pipeline save
      saveToPipeline(data.brief, data.gaps || []);
    } catch {
      setError('Failed to generate brief. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPipeline = () => {
    if (brief) {
      saveToPipeline(brief, gaps);
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
        <>
          <BriefOutput
            brief={brief}
            gaps={gaps}
            brandId={brandId}
            brandName={activeBrand.name}
            brandTagline={activeBrand.tagline}
            accentColor={activeBrand.accentColor}
            briefTypeName={briefType.name}
            briefTypeId={briefType.id}
          />

          {/* Pipeline status indicator */}
          <div className="mt-3 flex items-center justify-end">
            {pipelineStatus === 'saving' && (
              <span className="text-xs text-white/40 flex items-center gap-1.5 animate-fadeUp">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving to Pipeline...
              </span>
            )}
            {pipelineStatus === 'saved' && (
              <span className="text-xs text-fmc-teal flex items-center gap-1.5 animate-fadeUp">
                <span>{'\u2713'}</span> Saved to Pipeline
              </span>
            )}
            {pipelineStatus === 'failed' && (
              <button
                onClick={handleRetryPipeline}
                className="text-xs text-white/40 flex items-center gap-1.5 animate-fadeUp hover:text-white/60"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Pipeline sync failed — retry
              </button>
            )}
          </div>
        </>
      )}
      {error && <Toast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
