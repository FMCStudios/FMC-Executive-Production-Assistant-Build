'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useSession } from '@/context/SessionContext';
import Toast from '@/components/ui/Toast';

export default function ProfilePage() {
  const { user, loading } = useSession();
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', aka: '', primaryRole: '', otherRoles: '',
    email: '', phone: '', shootingRate: '', editingRate: '', producingRate: '',
    otherRate: '', otherRateLabel: '', notes: '', skills: '',
  });
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/crew')
      .then(r => r.json())
      .then(d => {
        const me = (d.crew || []).find((c: { email: string }) => c.email.toLowerCase() === user.email.toLowerCase());
        if (me) {
          setProfile({
            firstName: me.firstName, lastName: me.lastName, aka: me.aka,
            primaryRole: me.primaryRole, otherRoles: me.otherRoles?.join(', ') || '',
            email: me.email, phone: me.phone,
            shootingRate: me.shootingRate, editingRate: me.editingRate,
            producingRate: me.producingRate, otherRate: me.otherRate,
            otherRateLabel: me.otherRateLabel, notes: me.notes,
            skills: me.skills?.join(', ') || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const set = (key: string, val: string) => setProfile(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(data.changes > 0 ? 'Profile updated.' : 'No changes detected.');
      } else {
        setToast(data.error || 'Failed to save.');
      }
    } catch {
      setToast('Failed to save. Check your connection.');
    }
    setSaving(false);
  };

  if (loading || fetching) return (
    <div className="min-h-screen"><Header /><main className="max-w-2xl mx-auto px-6 pt-28"><div className="text-sm text-white/40 animate-pulse">Loading profile...</div></main></div>
  );

  const ROLES = ['DP', 'Camera Op', 'Gaffer', 'Sound Mixer', 'Editor', 'Colourist', 'Producer', 'Production Assistant', 'BTS', 'Other'];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-1">Profile</h1>
            <p className="text-sm text-white/40">Update your info, rates, and skills.</p>
          </div>

          {/* About */}
          <div className="glass-panel p-6 mb-6">
            <h2 className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 mb-4">About You</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">First Name</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.firstName} onChange={e => set('firstName', e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Last Name</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/40">AKA / Nickname</label>
                <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.aka} onChange={e => set('aka', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Primary Role</label>
                  <select className="glass-input w-full px-3 py-2.5 text-sm appearance-none" value={profile.primaryRole} onChange={e => set('primaryRole', e.target.value)}>
                    <option value="">Select...</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Other Roles</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.otherRoles} onChange={e => set('otherRoles', e.target.value)} placeholder="Comma-separated" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Email</label>
                  <input type="email" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Phone</label>
                  <input type="tel" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/40">Skills</label>
                <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.skills} onChange={e => set('skills', e.target.value)} placeholder="Sound Design, MGFX, Colour, etc." />
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="glass-panel p-6 mb-6">
            <h2 className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 mb-4">Day Rates</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Shooting</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.shootingRate} onChange={e => set('shootingRate', e.target.value)} placeholder="$" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Editing</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.editingRate} onChange={e => set('editingRate', e.target.value)} placeholder="$" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Producing</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.producingRate} onChange={e => set('producingRate', e.target.value)} placeholder="$" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40">Other</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.otherRate} onChange={e => set('otherRate', e.target.value)} placeholder="$" />
                </div>
              </div>
              {profile.otherRate && (
                <div className="flex flex-col gap-2" style={{ animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                  <label className="text-xs text-white/40">Other Rate Label</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={profile.otherRateLabel} onChange={e => set('otherRateLabel', e.target.value)} placeholder="e.g. Drone Op" />
                </div>
              )}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-firestarter w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
            {saving ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
