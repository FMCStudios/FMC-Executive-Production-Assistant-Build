'use client';

import { useState, useEffect, useCallback } from 'react';
import VoiceMic from './VoiceMic';
import type { CrewMember } from '@/lib/crew';
import type { GearItem } from '@/lib/gear';

type ModuleKey = 'callSheet' | 'gearList' | 'crewSheet' | 'creativeRef' | 'paperEdit' | 'strategyEcho';

type Module = { key: ModuleKey; label: string; placeholder: string };

const MODULES: Module[] = [
  { key: 'callSheet', label: 'Call Sheet', placeholder: 'Date, call time, location + address, on-site contact, schedule, weather backup...' },
  { key: 'gearList', label: 'Gear List', placeholder: 'Camera bodies + lenses, audio, lighting, grip, media, power...' },
  { key: 'crewSheet', label: 'Crew Sheet', placeholder: 'Name, role, rate, call time, contact, dietary needs...' },
  { key: 'creativeRef', label: 'Creative Ref', placeholder: 'Moodboard links, tone words, shot list, reference clips, brand guidelines...' },
  { key: 'paperEdit', label: 'Paper Edit', placeholder: 'Narrative structure, key questions, target soundbites, B-roll mapping, duration...' },
  { key: 'strategyEcho', label: 'Strategy Echo', placeholder: 'Why are we making this, audience, platform, CTA, success metric...' },
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

type RateOption = { label: string; value: string };

function getCrewRates(m: CrewMember): RateOption[] {
  const rates: RateOption[] = [];
  if (m.shootingRate) rates.push({ label: `Shoot $${m.shootingRate}`, value: m.shootingRate });
  if (m.editingRate) rates.push({ label: `Edit $${m.editingRate}`, value: m.editingRate });
  if (m.producingRate) rates.push({ label: `Produce $${m.producingRate}`, value: m.producingRate });
  if (m.otherRate) rates.push({ label: `${m.otherRateLabel || 'Other'} $${m.otherRate}`, value: m.otherRate });
  return rates;
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
    callSheet: '', gearList: '', crewSheet: '', creativeRef: '', paperEdit: '', strategyEcho: '',
  });

  useEffect(() => { onInputChange(concatenate(active, values)); }, [active, values, onInputChange]);

  const toggle = (key: ModuleKey) => {
    setActive((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  };
  const setValue = (key: ModuleKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // ── Crew + gear roster pull ──
  const [crewRoster, setCrewRoster] = useState<CrewMember[]>([]);
  const [gearLibrary, setGearLibrary] = useState<GearItem[]>([]);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewOpen, setCrewOpen] = useState(false);
  const [crewSelected, setCrewSelected] = useState<Set<number>>(new Set());
  const [selectedRates, setSelectedRates] = useState<Map<number, string>>(new Map());
  // Gear add-on panel (shown after crew applied)
  const [gearPanelOpen, setGearPanelOpen] = useState(false);
  const [appliedCrewNames, setAppliedCrewNames] = useState<Set<string>>(new Set());
  const [extraGearSelected, setExtraGearSelected] = useState<Set<number>>(new Set());

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

  const setRate = (idx: number, rate: string) => {
    setSelectedRates((prev) => { const n = new Map(prev); n.set(idx, rate); return n; });
  };

  const applyCrewSelection = () => {
    const selected = Array.from(crewSelected).map((i) => crewRoster[i]).filter(Boolean);
    const names = new Set(selected.map(m => m.fullName.toLowerCase()));

    // Build crew sheet with selected rates
    const crewLines = selected.map((m, si) => {
      const idx = Array.from(crewSelected)[si];
      const rates = getCrewRates(m);
      const chosenRate = selectedRates.get(idx) || rates[0]?.value || '';
      const ratePart = chosenRate ? `, $${chosenRate}/day` : '';
      const parts = [`${m.displayName} (${m.fullName}) — ${m.primaryRole}${ratePart}`];
      if (m.phone) parts.push(m.phone);
      return parts.join(', ');
    }).join('\n');
    setValue('crewSheet', values.crewSheet ? values.crewSheet + '\n' + crewLines : crewLines);

    // Build crew kit gear (no rental — comes with them)
    const crewGear = gearLibrary.filter(g => names.has(g.owner.toLowerCase()));
    if (crewGear.length > 0) {
      const lines = ['--- Crew kit (included) ---'];
      for (const g of crewGear) {
        const label = g.brand ? `${g.brand} ${g.itemName}` : g.itemName;
        lines.push(`[${g.category || 'Gear'}] ${label} (${g.owner})`);
      }
      setValue('gearList', values.gearList ? values.gearList + '\n' + lines.join('\n') : lines.join('\n'));
    }

    setAppliedCrewNames(names);
    setCrewOpen(false);
    setCrewSelected(new Set());
    setSelectedRates(new Map());

    // Open gear add-on panel if there's additional gear available
    const hasExtra = gearLibrary.some(g => !names.has(g.owner.toLowerCase()));
    if (hasExtra) setGearPanelOpen(true);
  };

  const applyExtraGear = () => {
    const items = Array.from(extraGearSelected).map(i => gearLibrary[i]).filter(Boolean);
    if (items.length > 0) {
      const houseItems = items.filter(g => /^fmc|^house/i.test(g.owner));
      const crewItems = items.filter(g => !/^fmc|^house/i.test(g.owner));
      const lines: string[] = [];
      if (crewItems.length > 0) {
        lines.push('--- Rentals from other crew ---');
        for (const g of crewItems) {
          const label = g.brand ? `${g.brand} ${g.itemName}` : g.itemName;
          lines.push(`[${g.category || 'Gear'}] ${label} — $${g.rentalRate || '?'}/day (${g.owner})`);
        }
      }
      if (houseItems.length > 0) {
        lines.push('--- FMC House gear ---');
        for (const g of houseItems) {
          const label = g.brand ? `${g.brand} ${g.itemName}` : g.itemName;
          lines.push(`[${g.category || 'Gear'}] ${label}${g.rentalRate ? ` — $${g.rentalRate}/day` : ''}`);
        }
      }
      setValue('gearList', values.gearList ? values.gearList + '\n' + lines.join('\n') : lines.join('\n'));
    }
    setGearPanelOpen(false);
    setExtraGearSelected(new Set());
  };

  // Gear grouping helpers
  const gearCountByOwner = new Map<string, number>();
  for (const g of gearLibrary) {
    const key = g.owner.toLowerCase();
    gearCountByOwner.set(key, (gearCountByOwner.get(key) || 0) + 1);
  }

  const otherCrewGear = gearLibrary.filter(g => {
    const owner = g.owner.toLowerCase();
    return !appliedCrewNames.has(owner) && !/^fmc|^house/i.test(owner);
  });
  const houseGear = gearLibrary.filter(g => /^fmc|^house/i.test(g.owner));

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
        const showExpandedCrew = mod.key === 'crewSheet' && crewOpen;
        const showGearPanel = mod.key === 'gearList' && gearPanelOpen;
        return (
          <div
            key={mod.key}
            style={{
              maxHeight: isActive ? (showExpandedCrew || showGearPanel ? '800px' : '300px') : '0px',
              opacity: isActive ? 1 : 0,
              overflow: isActive ? 'visible' : 'hidden',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              marginTop: isActive ? undefined : 0,
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">{mod.label}</label>
                <div className="flex items-center gap-2">
                  {mod.key === 'crewSheet' && (
                    <button type="button" onClick={fetchCrew} disabled={disabled || crewLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium active:scale-[0.97]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
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

              {/* ── Crew picker with rate selection ── */}
              {mod.key === 'crewSheet' && crewOpen && crewRoster.length > 0 && (
                <div className="rounded-xl p-3 animate-fadeUp" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="space-y-1 max-h-[280px] overflow-y-auto mb-3">
                    {crewRoster.map((m, i) => {
                      const selected = crewSelected.has(i);
                      const gearCount = gearCountByOwner.get(m.fullName.toLowerCase()) || 0;
                      const rates = getCrewRates(m);
                      const chosenRate = selectedRates.get(i);
                      return (
                        <div key={i}>
                          <button type="button"
                            onClick={() => { setCrewSelected((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; }); }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs active:scale-[0.97]"
                            style={{ background: selected ? 'rgba(224,52,19,0.08)' : 'transparent', transition: 'background 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                          >
                            <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                              style={{ background: selected ? 'rgba(224,52,19,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                              {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#E03413" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                            </span>
                            <span className="text-fmc-offwhite font-medium">{m.displayName}</span>
                            <span className="text-white/30">{m.primaryRole}</span>
                            {gearCount > 0 && <span className="text-fmc-teal/50 text-[10px]">{gearCount} gear</span>}
                            {rates.length === 1 && <span className="text-fmc-firestarter/50 ml-auto text-[10px]">${rates[0].value}/day</span>}
                          </button>
                          {/* Rate pills — show if selected and multiple rates */}
                          {selected && rates.length > 1 && (
                            <div className="flex flex-wrap gap-1.5 ml-8 mt-1 mb-1.5 animate-fadeUp">
                              {rates.map((r, ri) => {
                                const isChosen = chosenRate === r.value || (!chosenRate && ri === 0);
                                return (
                                  <button key={ri} type="button"
                                    onClick={(e) => { e.stopPropagation(); setRate(i, r.value); }}
                                    className="rounded-full px-2 py-0.5 text-[10px] font-medium active:scale-[0.97]"
                                    style={{
                                      background: isChosen ? 'rgba(224,52,19,0.12)' : 'transparent',
                                      border: `1px solid ${isChosen ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                      color: isChosen ? '#E03413' : 'rgba(255,255,255,0.4)',
                                      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                  >
                                    {r.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={applyCrewSelection} disabled={crewSelected.size === 0} className="btn-firestarter px-3 py-1.5 text-[10px]">
                      Add {crewSelected.size} to brief + gear
                    </button>
                    <button type="button" onClick={() => { setCrewOpen(false); setCrewSelected(new Set()); setSelectedRates(new Map()); }} className="btn-ghost px-3 py-1.5 text-[10px]">Cancel</button>
                  </div>
                </div>
              )}

              {/* ── Gear availability panel ── */}
              {mod.key === 'gearList' && gearPanelOpen && (
                <div className="rounded-xl p-3 animate-fadeUp" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="max-h-[300px] overflow-y-auto mb-3 space-y-4">
                    {/* Other crew gear */}
                    {otherCrewGear.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-copper/60 block mb-2">Available from crew not on shoot</span>
                        <div className="space-y-1">
                          {otherCrewGear.map((g, gi) => {
                            const globalIdx = gearLibrary.indexOf(g);
                            const checked = extraGearSelected.has(globalIdx);
                            return (
                              <button key={gi} type="button"
                                onClick={() => { setExtraGearSelected(prev => { const n = new Set(prev); if (n.has(globalIdx)) n.delete(globalIdx); else n.add(globalIdx); return n; }); }}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left text-[11px] active:scale-[0.97]"
                                style={{ background: checked ? 'rgba(180,95,52,0.08)' : 'transparent', transition: 'background 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                              >
                                <span className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                                  style={{ background: checked ? 'rgba(180,95,52,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${checked ? 'rgba(180,95,52,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                                  {checked && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#B45F34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                </span>
                                <span className="text-white/60">{g.brand && <span className="text-white/30">{g.brand} </span>}{g.itemName}</span>
                                <span className="text-white/20 text-[10px]">{g.category}</span>
                                {g.rentalRate && <span className="text-fmc-firestarter/40 ml-auto text-[10px]">${g.rentalRate}/day</span>}
                                <span className="text-white/20 text-[10px]">({g.owner})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* House gear */}
                    {houseGear.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-teal/60 block mb-2">FMC House gear</span>
                        <div className="space-y-1">
                          {houseGear.map((g, gi) => {
                            const globalIdx = gearLibrary.indexOf(g);
                            const checked = extraGearSelected.has(globalIdx);
                            return (
                              <button key={gi} type="button"
                                onClick={() => { setExtraGearSelected(prev => { const n = new Set(prev); if (n.has(globalIdx)) n.delete(globalIdx); else n.add(globalIdx); return n; }); }}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left text-[11px] active:scale-[0.97]"
                                style={{ background: checked ? 'rgba(73,121,123,0.08)' : 'transparent', transition: 'background 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                              >
                                <span className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                                  style={{ background: checked ? 'rgba(73,121,123,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${checked ? 'rgba(73,121,123,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                                  {checked && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#49797B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                </span>
                                <span className="text-white/60">{g.brand && <span className="text-white/30">{g.brand} </span>}{g.itemName}</span>
                                <span className="text-white/20 text-[10px]">{g.category}</span>
                                {g.rentalRate && <span className="text-fmc-teal/40 ml-auto text-[10px]">${g.rentalRate}/day</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={applyExtraGear} disabled={extraGearSelected.size === 0} className="btn-firestarter px-3 py-1.5 text-[10px]">
                      Add {extraGearSelected.size} items
                    </button>
                    <button type="button" onClick={() => { setGearPanelOpen(false); setExtraGearSelected(new Set()); }} className="btn-ghost px-3 py-1.5 text-[10px]">Skip</button>
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
