'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import VoiceMic from './VoiceMic';
import { useSession } from '@/context/SessionContext';
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

type CrewLineItem = {
  id: string;
  personEmail: string;
  personName: string;
  role: string;
  days: number;
  rate: number;
};

function getPersonRoles(m: CrewMember): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of [m.primaryRole, ...(m.otherRoles || [])]) {
    const t = (r || '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function autoRateForRole(m: CrewMember, role: string): number {
  const shootingRoles = ['DP', 'Camera Op', 'Gaffer', 'Sound Mixer', 'BTS'];
  const editingRoles = ['Editor', 'Colourist'];
  const producingRoles = ['Producer', 'Supervising Producer', 'Production Assistant', 'Post Supervisor'];
  const shooting = parseFloat(m.shootingRate || '0') || 0;
  const editing = parseFloat(m.editingRate || '0') || 0;
  const producing = parseFloat(m.producingRate || '0') || 0;
  const other = parseFloat(m.otherRate || '0') || 0;
  if (shootingRoles.includes(role)) return shooting;
  if (editingRoles.includes(role)) return editing;
  if (producingRoles.includes(role)) return producing;
  return other || shooting || 0;
}

function formatCrewLines(lines: CrewLineItem[]): string {
  if (lines.length === 0) return '';
  const rows = lines.map(l => {
    const sub = (l.days * l.rate).toFixed(2);
    return `${l.personName} — ${l.role}, ${l.days}d × $${l.rate}/d = $${sub}`;
  });
  const total = lines.reduce((s, l) => s + l.days * l.rate, 0);
  return rows.join('\n') + `\n\nTotal: $${total.toFixed(2)}`;
}

export default function ProductionForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const { user } = useSession();
  const isAdmin = user?.accessLevel === 'Admin';

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
  const [crewSelected, setCrewSelected] = useState<Set<string>>(new Set());
  const [showOwner, setShowOwner] = useState(false);
  // Gear add-on panel (shown after crew applied)
  const [gearPanelOpen, setGearPanelOpen] = useState(false);
  const [extraGearSelected, setExtraGearSelected] = useState<Set<number>>(new Set());

  // Line items — authoritative model for crew sheet
  const [crewLines, setCrewLines] = useState<CrewLineItem[]>([]);
  const [gearAppliedEmails, setGearAppliedEmails] = useState<Set<string>>(new Set());

  // Sync line items → crewSheet textarea
  useEffect(() => {
    setValue('crewSheet', formatCrewLines(crewLines));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewLines]);

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

  const visibleRoster = useMemo(() => {
    return crewRoster.filter(m => {
      if (m.rosterType === 'owner' && !showOwner) return false;
      return true;
    });
  }, [crewRoster, showOwner]);

  const hiddenOwnerCount = useMemo(
    () => crewRoster.filter(m => m.rosterType === 'owner').length,
    [crewRoster]
  );

  const toggleCrewSelected = (email: string) => {
    setCrewSelected(prev => {
      const n = new Set(prev);
      if (n.has(email)) n.delete(email); else n.add(email);
      return n;
    });
  };

  const applyCrewSelection = () => {
    const selected = Array.from(crewSelected)
      .map(email => crewRoster.find(m => m.email.toLowerCase() === email.toLowerCase()))
      .filter((m): m is CrewMember => !!m);

    if (selected.length === 0) return;

    // Append new line items
    const newLines: CrewLineItem[] = selected.map(m => ({
      id: crypto.randomUUID(),
      personEmail: m.email,
      personName: m.displayName || m.fullName,
      role: m.primaryRole,
      days: 1,
      rate: autoRateForRole(m, m.primaryRole),
    }));

    setCrewLines(prev => [...prev, ...newLines]);

    // Gear auto-bundling — only for emails we haven't already bundled gear for
    const newEmails = new Set<string>();
    const newFullnames = new Set<string>();
    for (const m of selected) {
      const key = m.email.toLowerCase();
      if (!gearAppliedEmails.has(key)) {
        newEmails.add(key);
        newFullnames.add(m.fullName.toLowerCase());
      }
    }

    if (newFullnames.size > 0) {
      const crewGear = gearLibrary.filter(g => newFullnames.has(g.owner.toLowerCase()));
      if (crewGear.length > 0) {
        const lines = ['--- Crew kit (included) ---'];
        for (const g of crewGear) {
          const label = g.brand ? `${g.brand} ${g.itemName}` : g.itemName;
          lines.push(`[${g.category || 'Gear'}] ${label} (${g.owner})`);
        }
        setValue('gearList', values.gearList ? values.gearList + '\n' + lines.join('\n') : lines.join('\n'));
      }
      setGearAppliedEmails(prev => {
        const n = new Set(prev);
        Array.from(newEmails).forEach(e => n.add(e));
        return n;
      });
    }

    setCrewOpen(false);
    setCrewSelected(new Set());

    // Open gear add-on panel if there's additional gear available
    const onShoot = new Set<string>();
    Array.from(gearAppliedEmails).forEach(e => onShoot.add(e));
    Array.from(newEmails).forEach(e => onShoot.add(e));
    const onShootNames = new Set(
      crewRoster
        .filter(m => onShoot.has(m.email.toLowerCase()))
        .map(m => m.fullName.toLowerCase())
    );
    const hasExtra = gearLibrary.some(g => !onShootNames.has(g.owner.toLowerCase()));
    if (hasExtra) setGearPanelOpen(true);
  };

  const updateLine = (id: string, patch: Partial<CrewLineItem>) => {
    setCrewLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const removeLine = (id: string) => {
    setCrewLines(prev => prev.filter(l => l.id !== id));
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

  const appliedCrewOwnerNames = useMemo(() => {
    const emails = new Set(crewLines.map(l => l.personEmail.toLowerCase()));
    return new Set(
      crewRoster
        .filter(m => emails.has(m.email.toLowerCase()))
        .map(m => m.fullName.toLowerCase())
    );
  }, [crewLines, crewRoster]);

  const otherCrewGear = gearLibrary.filter(g => {
    const owner = g.owner.toLowerCase();
    return !appliedCrewOwnerNames.has(owner) && !/^fmc|^house/i.test(owner);
  });
  const houseGear = gearLibrary.filter(g => /^fmc|^house/i.test(g.owner));

  const runningTotal = crewLines.reduce((s, l) => s + l.days * l.rate, 0);

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
        const showLines = mod.key === 'crewSheet' && crewLines.length > 0;
        return (
          <div
            key={mod.key}
            style={{
              maxHeight: isActive ? (showExpandedCrew || showGearPanel || showLines ? 'none' : '300px') : '0px',
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
                      {crewLoading ? 'Loading...' : crewLines.length > 0 ? 'Add crew line' : 'Pull from roster'}
                    </button>
                  )}
                  <VoiceMic onTranscript={(t) => setValue(mod.key, values[mod.key] ? values[mod.key] + ' ' + t : t)} disabled={disabled} />
                </div>
              </div>

              {/* ── Crew line items (above textarea) ── */}
              {mod.key === 'crewSheet' && crewLines.length > 0 && (
                <div className="glass-panel p-4 space-y-2 animate-fadeUp">
                  {crewLines.map(line => {
                    const member = crewRoster.find(m => m.email.toLowerCase() === line.personEmail.toLowerCase());
                    const roleOptions = member ? getPersonRoles(member) : [line.role];
                    const subtotal = line.days * line.rate;
                    return (
                      <div key={line.id} className="flex flex-wrap items-center gap-2">
                        <select
                          value={line.personEmail}
                          onChange={(e) => {
                            const next = crewRoster.find(m => m.email === e.target.value);
                            if (!next) return;
                            const nextRoles = getPersonRoles(next);
                            const nextRole = nextRoles.includes(line.role) ? line.role : (next.primaryRole || nextRoles[0] || line.role);
                            updateLine(line.id, {
                              personEmail: next.email,
                              personName: next.displayName || next.fullName,
                              role: nextRole,
                              rate: autoRateForRole(next, nextRole),
                            });
                          }}
                          className="glass-input px-2 py-1 text-xs flex-1 min-w-[140px]"
                        >
                          {crewRoster.map(m => (
                            <option key={m.email} value={m.email}>{m.displayName || m.fullName}</option>
                          ))}
                        </select>

                        <select
                          value={line.role}
                          onChange={(e) => {
                            const role = e.target.value;
                            const rate = member ? autoRateForRole(member, role) : line.rate;
                            updateLine(line.id, { role, rate });
                          }}
                          className="glass-input px-2 py-1 text-xs min-w-[120px]"
                        >
                          {roleOptions.length === 0 && <option value={line.role}>{line.role}</option>}
                          {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateLine(line.id, { days: Math.max(0.5, line.days - 0.5) })}
                            className="btn-ghost p-1 text-xs leading-none w-6 h-6 flex items-center justify-center"
                            aria-label="Decrement days"
                          >−</button>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={line.days}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v >= 0.5) updateLine(line.id, { days: v });
                            }}
                            className="glass-input px-1 py-1 text-xs w-14 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => updateLine(line.id, { days: line.days + 0.5 })}
                            className="btn-ghost p-1 text-xs leading-none w-6 h-6 flex items-center justify-center"
                            aria-label="Increment days"
                          >+</button>
                          <span className="text-[10px] text-white/40 ml-0.5">d</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-white/40">$</span>
                          <input
                            type="number"
                            min="0"
                            value={line.rate}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              updateLine(line.id, { rate: isNaN(v) ? 0 : v });
                            }}
                            className="glass-input px-2 py-1 text-xs w-20"
                            style={{ MozAppearance: 'textfield' }}
                          />
                          <span className="text-[10px] text-white/40">/d</span>
                        </div>

                        <span className="text-xs text-fmc-offwhite font-medium ml-auto">
                          = ${subtotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="text-white/40 hover:text-fmc-firestarter text-lg leading-none px-1 active:scale-[0.97]"
                          style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                          aria-label="Remove line"
                        >×</button>
                      </div>
                    );
                  })}

                  <div className="pt-3 mt-1 flex items-center justify-between border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={fetchCrew}
                      disabled={disabled || crewLoading}
                      className="btn-ghost px-3 py-1.5 text-[11px] active:scale-[0.97]"
                    >
                      + Add crew line
                    </button>
                    <span className="text-sm font-bold text-fmc-offwhite">
                      Total: ${runningTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <textarea
                className="glass-input w-full px-3 py-2.5 text-sm resize-y min-h-[80px]"
                placeholder={mod.placeholder}
                value={values[mod.key]}
                onChange={(e) => setValue(mod.key, e.target.value)}
                disabled={disabled}
              />

              {/* ── Crew picker ── */}
              {mod.key === 'crewSheet' && crewOpen && visibleRoster.length > 0 && (
                <div className="rounded-xl p-3 animate-fadeUp" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="space-y-1 max-h-[280px] overflow-y-auto mb-3">
                    {visibleRoster.map((m) => {
                      const selected = crewSelected.has(m.email);
                      const gearCount = gearCountByOwner.get(m.fullName.toLowerCase()) || 0;
                      return (
                        <button key={m.email} type="button"
                          onClick={() => toggleCrewSelected(m.email)}
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
                          {m.rosterType === 'owner' && <span className="text-fmc-copper/60 text-[9px] uppercase tracking-[0.15em] ml-auto">Owner</span>}
                        </button>
                      );
                    })}
                  </div>
                  {isAdmin && hiddenOwnerCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowOwner(s => !s)}
                      className="text-[10px] text-white/40 hover:text-fmc-firestarter/80 mb-2 active:scale-[0.97]"
                      style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                      {showOwner ? 'Hide owner' : 'Include owner (admin only)'}
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={applyCrewSelection} disabled={crewSelected.size === 0} className="btn-firestarter px-3 py-1.5 text-[10px]">
                      Add {crewSelected.size} to brief + gear
                    </button>
                    <button type="button" onClick={() => { setCrewOpen(false); setCrewSelected(new Set()); }} className="btn-ghost px-3 py-1.5 text-[10px]">Cancel</button>
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
