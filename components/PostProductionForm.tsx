'use client';

import { useState, useEffect } from 'react';
import VoiceMic from './VoiceMic';

type ModuleKey = 'technical' | 'assets' | 'paperEdit' | 'creativeDirection' | 'deliverables' | 'timeline';

type Module = {
  key: ModuleKey;
  label: string;
  placeholder: string;
};

const MODULES: Module[] = [
  {
    key: 'technical',
    label: 'Technical',
    placeholder: 'Cameras + count, codec, colour space, frame rates, resolution, proxies, audio tracks, timecode, known issues...',
  },
  {
    key: 'assets',
    label: 'Assets',
    placeholder: 'Footage location, folder structure, selects, music, VO, SFX, graphics, logos, client assets...',
  },
  {
    key: 'paperEdit',
    label: 'Paper Edit',
    placeholder: 'Story arc, scene breakdown, must-include moments, things to avoid, pacing, target duration...',
  },
  {
    key: 'creativeDirection',
    label: 'Creative Direction',
    placeholder: 'Tone words, visual treatment, colour grade, graphics style, music direction, sound design...',
  },
  {
    key: 'deliverables',
    label: 'Deliverables',
    placeholder: 'Formats + specs per platform, resolution, codec, versioning, subtitles, thumbnails...',
  },
  {
    key: 'timeline',
    label: 'Timeline',
    placeholder: 'Rough cut due, revision rounds, who reviews, final delivery date, interim milestones...',
  },
];

const ALL_KEYS: ModuleKey[] = MODULES.map((m) => m.key);

function concatenate(active: Set<ModuleKey>, values: Record<ModuleKey, string>): string {
  const lines: string[] = [];
  for (const mod of MODULES) {
    if (active.has(mod.key) && values[mod.key].trim()) {
      lines.push(`## ${mod.label}`);
      lines.push(values[mod.key].trim());
      lines.push('');
    }
  }
  return lines.join('\n');
}

export default function PostProductionForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const [active, setActive] = useState<Set<ModuleKey>>(new Set(ALL_KEYS));
  const [values, setValues] = useState<Record<ModuleKey, string>>({
    technical: '',
    assets: '',
    paperEdit: '',
    creativeDirection: '',
    deliverables: '',
    timeline: '',
  });

  useEffect(() => {
    onInputChange(concatenate(active, values));
  }, [active, values, onInputChange]);

  const toggle = (key: ModuleKey) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setValue = (key: ModuleKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-5">
      {/* Chip row */}
      <div className="flex flex-wrap gap-2">
        {MODULES.map((mod) => {
          const isActive = active.has(mod.key);
          return (
            <button
              key={mod.key}
              type="button"
              onClick={() => toggle(mod.key)}
              disabled={disabled}
              className="rounded-full px-3 py-1.5 text-xs font-medium active:scale-[0.97]"
              style={{
                background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                boxShadow: isActive ? '0 0 12px rgba(224,52,19,0.12)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {mod.label}
            </button>
          );
        })}
      </div>

      {/* Module textareas */}
      {MODULES.map((mod) => {
        const isActive = active.has(mod.key);
        return (
          <div
            key={mod.key}
            style={{
              maxHeight: isActive ? '300px' : '0px',
              opacity: isActive ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              marginTop: isActive ? undefined : 0,
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">
                  {mod.label}
                </label>
                <VoiceMic onTranscript={(t) => setValue(mod.key, values[mod.key] ? values[mod.key] + ' ' + t : t)} disabled={disabled} />
              </div>
              <textarea
                className="glass-input w-full px-3 py-2.5 text-sm resize-y min-h-[80px]"
                placeholder={mod.placeholder}
                value={values[mod.key]}
                onChange={(e) => setValue(mod.key, e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
