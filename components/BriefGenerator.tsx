'use client';

import { useState, useCallback } from 'react';
import { useSession } from '@/context/SessionContext';
import type { BriefTypeConfig, BriefSchema, LeadState } from '@/types/brief-schema';
import { LEAD_STATES, COLD_LEAD_STATES } from '@/types/brief-schema';
import BriefOutput from './BriefOutput';
import IntakeForm from './IntakeForm';
import DiscoveryForm from './DiscoveryForm';
import ProductionForm from './ProductionForm';
import PostProductionForm from './PostProductionForm';
import WrapRetentionForm from './WrapRetentionForm';
import ArchiveForm from './ArchiveForm';
import Toast from './ui/Toast';
import VoiceMic from './VoiceMic';

type PipelineStatus = 'idle' | 'saving' | 'saved' | 'failed';

// Which upstream brief types to offer, per brief.
const UPSTREAM_TYPES: Record<string, string[]> = {
  'lead-intake': [],
  'discovery': ['lead-intake'],
  'pitch': ['lead-intake', 'discovery'],
  'production': ['lead-intake', 'discovery', 'pitch'],
  'post-production': ['discovery', 'pitch', 'production'],
  'wrap-retention': ['pitch', 'production', 'post-production'],
  'archive': ['production', 'post-production', 'wrap-retention'],
};

type UpstreamJsonPick = {
  kind: 'json';
  briefType: string;
  brief: BriefSchema;
  sourceLabel: string;
};

type UpstreamTextPick = {
  kind: 'text';
  filename: string;
  text: string;
};

type UpstreamPick = UpstreamJsonPick | UpstreamTextPick;

type DriveFile = {
  id: string;
  name: string;
  url: string;
  createdTime: string;
};

export default function BriefGenerator({ briefType }: { briefType: BriefTypeConfig }) {
  const { user } = useSession();
  const primaryRole = user?.primaryRole || '';
  const isIntake = briefType.id === 'lead-intake';
  const isDiscovery = briefType.id === 'discovery';
  const isProduction = briefType.id === 'production';
  const isPostProduction = briefType.id === 'post-production';
  const isWrapRetention = briefType.id === 'wrap-retention';
  const isArchive = briefType.id === 'archive';

  const [input, setInput] = useState('');
  const handleFormChange = useCallback((value: string) => setInput(value), []);
  const [briefData, setBriefData] = useState<BriefSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');

  // Lead-state + reflections + upstream
  const [leadState, setLeadState] = useState<LeadState>('Nurture Needed');
  const [reEngagementTrigger, setReEngagementTrigger] = useState('');
  const [reflections, setReflections] = useState('');
  const [upstreamPicks, setUpstreamPicks] = useState<UpstreamPick[]>([]);
  // Upload is now primary; Drive picker is fallback for already-synced briefs.
  const [pickerMode, setPickerMode] = useState<'upload' | 'drive'>('upload');
  const [driveCompany, setDriveCompany] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const reflectionsRequired = !isIntake;
  const reflectionsMissing = reflectionsRequired && !reflections.trim();
  const isColdLead = COLD_LEAD_STATES.includes(leadState);
  const offersUpstream = UPSTREAM_TYPES[briefType.id]?.length > 0;

  const canGenerate = !!input.trim() && !reflectionsMissing && !loading;

  const appendReflection = (text: string) => setReflections(text);

  const searchDrive = async () => {
    if (!driveCompany.trim()) return;
    setDriveLoading(true);
    try {
      const res = await fetch(`/api/drive/list/${encodeURIComponent(driveCompany.trim())}`);
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch {
      setDriveFiles([]);
    } finally {
      setDriveLoading(false);
    }
  };

  const pickFromDrive = async (file: DriveFile) => {
    try {
      const res = await fetch('/api/drive/fetch-sidecar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      });
      const data = await res.json();
      if (!data?.brief) return;
      const brief = data.brief as BriefSchema;
      const guessedType = guessBriefTypeFromFilename(file.name);
      setUpstreamPicks(list => [...list, {
        kind: 'json',
        briefType: guessedType,
        brief,
        sourceLabel: `Drive \u00B7 ${file.name}`,
      }]);
    } catch {
      /* swallow — UI will just not add anything */
    }
  };

  const pickFromUpload = async (file: File) => {
    setUploadError(null);
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
      setUploadError('PDF parsing coming soon. For now, copy the brief content into a .md or .txt file.');
      return;
    }

    try {
      const text = await file.text();
      const isJson = lower.endsWith('.json') || file.type === 'application/json';

      if (isJson) {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || !('projectName' in parsed) || !('context' in parsed)) {
          setUploadError('JSON does not appear to be an EPA brief sidecar.');
          return;
        }
        const guessedType = guessBriefTypeFromFilename(file.name);
        setUpstreamPicks(list => [...list, {
          kind: 'json',
          briefType: guessedType,
          brief: parsed as BriefSchema,
          sourceLabel: `Upload \u00B7 ${file.name}`,
        }]);
        return;
      }

      // .md / .txt / unknown text → raw upstream text
      setUpstreamPicks(list => [...list, {
        kind: 'text',
        filename: file.name,
        text,
      }]);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setUploadError(`Couldn't read file: ${err.message}`);
    }
  };

  const removeUpstream = (i: number) => {
    setUpstreamPicks(list => list.filter((_, ix) => ix !== i));
  };

  const saveToPipeline = async (data: BriefSchema) => {
    setPipelineStatus('saving');
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: 'FMC Studios',
          briefType: briefType.id,
          briefTypeName: briefType.name,
          phase: briefType.phase,
          operatorId: primaryRole,
          primaryRole,
          operatorEmail: user?.email || '',
          rawInput: input,
          briefOutput: JSON.stringify(data),
          leadState: data.leadState,
          gaps: data.gaps.map(g => g.text),
        }),
      });
      if (!res.ok) throw new Error('Sheet write failed');
      setPipelineStatus('saved');
    } catch {
      setPipelineStatus('failed');
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);
    setBriefData(null);
    setPipelineStatus('idle');

    try {
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefType: briefType.id,
          operatorId: primaryRole,
          primaryRole,
          rawInput: input,
          reflections: reflectionsRequired ? reflections : undefined,
          leadState,
          reEngagementTrigger: isColdLead ? reEngagementTrigger : undefined,
          upstreamBriefs: upstreamPicks
            .filter((p): p is UpstreamJsonPick => p.kind === 'json')
            .map(p => ({
              briefType: p.briefType,
              brief: p.brief,
            })),
          upstreamText: upstreamPicks
            .filter((p): p is UpstreamTextPick => p.kind === 'text')
            .map(p => `### ${p.filename}\n${p.text}`)
            .join('\n\n---\n\n') || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate brief');

      const responseData = await res.json();
      const data: BriefSchema = responseData.brief;
      setBriefData(data);
      saveToPipeline(data);
    } catch {
      setError('Failed to generate brief. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPipeline = () => {
    if (briefData) saveToPipeline(briefData);
  };

  return (
    <div>
      <div className={`glass-panel p-6 space-y-5 ${loading ? 'animate-pulse' : ''}`}>
        {/* Raw input form */}
        {isIntake ? (
          <IntakeForm onInputChange={handleFormChange} disabled={loading} />
        ) : isDiscovery ? (
          <DiscoveryForm onInputChange={handleFormChange} disabled={loading} />
        ) : isProduction ? (
          <ProductionForm onInputChange={handleFormChange} disabled={loading} />
        ) : isPostProduction ? (
          <PostProductionForm onInputChange={handleFormChange} disabled={loading} />
        ) : isWrapRetention ? (
          <WrapRetentionForm onInputChange={handleFormChange} disabled={loading} />
        ) : isArchive ? (
          <ArchiveForm onInputChange={handleFormChange} disabled={loading} />
        ) : (
          <textarea
            className="glass-input w-full min-h-[200px] p-4 text-sm resize-y"
            placeholder={briefType.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
        )}

        {/* Lead state */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter/70">
              Lead State
            </label>
            <select
              className="glass-input w-full px-3 py-2.5 text-sm appearance-none"
              value={leadState}
              onChange={(e) => setLeadState(e.target.value as LeadState)}
              disabled={loading}
            >
              {LEAD_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {isColdLead && (
            <div
              className="flex flex-col gap-2"
              style={{ animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
            >
              <label className="text-[10px] uppercase tracking-[0.15em] text-fmc-copper/70">
                Re-engagement trigger
              </label>
              <input
                type="text"
                className="glass-input w-full px-3 py-2.5 text-sm"
                value={reEngagementTrigger}
                onChange={(e) => setReEngagementTrigger(e.target.value)}
                placeholder="What would revive this?"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Reflections (required for non-intake) */}
        {reflectionsRequired && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter/70">
                Reflections <span className="text-fmc-firestarter">*</span>
              </label>
              <VoiceMic onTranscript={appendReflection} disabled={loading} />
            </div>
            <textarea
              className="glass-input w-full min-h-[120px] p-3 text-sm resize-y"
              placeholder="Your strategic read. Why this wins, what's changed, what the raw notes don't say."
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              disabled={loading}
            />
            {reflectionsMissing && (
              <span className="text-[11px] text-fmc-firestarter/80">
                Reflections required for every non-intake brief.
              </span>
            )}
          </div>
        )}

        {/* Upstream brief picker */}
        {offersUpstream && (
          <div className="glass-panel p-4 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter/70">
                Upstream briefs
              </span>
              <div
                className="inline-flex rounded-full p-0.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {(['upload', 'drive'] as const).map(m => {
                  const active = pickerMode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPickerMode(m)}
                      className="px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-medium rounded-full active:scale-[0.97]"
                      style={{
                        background: active ? 'rgba(224,52,19,0.2)' : 'transparent',
                        color: active ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      {m === 'upload' ? 'Upload file' : 'Pick from Drive'}
                    </button>
                  );
                })}
              </div>
            </div>

            {pickerMode === 'upload' ? (
              <div>
                <label
                  className="block w-full rounded-lg cursor-pointer px-3 py-6 text-center text-xs text-white/50 active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <input
                    type="file"
                    accept=".json,application/json,.md,text/markdown,.txt,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) pickFromUpload(file);
                      e.target.value = '';
                    }}
                    disabled={loading}
                  />
                  Drop a .json / .md / .txt file here, or click to browse.
                </label>
                {uploadError && (
                  <p className="text-[11px] text-fmc-firestarter/80 mt-2">{uploadError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="glass-input flex-1 px-3 py-2 text-sm"
                    value={driveCompany}
                    onChange={(e) => setDriveCompany(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchDrive())}
                    placeholder="Company name"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={searchDrive}
                    disabled={loading || !driveCompany.trim() || driveLoading}
                    className="btn-ghost px-3 py-2 text-[11px] active:scale-[0.97] disabled:opacity-40"
                  >
                    {driveLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {driveFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {driveFiles
                      .filter(f => /\.json$/i.test(f.name))
                      .map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => pickFromDrive(f)}
                          disabled={loading}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left active:scale-[0.97]"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(224,52,19,0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          }}
                        >
                          <span className="text-xs text-fmc-offwhite truncate">{f.name}</span>
                          <span className="text-[10px] text-white/30 flex-shrink-0">
                            {new Date(f.createdTime).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
                {driveFiles.length === 0 && driveCompany.trim() && !driveLoading && (
                  <p className="text-[11px] text-white/40 italic">
                    No sidecars found in Drive for this company. Try &ldquo;Upload file&rdquo; instead.
                  </p>
                )}
              </div>
            )}

            {/* Picked upstream list */}
            {upstreamPicks.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {upstreamPicks.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                    style={{
                      background: 'rgba(73,121,123,0.08)',
                      border: '1px solid rgba(73,121,123,0.2)',
                    }}
                  >
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-teal flex-shrink-0">
                        {p.kind === 'json' ? `Inherited \u00B7 ${p.briefType}` : 'Attached text'}
                      </span>
                      <span className="text-xs text-fmc-offwhite truncate">
                        {p.kind === 'json'
                          ? (p.brief.projectName || p.sourceLabel)
                          : `${p.filename} (${p.text.length.toLocaleString()} chars)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUpstream(i)}
                      className="text-white/40 hover:text-fmc-firestarter text-sm leading-none active:scale-[0.97] flex-shrink-0"
                      style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      aria-label="Remove upstream"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {reflectionsMissing ? (
            <span className="text-[11px] text-white/40 italic">Reflections required</span>
          ) : (
            <span />
          )}
          <button
            className="btn-firestarter px-6 py-3 text-sm flex items-center gap-2 disabled:opacity-50"
            onClick={handleGenerate}
            disabled={!canGenerate}
            title={reflectionsMissing ? 'Reflections required' : undefined}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Brief'
            )}
          </button>
        </div>
      </div>

      {briefData && (
        <>
          <BriefOutput
            data={briefData}
            brandId="fmc"
            brandName="FMC Studios"
            brandTagline="Ferguson Media Collective"
            accentColor="#E03413"
            briefTypeName={briefType.name}
            sctMode={briefType.sctMode}
          />

          <div className="mt-3 flex items-center justify-end">
            {pipelineStatus === 'saving' && (
              <span className="text-xs text-white/40 flex items-center gap-1.5 animate-fadeUp">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving to Pipeline...
              </span>
            )}
            {pipelineStatus === 'saved' && (
              <span className="text-xs text-fmc-teal flex items-center gap-1.5 animate-fadeUp">
                <span>{'\u2713'}</span> Saved to Pipeline
              </span>
            )}
            {pipelineStatus === 'failed' && (
              <button
                onClick={handleRetryPipeline}
                className="text-xs text-white/40 flex items-center gap-1.5 animate-fadeUp hover:text-white/60"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Pipeline sync failed — retry
              </button>
            )}
          </div>
        </>
      )}
      {error && <Toast message={error} onClose={() => setError(null)} />}
    </div>
  );
}

function guessBriefTypeFromFilename(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('lead-intake') || lower.includes('intake')) return 'lead-intake';
  if (lower.includes('discovery')) return 'discovery';
  if (lower.includes('pitch')) return 'pitch';
  if (lower.includes('post-production') || lower.includes('post_production')) return 'post-production';
  if (lower.includes('wrap') || lower.includes('retention')) return 'wrap-retention';
  if (lower.includes('archive')) return 'archive';
  if (lower.includes('production')) return 'production';
  return 'discovery';
}
