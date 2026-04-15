'use client';

import { useState, useEffect } from 'react';
import VoiceMic from './VoiceMic';

type DiscoveryFields = {
  whatTheySaid: string;
  whatTheyNeed: string;
  situation: string;
  challenge: string;
  transformation: string;
  tierLean: string;
  tierRight: string;
  tierDream: string;
  timeline: string;
  budgetSignals: string;
  decisionMaker: string;
  redFlags: string;
};

const EMPTY: DiscoveryFields = {
  whatTheySaid: '',
  whatTheyNeed: '',
  situation: '',
  challenge: '',
  transformation: '',
  tierLean: '',
  tierRight: '',
  tierDream: '',
  timeline: '',
  budgetSignals: '',
  decisionMaker: '',
  redFlags: '',
};

function concatenate(f: DiscoveryFields): string {
  const lines: string[] = [];

  if (f.whatTheySaid.trim()) {
    lines.push('## What They Said');
    lines.push(f.whatTheySaid.trim());
    lines.push('');
  }
  if (f.whatTheyNeed.trim()) {
    lines.push('## What They Actually Need');
    lines.push(f.whatTheyNeed.trim());
    lines.push('');
  }
  if (f.situation.trim() || f.challenge.trim() || f.transformation.trim()) {
    lines.push('## SCT Framework');
    if (f.situation.trim()) lines.push(`Situation: ${f.situation.trim()}`);
    if (f.challenge.trim()) lines.push(`Challenge: ${f.challenge.trim()}`);
    if (f.transformation.trim()) lines.push(`Transformation: ${f.transformation.trim()}`);
    lines.push('');
  }
  if (f.tierLean.trim() || f.tierRight.trim() || f.tierDream.trim()) {
    lines.push('## Three Tiers');
    if (f.tierLean.trim()) lines.push(`Lean ($): ${f.tierLean.trim()}`);
    if (f.tierRight.trim()) lines.push(`Right ($$): ${f.tierRight.trim()}`);
    if (f.tierDream.trim()) lines.push(`Dream ($$$): ${f.tierDream.trim()}`);
    lines.push('');
  }
  if (f.timeline.trim() || f.budgetSignals.trim() || f.decisionMaker.trim() || f.redFlags.trim()) {
    lines.push('## Context');
    if (f.timeline.trim()) lines.push(`Timeline: ${f.timeline.trim()}`);
    if (f.budgetSignals.trim()) lines.push(`Budget signals: ${f.budgetSignals.trim()}`);
    if (f.decisionMaker.trim()) lines.push(`Decision maker: ${f.decisionMaker.trim()}`);
    if (f.redFlags.trim()) lines.push(`Red flags: ${f.redFlags.trim()}`);
    lines.push('');
  }

  return lines.join('\n');
}

export default function DiscoveryForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const [fields, setFields] = useState<DiscoveryFields>(EMPTY);

  useEffect(() => {
    onInputChange(concatenate(fields));
  }, [fields, onInputChange]);

  const set = (key: keyof DiscoveryFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Section 1: What they said */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">What they said</label>
          <VoiceMic onTranscript={(t) => set('whatTheySaid', fields.whatTheySaid ? fields.whatTheySaid + ' ' + t : t)} disabled={disabled} />
        </div>
        <textarea
          className="glass-input w-full px-3 py-2.5 text-sm resize-y min-h-[80px]"
          placeholder="Client's exact words — what did they ask for?"
          value={fields.whatTheySaid}
          onChange={(e) => set('whatTheySaid', e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Section 2: What they need */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">What they need</label>
          <VoiceMic onTranscript={(t) => set('whatTheyNeed', fields.whatTheyNeed ? fields.whatTheyNeed + ' ' + t : t)} disabled={disabled} />
        </div>
        <textarea
          className="glass-input w-full px-3 py-2.5 text-sm resize-y min-h-[80px]"
          placeholder="Your diagnosis — what do they actually need?"
          value={fields.whatTheyNeed}
          onChange={(e) => set('whatTheyNeed', e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Section 3: SCT Framework */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-3">SCT Framework</span>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fmc-teal/70 font-medium">Situation</label>
              <VoiceMic onTranscript={(t) => set('situation', fields.situation ? fields.situation + ' ' + t : t)} disabled={disabled} />
            </div>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Where's their brand/content right now?"
              value={fields.situation}
              onChange={(e) => set('situation', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fmc-teal/70 font-medium">Challenge</label>
              <VoiceMic onTranscript={(t) => set('challenge', fields.challenge ? fields.challenge + ' ' + t : t)} disabled={disabled} />
            </div>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="What's broken, missing, or at risk?"
              value={fields.challenge}
              onChange={(e) => set('challenge', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fmc-teal/70 font-medium">Transformation</label>
              <VoiceMic onTranscript={(t) => set('transformation', fields.transformation ? fields.transformation + ' ' + t : t)} disabled={disabled} />
            </div>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="What does the win look like?"
              value={fields.transformation}
              onChange={(e) => set('transformation', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Three Tiers */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-3">Three Tiers</span>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-fmc-copper/70 font-medium">Lean ($)</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Minimum viable scope + rough price range"
              value={fields.tierLean}
              onChange={(e) => set('tierLean', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-fmc-copper/70 font-medium">Right ($$)</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="What they actually need, done well + price range"
              value={fields.tierRight}
              onChange={(e) => set('tierRight', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-fmc-copper/70 font-medium">Dream ($$$)</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Everything they wished for, premium execution + price range"
              value={fields.tierDream}
              onChange={(e) => set('tierDream', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Section 5: Context */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-3">Context</span>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Timeline</label>
              <input
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="Hard dates, launch windows, events"
                value={fields.timeline}
                onChange={(e) => set('timeline', e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Decision maker</label>
              <input
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="Who signs the cheque?"
                value={fields.decisionMaker}
                onChange={(e) => set('decisionMaker', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Budget signals</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="What they said vs what you sensed"
              value={fields.budgetSignals}
              onChange={(e) => set('budgetSignals', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">
              Red flags <span className="normal-case tracking-normal text-white/20">(optional)</span>
            </label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Scope creep signals, unrealistic expectations, budget mismatch"
              value={fields.redFlags}
              onChange={(e) => set('redFlags', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
