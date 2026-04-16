'use client';

import { useState, useEffect, useCallback } from 'react';
import VoiceMic from './VoiceMic';
import type { CrewMember } from '@/lib/crew';

type ModuleKey = 'technical' | 'assets' | 'paperEdit' | 'creativeDirection' | 'deliverables' | 'timeline';

type Module = { key: ModuleKey; label: string; placeholder: string };

const MODULES: Module[] = [
  { key: 'technical', label: 'Technical', placeholder: 'Cameras + count, codec, colour space, frame rates, resolution, proxies, audio tracks, timecode, known issues...' },
  { key: 'assets', label: 'Assets', placeholder: 'Footage location, folder structure, selects, music, VO, SFX, graphics, logos, client assets...' },
  { key: 'paperEdit', label: 'Paper Edit', placeholder: 'Story arc, scene breakdown, must-include moments, things to avoid, pacing, target duration...' },
  { key: 'creativeDirection', label: 'Creative Direction', placeholder: 'Tone words, visual treatment, colour grade, graphics style, music direction, sound design...' },
  { key: 'deliverables', label: 'Deliverables', placeholder: 'Formats + specs per platform, resolution, codec, versioning, subtitles, thumbnails...' },
  { key: 'timeline', label: 'Timeline', placeholder: 'Rough cut due, revision rounds, who reviews, final delivery date, interim milestones...' },
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

// Skill keywords to match in brief content
const SKILL_KEYWORDS: Record<string, string[]> = {
  'sound design': ['sound design', 'sound fx', 'sfx', 'audio design'],
  'mgfx': ['motion graphics', 'mgfx', 'motion design', 'animated graphics', 'kinetic type'],
  'colour': ['colour grade', 'color grade', 'colour', 'color correction', 'lut', 'davinci'],
  'conform': ['conform', 'online edit', 'finishing'],
  'mixing': ['audio mix', 'sound mix', 'mixing', '5.1', 'stereo mix'],
  'titles': ['title design', 'titles', 'lower thirds', 'end cards', 'typography'],
  'vfx': ['vfx', 'visual effects', 'compositing', 'green screen', 'rotoscope'],
};

function detectNeededSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(skill);
    }
  }
  return matched;
}

function scoreCrewBySkills(member: CrewMember, neededSkills: string[]): number {
  if (neededSkills.length === 0) return 0;
  const memberSkills = member.skills.map(s => s.toLowerCase());
  let score = 0;
  for (const need of neededSkills) {
    if (memberSkills.some(s => s.includes(need) || need.includes(s))) score++;
  }
  return score;
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
    technical: '', assets: '', paperEdit: '', creativeDirection: '', deliverables: '', timeline: '',
  });

  useEffect(() => { onInputChange(concatenate(active, values)); }, [active, values, onInputChange]);

  const toggle = (key: ModuleKey) => {
    setActive((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  };
  const setValue = (key: ModuleKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // ── Editor pull ──
  const [crewRoster, setCrewRoster] = useState<CrewMember[]>([]);
  const [crewLoading, setCrewLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSelected, setEditorSelected] = useState<Set<number>>(new Set());

  const fetchEditors = useCallback(async () => {
    if (crewRoster.length > 0) { setEditorOpen(true); return; }
    setCrewLoading(true);
    try {
      const res = await fetch('/api/crew').then(r => r.json());
      if (res.crew) setCrewRoster(res.crew);
      setEditorOpen(true);
    } catch { /* silent */ }
    setCrewLoading(false);
  }, [crewRoster.length]);

  const applyEditorSelection = () => {
    const selected = Array.from(editorSelected).map(i => crewRoster[i]).filter(Boolean);
    const lines = selected.map(m => {
      const parts = [`${m.displayName} (${m.fullName}) — ${m.primaryRole}`];
      if (m.editingRate) parts.push(`$${m.editingRate}/day`);
      if (m.skills.length) parts.push(`Skills: ${m.skills.join(', ')}`);
      if (m.phone) parts.push(m.phone);
      return parts.join(', ');
    }).join('\n');
    const key: ModuleKey = 'timeline';
    // Append to timeline as "assigned editor" info
    const editorLine = `\nAssigned: ${lines}`;
    setValue('timeline', values.timeline ? values.timeline + editorLine : `Editor assignment:${editorLine}`);
    setEditorOpen(false);
    setEditorSelected(new Set());
  };

  // Detect needed skills from brief content
  const briefContent = [values.paperEdit, values.creativeDirection].join(' ');
  const neededSkills = detectNeededSkills(briefContent);

  // Sort editors: post-related roles first, then by skill match
  const sortedEditors = [...crewRoster]
    .map((m, i) => ({ member: m, originalIndex: i }))
    .filter(({ member }) => {
      const postRoles = ['editor', 'colourist', 'sound mixer', 'post supervisor', 'conform'];
      const allRoles = [member.primaryRole, ...member.otherRoles].map(r => r.toLowerCase());
      const hasSkills = member.skills.length > 0;
      return allRoles.some(r => postRoles.some(pr => r.includes(pr))) || hasSkills;
    })
    .sort((a, b) => {
      const scoreA = scoreCrewBySkills(a.member, neededSkills);
      const scoreB = scoreCrewBySkills(b.member, neededSkills);
      return scoreB - scoreA;
    });

  return (
    <div className="space-y-5">
      {/* Chip row */}
      <div className="flex flex-wrap gap-2">
        {MODULES.map((mod) => {
          const isActive = active.has(mod.key);
          return (
            <button key={mod.key} type="button" onClick={() => toggle(mod.key)} disabled={disabled}
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
        const showEditorPanel = mod.key === 'timeline' && editorOpen;
        return (
          <div key={mod.key}
            style={{
              maxHeight: isActive ? (showEditorPanel ? '600px' : '300px') : '0px',
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
                  {mod.key === 'timeline' && (
                    <button type="button" onClick={fetchEditors} disabled={disabled || crewLoading}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium active:scale-[0.97]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                      </svg>
                      {crewLoading ? 'Loading...' : 'Assign editor'}
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

              {/* Editor picker with skill matching */}
              {mod.key === 'timeline' && editorOpen && sortedEditors.length > 0 && (
                <div className="rounded-xl p-3 animate-fadeUp" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {neededSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-[10px] text-white/30">Detected needs:</span>
                      {neededSkills.map((s, si) => (
                        <span key={si} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(73,121,123,0.1)', border: '1px solid rgba(73,121,123,0.2)', color: 'rgba(73,121,123,0.7)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1 max-h-[200px] overflow-y-auto mb-3">
                    {sortedEditors.map(({ member: m, originalIndex: oi }) => {
                      const selected = editorSelected.has(oi);
                      const matchScore = scoreCrewBySkills(m, neededSkills);
                      return (
                        <button key={oi} type="button"
                          onClick={() => { setEditorSelected(prev => { const n = new Set(prev); if (n.has(oi)) n.delete(oi); else n.add(oi); return n; }); }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs active:scale-[0.97]"
                          style={{ background: selected ? 'rgba(224,52,19,0.08)' : 'transparent', transition: 'background 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                          <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: selected ? 'rgba(224,52,19,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                            {selected && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#E03413" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          </span>
                          <span className="text-fmc-offwhite font-medium">{m.displayName}</span>
                          <span className="text-white/30">{m.primaryRole}</span>
                          {matchScore > 0 && (
                            <span className="text-fmc-teal text-[10px] font-medium">{matchScore} match{matchScore > 1 ? 'es' : ''}</span>
                          )}
                          {m.editingRate && <span className="text-fmc-firestarter/50 ml-auto text-[10px]">${m.editingRate}/day</span>}
                        </button>
                      );
                    })}
                  </div>
                  {sortedEditors.length === 0 && (
                    <p className="text-xs text-white/30 mb-3">No editors or post crew found in roster.</p>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={applyEditorSelection} disabled={editorSelected.size === 0} className="btn-firestarter px-3 py-1.5 text-[10px]">
                      Assign {editorSelected.size} editor{editorSelected.size !== 1 ? 's' : ''}
                    </button>
                    <button type="button" onClick={() => { setEditorOpen(false); setEditorSelected(new Set()); }} className="btn-ghost px-3 py-1.5 text-[10px]">Cancel</button>
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
