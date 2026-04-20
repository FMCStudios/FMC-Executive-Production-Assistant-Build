'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { useProfileModal } from '@/context/ProfileModalContext';
import Toast from '@/components/ui/Toast';
import SkillsPicker from '@/components/SkillsPicker';

type RosterType = 'owner' | 'team' | 'freelance';

type CrewApi = {
  firstName: string;
  lastName: string;
  aka: string;
  primaryRole: string;
  otherRoles: string[];
  email: string;
  phone: string;
  shootingRate: string;
  editingRate: string;
  producingRate: string;
  otherRate: string;
  otherRateLabel: string;
  notes: string;
  skills: string[];
  accessLevel: string;
  rosterType?: RosterType;
  displayName: string;
  fullName: string;
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  aka: string;
  primaryRole: string;
  otherRoles: string;
  email: string;
  phone: string;
  shootingRate: string;
  editingRate: string;
  producingRate: string;
  otherRate: string;
  otherRateLabel: string;
  notes: string;
  skills: string;
};

type TeamRow = {
  email: string;
  name: string;
  rosterType: RosterType;
  assignableRoles: string[];
};

const ROLES = ['DP', 'Camera Op', 'Gaffer', 'Sound Mixer', 'Editor', 'Colourist', 'Producer', 'Production Assistant', 'BTS', 'Other'];
const ASSIGNABLE_ROLES = ['Producer', 'Supervising Producer', 'Post Supervisor', 'DP', 'Camera Op', 'Gaffer', 'Sound Mixer', 'Editor', 'Colourist', 'Production Assistant', 'BTS', 'Other'];
const ROSTER_TYPES: RosterType[] = ['owner', 'team', 'freelance'];

const emptyProfile: ProfileForm = {
  firstName: '', lastName: '', aka: '', primaryRole: '', otherRoles: '',
  email: '', phone: '', shootingRate: '', editingRate: '', producingRate: '',
  otherRate: '', otherRateLabel: '', notes: '', skills: '',
};

export default function ProfileModal() {
  const { isOpen, close } = useProfileModal();
  const { user } = useSession();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [profileInitial, setProfileInitial] = useState<ProfileForm>(emptyProfile);

  const [teamRows, setTeamRows] = useState<TeamRow[]>([]);
  const [teamInitial, setTeamInitial] = useState<TeamRow[]>([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [discardPrompt, setDiscardPrompt] = useState(false);

  const isAdmin = user?.accessLevel === 'Admin';

  // Fetch crew roster and prefill
  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setDiscardPrompt(false);
    fetch('/api/crew')
      .then(r => r.json())
      .then((d: { crew?: CrewApi[] }) => {
        const crew = d.crew || [];
        const me = crew.find(c => c.email.toLowerCase() === user.email.toLowerCase());
        const myProfile: ProfileForm = me ? {
          firstName: me.firstName, lastName: me.lastName, aka: me.aka,
          primaryRole: me.primaryRole, otherRoles: me.otherRoles?.join(', ') || '',
          email: me.email, phone: me.phone,
          shootingRate: me.shootingRate, editingRate: me.editingRate,
          producingRate: me.producingRate, otherRate: me.otherRate,
          otherRateLabel: me.otherRateLabel, notes: me.notes || '',
          skills: me.skills?.join(', ') || '',
        } : emptyProfile;
        setProfile(myProfile);
        setProfileInitial(myProfile);

        if (user.accessLevel === 'Admin') {
          const rows: TeamRow[] = crew.map(c => ({
            email: c.email,
            name: c.displayName || c.fullName,
            rosterType: c.rosterType || 'team',
            assignableRoles: c.otherRoles || [],
          }));
          setTeamRows(rows);
          setTeamInitial(rows.map(r => ({ ...r, assignableRoles: [...r.assignableRoles] })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profile, profileInitial, teamRows, teamInitial]);

  const hasProfileChanges = useMemo(() => {
    return (Object.keys(profile) as (keyof ProfileForm)[]).some(k => profile[k] !== profileInitial[k]);
  }, [profile, profileInitial]);

  const changedTeamRows = useMemo(() => {
    return teamRows.filter(row => {
      const base = teamInitial.find(b => b.email === row.email);
      if (!base) return false;
      if (base.rosterType !== row.rosterType) return true;
      const a = [...base.assignableRoles].sort().join('|');
      const b = [...row.assignableRoles].sort().join('|');
      return a !== b;
    });
  }, [teamRows, teamInitial]);

  const hasAnyChanges = hasProfileChanges || changedTeamRows.length > 0;

  const setField = (k: keyof ProfileForm, v: string) => setProfile(p => ({ ...p, [k]: v }));

  const updateTeamRow = (email: string, patch: Partial<TeamRow>) => {
    setTeamRows(rows => rows.map(r => r.email === email ? { ...r, ...patch } : r));
  };

  const toggleAssignable = (email: string, role: string) => {
    setTeamRows(rows => rows.map(r => {
      if (r.email !== email) return r;
      const has = r.assignableRoles.includes(role);
      return {
        ...r,
        assignableRoles: has
          ? r.assignableRoles.filter(x => x !== role)
          : [...r.assignableRoles, role],
      };
    }));
  };

  const handleClose = () => {
    if (hasAnyChanges) {
      setDiscardPrompt(true);
      return;
    }
    close();
  };

  const confirmDiscard = () => {
    setProfile(profileInitial);
    setTeamRows(teamInitial.map(r => ({ ...r, assignableRoles: [...r.assignableRoles] })));
    setDiscardPrompt(false);
    close();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let changedFields = 0;
      if (hasProfileChanges) {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile }),
        });
        const data = await res.json().catch(() => ({}));
        if (typeof data?.changes === 'number') changedFields += data.changes;
      }

      if (changedTeamRows.length > 0) {
        await Promise.all(changedTeamRows.map(row =>
          fetch('/api/roster/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: row.email,
              rosterType: row.rosterType,
              otherRoles: row.assignableRoles.join(', '),
            }),
          })
        ));
        changedFields += changedTeamRows.length;
      }

      if (changedFields > 0) {
        setToast(`${changedFields} field${changedFields === 1 ? '' : 's'} updated.`);
      } else {
        setToast('No changes to save.');
      }
      close();
    } catch {
      setToast('Save failed. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null;
  }

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[100]"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'fmcBackdropFade 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none px-6">
        <div
          className="glass-modal pointer-events-auto max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            animation: 'fmcFadeScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-1">Profile</h1>
                <p className="text-sm text-white/40">Update your info, rates, and skills.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-white/40 hover:text-white/80 text-xl leading-none active:scale-[0.97]"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-white/40 animate-pulse py-12 text-center">Loading profile...</div>
            ) : (
              <div className="space-y-6">
                {/* ZONE 1: Your Profile */}
                <div className="glass-panel p-6">
                  <h2 className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 mb-4">About You</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">First Name</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.firstName} onChange={e => setField('firstName', e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Last Name</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.lastName} onChange={e => setField('lastName', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-white/40">AKA / Nickname</label>
                      <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.aka} onChange={e => setField('aka', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Primary Role</label>
                        <select className="glass-input w-full px-3 py-2.5 text-sm appearance-none" value={profile.primaryRole} onChange={e => setField('primaryRole', e.target.value)}>
                          <option value="">Select...</option>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Other Roles</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.otherRoles} onChange={e => setField('otherRoles', e.target.value)} placeholder="Comma-separated" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Email</label>
                        <input type="email" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.email} onChange={e => setField('email', e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Phone</label>
                        <input type="tel" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.phone} onChange={e => setField('phone', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-white/40">Skills</label>
                      <SkillsPicker
                        value={profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : []}
                        onChange={(arr) => setField('skills', arr.join(', '))}
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h2 className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 mb-4">Day Rates</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Shooting</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.shootingRate} onChange={e => setField('shootingRate', e.target.value)} placeholder="$" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Editing</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.editingRate} onChange={e => setField('editingRate', e.target.value)} placeholder="$" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Producing</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.producingRate} onChange={e => setField('producingRate', e.target.value)} placeholder="$" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-white/40">Other</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.otherRate} onChange={e => setField('otherRate', e.target.value)} placeholder="$" />
                      </div>
                    </div>
                    {profile.otherRate && (
                      <div className="flex flex-col gap-2" style={{ animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                        <label className="text-xs text-white/40">Other Rate Label</label>
                        <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.otherRateLabel} onChange={e => setField('otherRateLabel', e.target.value)} placeholder="e.g. Drone Op" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ZONE 2: Team Roles (admin only) */}
                {isAdmin && (
                  <div className="glass-panel p-6">
                    <h2 className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 mb-4">Team Roles</h2>
                    <p className="text-[11px] text-white/40 mb-4">Set each member&apos;s roster type and assignable roles.</p>
                    <div className="space-y-3">
                      {teamRows.map(row => (
                        <TeamRowBlock
                          key={row.email}
                          row={row}
                          onType={(t) => updateTeamRow(row.email, { rosterType: t })}
                          onToggleRole={(r) => toggleAssignable(row.email, r)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 mt-6 pt-4 flex items-center justify-end gap-3"
              style={{
                background: 'linear-gradient(to top, rgba(13,13,13,0.8), transparent)',
              }}
            >
              {discardPrompt ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/60">Discard changes?</span>
                  <button type="button" onClick={confirmDiscard} className="btn-ghost px-4 py-2 text-xs active:scale-[0.97]">Discard</button>
                  <button type="button" onClick={() => setDiscardPrompt(false)} className="btn-firestarter px-4 py-2 text-xs active:scale-[0.97]">Keep editing</button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={handleClose} className="btn-ghost px-5 py-2.5 text-xs active:scale-[0.97]">Close</button>
                  <button type="button" onClick={handleSave} disabled={saving || loading} className="btn-firestarter px-5 py-2.5 text-xs active:scale-[0.97] disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save & Close'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <style jsx global>{`
        @keyframes fmcFadeScale {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fmcBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function TeamRowBlock({
  row,
  onType,
  onToggleRole,
}: {
  row: TeamRow;
  onType: (t: RosterType) => void;
  onToggleRole: (r: string) => void;
}) {
  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fmc-offwhite truncate">{row.name}</span>
        <span className="text-[11px] text-white/40 truncate">{row.email}</span>
      </div>

      <div
        className="inline-flex rounded-full p-0.5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {ROSTER_TYPES.map(t => {
          const active = row.rosterType === t;
          return (
            <button
              type="button"
              key={t}
              onClick={() => onType(t)}
              className="px-3 py-1 text-[11px] uppercase tracking-[0.15em] font-medium rounded-full active:scale-[0.97]"
              style={{
                background: active ? 'rgba(224,52,19,0.2)' : 'transparent',
                color: active ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ASSIGNABLE_ROLES.map(r => {
          const selected = row.assignableRoles.includes(r);
          return (
            <button
              type="button"
              key={r}
              onClick={() => onToggleRole(r)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium active:scale-[0.97]"
              style={{
                background: selected ? 'rgba(224,52,19,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected ? 'rgba(224,52,19,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: selected ? '#F0EBE1' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
