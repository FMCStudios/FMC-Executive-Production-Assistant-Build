'use client';

import { useState, useEffect } from 'react';

type WrapFields = {
  satisfaction: string;
  wouldRefer: string;
  surprised: string;
  improve: string;
  testimonialOptIn: boolean;
  testimonialQuote: string;
  wentWell: string;
  leakedTime: string;
  scopeCreep: string;
  nextProject: string;
  retainerPotential: string;
  followUpDate: string;
  relationshipTemp: string;
};

const EMPTY: WrapFields = {
  satisfaction: '',
  wouldRefer: '',
  surprised: '',
  improve: '',
  testimonialOptIn: false,
  testimonialQuote: '',
  wentWell: '',
  leakedTime: '',
  scopeCreep: '',
  nextProject: '',
  retainerPotential: '',
  followUpDate: '',
  relationshipTemp: '',
};

function concatenate(f: WrapFields): string {
  const lines: string[] = [];

  const hasSurvey = f.satisfaction || f.wouldRefer || f.surprised.trim() || f.improve.trim() || f.testimonialOptIn;
  if (hasSurvey) {
    lines.push('## Client Survey');
    if (f.satisfaction) lines.push(`Satisfaction: ${f.satisfaction}/5`);
    if (f.wouldRefer) lines.push(`Would refer: ${f.wouldRefer}`);
    if (f.surprised.trim()) lines.push(`What surprised them: ${f.surprised.trim()}`);
    if (f.improve.trim()) lines.push(`What to improve: ${f.improve.trim()}`);
    lines.push(`Testimonial opt-in: ${f.testimonialOptIn ? 'Yes' : 'No'}`);
    if (f.testimonialOptIn && f.testimonialQuote.trim()) lines.push(`Testimonial: ${f.testimonialQuote.trim()}`);
    lines.push('');
  }

  const hasDebrief = f.wentWell.trim() || f.leakedTime.trim() || f.scopeCreep.trim();
  if (hasDebrief) {
    lines.push('## Internal Debrief');
    if (f.wentWell.trim()) lines.push(`What went well: ${f.wentWell.trim()}`);
    if (f.leakedTime.trim()) lines.push(`What leaked time: ${f.leakedTime.trim()}`);
    if (f.scopeCreep.trim()) lines.push(`Scope creep: ${f.scopeCreep.trim()}`);
    lines.push('');
  }

  const hasRetention = f.nextProject.trim() || f.retainerPotential || f.followUpDate || f.relationshipTemp;
  if (hasRetention) {
    lines.push('## Retention Trigger');
    if (f.nextProject.trim()) lines.push(`Next project idea: ${f.nextProject.trim()}`);
    if (f.retainerPotential) lines.push(`Retainer potential: ${f.retainerPotential}`);
    if (f.followUpDate) lines.push(`Follow-up date: ${f.followUpDate}`);
    if (f.relationshipTemp) lines.push(`Relationship temp: ${f.relationshipTemp}`);
    lines.push('');
  }

  return lines.join('\n');
}

function SatisfactionPills({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      {['1', '2', '3', '4', '5'].map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(active ? '' : n)}
            disabled={disabled}
            className="w-9 h-9 rounded-full text-sm font-semibold active:scale-[0.97]"
            style={{
              background: active ? 'rgba(224,52,19,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: active ? '#E03413' : 'rgba(255,255,255,0.5)',
              boxShadow: active ? '0 0 12px rgba(224,52,19,0.12)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export default function WrapRetentionForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const [fields, setFields] = useState<WrapFields>(EMPTY);

  useEffect(() => {
    onInputChange(concatenate(fields));
  }, [fields, onInputChange]);

  const set = (key: keyof WrapFields, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Client Survey */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-white/40 block mb-4">Client Survey</span>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Satisfaction (1-5)</label>
            <SatisfactionPills value={fields.satisfaction} onChange={(v) => set('satisfaction', v)} disabled={disabled} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Would they refer FMC?</label>
            <select
              className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
              value={fields.wouldRefer}
              onChange={(e) => set('wouldRefer', e.target.value)}
              disabled={disabled}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="Maybe">Maybe</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">What surprised them?</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="About working with us"
              value={fields.surprised}
              onChange={(e) => set('surprised', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">What could we improve?</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Honest feedback"
              value={fields.improve}
              onChange={(e) => set('improve', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 active:scale-[0.97]"
                style={{
                  background: fields.testimonialOptIn ? 'rgba(224,52,19,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${fields.testimonialOptIn ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onClick={() => set('testimonialOptIn', !fields.testimonialOptIn)}
              >
                {fields.testimonialOptIn && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E03413" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-white/40 font-medium">Testimonial opt-in</span>
            </label>
            {fields.testimonialOptIn && (
              <div
                className="mt-3"
                style={{
                  animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              >
                <textarea
                  className="glass-input w-full px-3 py-2.5 text-sm resize-none"
                  rows={2}
                  placeholder="Quote or testimonial text"
                  value={fields.testimonialQuote}
                  onChange={(e) => set('testimonialQuote', e.target.value)}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal Debrief */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-white/40 block mb-4">Internal Debrief</span>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">What went well</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Top wins from this project"
              value={fields.wentWell}
              onChange={(e) => set('wentWell', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">What leaked time / energy</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Be specific — what drained resources?"
              value={fields.leakedTime}
              onChange={(e) => set('leakedTime', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Scope creep</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="What got added outside original scope? Was it billed?"
              value={fields.scopeCreep}
              onChange={(e) => set('scopeCreep', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Retention Trigger */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-white/40 block mb-4">Retention Trigger</span>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Next project idea</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Anything surface during the engagement?"
              value={fields.nextProject}
              onChange={(e) => set('nextProject', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Retainer potential</label>
              <select
                className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
                value={fields.retainerPotential}
                onChange={(e) => set('retainerPotential', e.target.value)}
                disabled={disabled}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="Maybe">Maybe</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Relationship temp</label>
              <select
                className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
                value={fields.relationshipTemp}
                onChange={(e) => set('relationshipTemp', e.target.value)}
                disabled={disabled}
              >
                <option value="">Select...</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Dormant">Dormant</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Follow-up date</label>
            <input
              type="date"
              className="glass-input w-full px-3 py-2.5 text-sm"
              value={fields.followUpDate}
              onChange={(e) => set('followUpDate', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
