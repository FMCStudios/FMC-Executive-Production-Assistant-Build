'use client';

import { useState, useEffect } from 'react';
import VoiceMic from './VoiceMic';

type IntakeFields = {
  clientName: string;
  company: string;
  source: string;
  need: string;
  gutRead: string;
  nextStep: string;
  deadlines: string;
  contact: string;
};

const EMPTY: IntakeFields = {
  clientName: '',
  company: '',
  source: '',
  need: '',
  gutRead: '',
  nextStep: '',
  deadlines: '',
  contact: '',
};

function concatenate(f: IntakeFields): string {
  const lines: string[] = [];
  if (f.clientName) lines.push(`Client: ${f.clientName}`);
  if (f.company) lines.push(`Company: ${f.company}`);
  if (f.source) lines.push(`How they found us: ${f.source}`);
  if (f.need) lines.push(`What they think they need: ${f.need}`);
  if (f.gutRead) lines.push(`Gut read: ${f.gutRead}`);
  if (f.nextStep) lines.push(`Next step: ${f.nextStep}`);
  if (f.deadlines) lines.push(`Deadlines: ${f.deadlines}`);
  if (f.contact) lines.push(`Contact: ${f.contact}`);
  return lines.join('\n');
}

export default function IntakeForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const [fields, setFields] = useState<IntakeFields>(EMPTY);

  useEffect(() => {
    onInputChange(concatenate(fields));
  }, [fields, onInputChange]);

  const set = (key: keyof IntakeFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = fields.clientName.trim() || fields.need.trim();

  return (
    <div className="space-y-4">
      {/* Row 1: Client + Company */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Client name</label>
          <input
            type="text"
            className="glass-input w-full px-3 py-2.5 text-sm"
            value={fields.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            disabled={disabled}
            placeholder="First Last"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Company</label>
          <input
            type="text"
            className="glass-input w-full px-3 py-2.5 text-sm"
            value={fields.company}
            onChange={(e) => set('company', e.target.value)}
            disabled={disabled}
            placeholder="Company or Independent"
          />
        </div>
      </div>

      {/* Row 2: Source + Gut read */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">How they found us</label>
          <select
            className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
            value={fields.source}
            onChange={(e) => set('source', e.target.value)}
            disabled={disabled}
          >
            <option value="">Select...</option>
            <option value="Referral">Referral</option>
            <option value="Instagram">Instagram</option>
            <option value="Cold">Cold</option>
            <option value="Repeat">Repeat</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Gut read</label>
          <select
            className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
            value={fields.gutRead}
            onChange={(e) => set('gutRead', e.target.value)}
            disabled={disabled}
          >
            <option value="">Select...</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Tire Kicker">Tire Kicker</option>
          </select>
        </div>
      </div>

      {/* Row 3: What they need */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">What they think they need</label>
          <VoiceMic onTranscript={(t) => set('need', fields.need ? fields.need + ' ' + t : t)} disabled={disabled} />
        </div>
        <textarea
          className="glass-input w-full px-3 py-2.5 text-sm resize-none"
          rows={2}
          value={fields.need}
          onChange={(e) => set('need', e.target.value)}
          disabled={disabled}
          placeholder="Their words, rough is fine"
        />
      </div>

      {/* Row 4: Next step + Deadlines */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Next step</label>
          <select
            className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
            value={fields.nextStep}
            onChange={(e) => set('nextStep', e.target.value)}
            disabled={disabled}
          >
            <option value="">Select...</option>
            <option value="Book Discovery Call">Book Discovery Call</option>
            <option value="Send Rate Card">Send Rate Card</option>
            <option value="Pass">Pass</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">
            Deadlines <span className="normal-case tracking-normal text-white/20">(optional)</span>
          </label>
          <input
            type="text"
            className="glass-input w-full px-3 py-2.5 text-sm"
            value={fields.deadlines}
            onChange={(e) => set('deadlines', e.target.value)}
            disabled={disabled}
            placeholder="Any dates or urgency"
          />
        </div>
      </div>

      {/* Row 5: Contact */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Contact info</label>
        <input
          type="text"
          className="glass-input w-full px-3 py-2.5 text-sm"
          value={fields.contact}
          onChange={(e) => set('contact', e.target.value)}
          disabled={disabled}
          placeholder="Email, phone, or IG handle"
        />
      </div>
    </div>
  );
}
