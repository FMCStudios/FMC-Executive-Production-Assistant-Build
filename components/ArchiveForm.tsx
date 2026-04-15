'use client';

import { useState, useEffect } from 'react';

type ArchiveFields = {
  finalsSent: string;
  clientConfirmed: string;
  rawFootage: string;
  projectFiles: string;
  exports: string;
  totalSize: string;
  backedUp: string;
  backupWhere: string;
  cloudVsLocal: string;
  clientNotified: string;
  clientResponse: string;
  deletionDate: string;
  approvedForReel: string;
  bestClips: string;
};

const EMPTY: ArchiveFields = {
  finalsSent: '',
  clientConfirmed: '',
  rawFootage: '',
  projectFiles: '',
  exports: '',
  totalSize: '',
  backedUp: '',
  backupWhere: '',
  cloudVsLocal: '',
  clientNotified: '',
  clientResponse: '',
  deletionDate: '',
  approvedForReel: '',
  bestClips: '',
};

function concatenate(f: ArchiveFields): string {
  const lines: string[] = [];

  const hasDelivery = f.finalsSent.trim() || f.clientConfirmed;
  if (hasDelivery) {
    lines.push('## Delivery Log');
    if (f.finalsSent.trim()) lines.push(`Finals sent: ${f.finalsSent.trim()}`);
    if (f.clientConfirmed) lines.push(`Client confirmed receipt: ${f.clientConfirmed}`);
    lines.push('');
  }

  const hasAssets = f.rawFootage.trim() || f.projectFiles.trim() || f.exports.trim();
  if (hasAssets) {
    lines.push('## Asset Map');
    if (f.rawFootage.trim()) lines.push(`Raw footage: ${f.rawFootage.trim()}`);
    if (f.projectFiles.trim()) lines.push(`Project files: ${f.projectFiles.trim()}`);
    if (f.exports.trim()) lines.push(`Exports: ${f.exports.trim()}`);
    lines.push('');
  }

  const hasStorage = f.totalSize.trim() || f.backedUp || f.cloudVsLocal;
  if (hasStorage) {
    lines.push('## Storage Status');
    if (f.totalSize.trim()) lines.push(`Total size: ${f.totalSize.trim()}`);
    if (f.backedUp) {
      const where = f.backedUp === 'Yes' && f.backupWhere.trim() ? ` (${f.backupWhere.trim()})` : '';
      lines.push(`Backed up: ${f.backedUp}${where}`);
    }
    if (f.cloudVsLocal) lines.push(`Storage type: ${f.cloudVsLocal}`);
    lines.push('');
  }

  const hasDeletion = f.clientNotified || f.clientResponse || f.deletionDate;
  if (hasDeletion) {
    lines.push('## Deletion Authorization');
    if (f.clientNotified) lines.push(`Client notified: ${f.clientNotified}`);
    if (f.clientResponse) lines.push(`Client response: ${f.clientResponse}`);
    if (f.deletionDate) lines.push(`Deletion date: ${f.deletionDate}`);
    lines.push('');
  }

  const hasPortfolio = f.approvedForReel || f.bestClips.trim();
  if (hasPortfolio) {
    lines.push('## Portfolio Flag');
    if (f.approvedForReel) lines.push(`Approved for reel: ${f.approvedForReel}`);
    if (f.bestClips.trim()) lines.push(`Best clips: ${f.bestClips.trim()}`);
    lines.push('');
  }

  return lines.join('\n');
}

export default function ArchiveForm({
  onInputChange,
  disabled,
}: {
  onInputChange: (value: string) => void;
  disabled: boolean;
}) {
  const [fields, setFields] = useState<ArchiveFields>(EMPTY);

  useEffect(() => {
    onInputChange(concatenate(fields));
  }, [fields, onInputChange]);

  const set = (key: keyof ArchiveFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Delivery Log */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-4">Delivery Log</span>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Finals sent</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="What was delivered, when, and how (Frame.io / WeTransfer / Drive)"
              value={fields.finalsSent}
              onChange={(e) => set('finalsSent', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Client confirmed receipt</label>
            <select
              className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
              value={fields.clientConfirmed}
              onChange={(e) => set('clientConfirmed', e.target.value)}
              disabled={disabled}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Map */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-4">Asset Map</span>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Raw footage location</label>
            <input
              type="text"
              className="glass-input w-full px-3 py-2.5 text-sm"
              placeholder="Drive name + path"
              value={fields.rawFootage}
              onChange={(e) => set('rawFootage', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Project files location</label>
            <input
              type="text"
              className="glass-input w-full px-3 py-2.5 text-sm"
              placeholder="Resolve / Premiere project file path"
              value={fields.projectFiles}
              onChange={(e) => set('projectFiles', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Exports location</label>
            <input
              type="text"
              className="glass-input w-full px-3 py-2.5 text-sm"
              placeholder="Finals / deliverables path"
              value={fields.exports}
              onChange={(e) => set('exports', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Storage Status */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-4">Storage Status</span>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Total size</label>
              <input
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="e.g. 1.2 TB"
                value={fields.totalSize}
                onChange={(e) => set('totalSize', e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Cloud vs local</label>
              <select
                className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
                value={fields.cloudVsLocal}
                onChange={(e) => set('cloudVsLocal', e.target.value)}
                disabled={disabled}
              >
                <option value="">Select...</option>
                <option value="Local only">Local only</option>
                <option value="Cloud only">Cloud only</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Backed up?</label>
            <select
              className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
              value={fields.backedUp}
              onChange={(e) => set('backedUp', e.target.value)}
              disabled={disabled}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {fields.backedUp === 'Yes' && (
            <div
              className="flex flex-col gap-2"
              style={{ animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
            >
              <label className="text-xs text-white/40 font-medium">Backup location</label>
              <input
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="Second drive, cloud service, LTO"
                value={fields.backupWhere}
                onChange={(e) => set('backupWhere', e.target.value)}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>

      {/* Deletion Authorization */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-4">Deletion Authorization</span>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Client notified</label>
              <input
                type="date"
                className="glass-input w-full px-3 py-2.5 text-sm"
                value={fields.clientNotified}
                onChange={(e) => set('clientNotified', e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/40 font-medium">Client response</label>
              <select
                className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
                value={fields.clientResponse}
                onChange={(e) => set('clientResponse', e.target.value)}
                disabled={disabled}
              >
                <option value="">Select...</option>
                <option value="Keep">Keep</option>
                <option value="Delete">Delete</option>
                <option value="No response">No response</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Scheduled deletion date</label>
            <input
              type="date"
              className="glass-input w-full px-3 py-2.5 text-sm"
              value={fields.deletionDate}
              onChange={(e) => set('deletionDate', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Portfolio Flag */}
      <div>
        <span className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-4">Portfolio Flag</span>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Approved for reel</label>
            <select
              className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
              value={fields.approvedForReel}
              onChange={(e) => set('approvedForReel', e.target.value)}
              disabled={disabled}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/40 font-medium">Best clips / moments</label>
            <textarea
              className="glass-input w-full px-3 py-2.5 text-sm resize-none"
              rows={2}
              placeholder="Tag standout moments for showreel"
              value={fields.bestClips}
              onChange={(e) => set('bestClips', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
