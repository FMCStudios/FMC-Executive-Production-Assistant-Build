'use client';

import { useState, useEffect, useCallback } from 'react';
import VoiceMic from './VoiceMic';
import type { CrewMember } from '@/lib/crew';
import type { GearItem } from '@/lib/gear';

type ModuleKey = 'callSheet' | 'gearList' | 'crewSheet' | 'creativeRef' | 'paperEdit' | 'strategyEcho';

type Module = {
  key: ModuleKey;
  label: string;
  placeholder: string;
};

const MODULES: Module[] = [
  {
    key: 'callSheet',
    label: 'Call Sheet',
    placeholder: 'Date, call time, location + address, on-site contact, schedule, weather backup...',
  },
  {
    key: 'gearList',
    label: 'Gear List',
    placeholder: 'Camera bodies + lenses, audio, lighting, grip, media, power...',
  },
  {
    key: 'crewSheet',
    label: 'Crew Sheet',
    placeholder: 'Name, role, rate, call time, contact, dietary needs...',
  },
  {
    key: 'creativeRef',
    label: 'Creative Ref',
    placeholder: 'Moodboard links, tone words, shot list, reference clips, brand guidelines...',
  },
  {
    key: 'paperEdit',
    label: 'Paper Edit',
    placeholder: 'Narrative structure, key questions, target soundbites, B-roll mapping, duration...',
  },
  {
    key: 'strategyEcho',
    label: 'Strategy Echo',
    placeholder: 'Why are we making this, audience, platform, CTA, success metric...',
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

export default function ProductionForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const [active, setActive] = useState<Set<ModuleKey>>(new Set(ALL_KEYS));
  const [values, setValues] = useState<Record<ModuleKey, string>>({
    callSheet: '',
    gearList: '',
    crewSheet: '',
    creativeRef: '',
    paperEdit: '',
    strategyEcho: '',
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

  // Crew + gear roster pull
  const [crewRoster, setCrewRoster] = useState<CrewMember[]>([]);
  const [gearLibrary, setGearLibrary] = useState<GearItem[]>([]);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewOpen, setCrewOpen] = useState(false);
  const [crewSelected, setCrewSelected] = useState<Set<number>>(new Set());

  const fetchCrew = useCallback(async () => {
    if (crewRoster.length > 0) { setCrewOpen(true); return; }
    setCrewLoading(true);
    try {
      const [crewRes, gearRes] = await Promise.all([
        fetch('/api/crew').then(r => r.json()),
        fetch('/api/gear').then(r => r.json()),
      ]);
      if (crewRes.crew) setCrewRoster(crewRes.crew);
      if (gearRes.gear) setGearLibrary(gearRes.gear);
      setCrewOpen(true);
    } catch { /* silent */ }
    setCrewLoading(false);
  }, [crewRoster.length]);

  const applyCrewSelection = () => {
    const selected = Array.from(crewSelected).map((i) => crewRoster[i]).filter(Boolean);

    // Build crew sheet lines
    const crewLines = selected.map((m) => {
      const parts = [`${m.name} — ${m.role}`];
      if (m.dayRate) parts.push(`$${m.dayRate}/day`);
      if (m.phone) parts.push(m.phone);
      return parts.join(', ');
    }).join('\n');
    setValue('crewSheet', values.crewSheet ? values.crewSheet + '\n' + crewLines : crewLines);

    // Build gear list lines from selected crew members' personal gear
    const selectedNames = new Set(selected.map(m => m.name.toLowerCase()));
    const memberGear = gearLibrary.filter(g => selectedNames.has(g.owner.toLowerCase()));
    if (memberGear.length > 0) {
      const gearLines = memberGear.map((g) => {
        const parts = [g.itemName];
        if (g.category) parts[0] = `[${g.category}] ${g.itemName}`;
        if (g.rentalRate) parts.push(`$${g.rentalRate}/day`);
        parts.push(`(${g.owner})`);
        return parts.join(' — ');
      }).join('\n');
      setValue('gearList', values.gearList ? values.gearList + '\n' + gearLines : gearLines);
    }

    setCrewOpen(false);
    setCrewSelected(new Set());
  };

  // Build gear count per crew member for display
  const gearCountByOwner = new Map<string, number>();
  for (const g of gearLibrary) {
    const key = g.owner.toLowerCase();
    gearCountByOwner.set(key, (gearCountByOwner.get(key) || 0) + 1);
  }

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
              maxHeight: isActive ? (mod.key === 'crewSheet' && crewOpen ? '600px' : '300px') : '0px',
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
                <div className="flex items-center gap-2">
                  {mod.key === 'crewSheet' && (
                    <button
                      type="button"
                      onClick={fetchCrew}
                      disabled={disabled || crewLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium active:scale-[0.97]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      {crewLoading ? 'Loading...' : 'Pull from roster'}
                    </button>
                  )}
                  <VoiceMic onTranscript={(t) => setValue(mod.key, values[mod.key] ? values[mod.key] + ' ' + t : t)} disabled={disabled} />
                </div>
              </div>
              <textarea
                className="glass-input w-full px-3 py-2.5 text-sm resize-y min-h-[80px]"
                placeholder={mod.placeholder}
                value={values[mod.key]}
                onChange={(e) => setValue(mod.key, e.target.value)}
                disabled={disabled}
              />
              {/* Crew roster picker */}
              {mod.key === 'crewSheet' && crewOpen && crewRoster.length > 0 && (
                <div
                  className="rounded-xl p-3 animate-fadeUp"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-3">
                    {crewRoster.map((m, i) => {
                      const selected = crewSelected.has(i);
                      const gearCount = gearCountByOwner.get(m.name.toLowerCase()) || 0;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCrewSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              return next;
                            });
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs active:scale-[0.97]"
                          style={{
                            background: selected ? 'rgba(224,52,19,0.08)' : 'transparent',
                            transition: 'background 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              background: selected ? 'rgba(224,52,19,0.2)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${selected ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                          >
                            {selected && (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#E03413" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="text-fmc-offwhite font-medium">{m.name}</span>
                          <span className="text-white/30">{m.role}</span>
                          {gearCount > 0 && (
                            <span className="text-fmc-teal/50 text-[10px]">{gearCount} gear</span>
                          )}
                          {m.dayRate && <span className="text-fmc-firestarter/50 ml-auto">${m.dayRate}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyCrewSelection}
                      disabled={crewSelected.size === 0}
                      className="btn-firestarter px-3 py-1.5 text-[10px]"
                    >
                      Add {crewSelected.size} to brief + gear
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCrewOpen(false); setCrewSelected(new Set()); }}
                      className="btn-ghost px-3 py-1.5 text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
