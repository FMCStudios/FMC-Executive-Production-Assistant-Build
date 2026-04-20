'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import BriefCard, { BriefDetailModal, type PipelineBrief } from '@/components/BriefCard';
import { LEAD_STATES } from '@/types/brief-schema';
import { useSession } from '@/context/SessionContext';

const BRIEF_TYPES = [
  'Lead Intake',
  'Discovery Call',
  'Pitch',
  'Production',
  'Post-Production',
  'Wrap & Retention',
  'Archive',
];

const DATE_RANGES: Array<{ label: string; days: number | null }> = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
];

function withinRange(iso: string, days: number | null): boolean {
  if (days === null) return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}

export default function PipelinePage() {
  const { user } = useSession();
  const [briefs, setBriefs] = useState<PipelineBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PipelineBrief | null>(null);

  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [stateFilters, setStateFilters] = useState<Set<string>>(new Set());
  const [operatorFilter, setOperatorFilter] = useState('');
  const [rangeDays, setRangeDays] = useState<number | null>(30);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const url = user?.accessLevel === 'Admin' || user?.accessLevel === 'Supervisor'
      ? '/api/briefs?scope=all'
      : '/api/briefs';
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          const list: PipelineBrief[] = d.all || [...(d.wrote || []), ...(d.onBrief || [])];
          setBriefs(list);
        }
      })
      .catch(() => setError('Failed to load briefs'))
      .finally(() => setLoading(false));
  }, [user]);

  const operators = useMemo(
    () => Array.from(new Set(briefs.map(b => b.operator).filter(Boolean))).sort(),
    [briefs]
  );

  const filtered = useMemo(() => {
    return briefs.filter(b => {
      if (typeFilters.size > 0 && !typeFilters.has(b.briefType)) return false;
      if (stateFilters.size > 0 && !stateFilters.has(b.leadState)) return false;
      if (operatorFilter && b.operator !== operatorFilter) return false;
      if (!withinRange(b.date, rangeDays)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${b.client} ${b.company} ${b.project} ${b.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [briefs, typeFilters, stateFilters, operatorFilter, rangeDays, search]);

  const toggleSet = (set: Set<string>, setFn: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setFn(next);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-2">Pipeline</h1>
            <p className="text-sm text-white/50">
              Every brief across the team. Filter by type, lead state, operator, and date.
            </p>
          </div>

          {/* Filters */}
          <div className="glass-panel p-5 mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 mr-1">Type</span>
              {BRIEF_TYPES.map(t => {
                const active = typeFilters.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleSet(typeFilters, setTypeFilters, t)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium active:scale-[0.97]"
                    style={{
                      background: active ? 'rgba(224,52,19,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 mr-1">State</span>
              {LEAD_STATES.map(s => {
                const active = stateFilters.has(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSet(stateFilters, setStateFilters, s)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium active:scale-[0.97]"
                    style={{
                      background: active ? 'rgba(180,95,52,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(180,95,52,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">Operator</span>
                <select
                  className="glass-input px-3 py-2 text-xs appearance-none"
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {operators.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">Range</span>
                <div
                  className="inline-flex rounded-full p-0.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {DATE_RANGES.map(r => {
                    const active = rangeDays === r.days;
                    return (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setRangeDays(r.days)}
                        className="px-3 py-1 text-[11px] uppercase tracking-[0.15em] font-medium rounded-full active:scale-[0.97]"
                        style={{
                          background: active ? 'rgba(224,52,19,0.2)' : 'transparent',
                          color: active ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  className="glass-input w-full px-3 py-2 text-sm"
                  placeholder="Search client, company, project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-sm text-white/40 animate-pulse">Loading pipeline...</div>
          )}

          {error && (
            <div
              className="glass-panel p-5 text-sm text-fmc-firestarter/80"
              style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
            >
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="glass-panel p-8 text-center">
              <p className="text-sm text-white/50">No briefs match these filters.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((b, i) => (
                <div
                  key={b.briefId || `${b.date}-${i}`}
                  className="opacity-0 animate-fadeUp"
                  style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
                >
                  <BriefCard brief={b} onOpen={setDetail} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BriefDetailModal brief={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
