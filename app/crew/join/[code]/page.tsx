'use client';

import { useState } from 'react';
import Image from 'next/image';

type GearRow = {
  itemName: string;
  brand: string;
  category: string;
  rentalRate: string;
  condition: string;
  serialNumber: string;
};

const EMPTY_GEAR: GearRow = { itemName: '', brand: '', category: '', rentalRate: '', condition: '', serialNumber: '' };

const ROLE_OPTIONS = ['DP', 'Camera Op', 'Gaffer', 'Sound Mixer', 'Editor', 'Colourist', 'Producer', 'Production Assistant', 'BTS', 'Other'];
const GEAR_CATEGORIES = ['Camera', 'Lens', 'Audio', 'Lighting', 'Grip', 'Media', 'Power', 'Monitor', 'Special'];
const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair'];

export default function CrewJoinPage({ params }: { params: { code: string } }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [aka, setAka] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [otherRoles, setOtherRoles] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shootingRate, setShootingRate] = useState('');
  const [editingRate, setEditingRate] = useState('');
  const [producingRate, setProducingRate] = useState('');
  const [otherRate, setOtherRate] = useState('');
  const [otherRateLabel, setOtherRateLabel] = useState('');
  const [gearRows, setGearRows] = useState<GearRow[]>([{ ...EMPTY_GEAR }]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addGearRow = () => setGearRows((prev) => [...prev, { ...EMPTY_GEAR }]);

  const updateGear = (i: number, key: keyof GearRow, value: string) => {
    setGearRows((prev) => prev.map((row, idx) => idx === i ? { ...row, [key]: value } : row));
  };

  const removeGear = (i: number) => {
    setGearRows((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name, and email are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/crew/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: params.code,
          crew: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            aka: aka.trim(),
            primaryRole,
            otherRoles: otherRoles.trim(),
            email: email.trim(),
            phone: phone.trim(),
            shootingRate: shootingRate.trim(),
            editingRate: editingRate.trim(),
            producingRate: producingRate.trim(),
            otherRate: otherRate.trim(),
            otherRateLabel: otherRateLabel.trim(),
          },
          gear: gearRows.filter((g) => g.itemName.trim()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError('This link has expired or is invalid. Contact your producer.');
        } else {
          setError(data.error || 'Something went wrong.');
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Failed to submit. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Invalid/expired code — show after first submit attempt returns 403, or we can
  // just show the form and validate server-side on submit

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center animate-fadeUp">
          <Image src="/logos/fmc-cube.png" alt="FMC" width={48} height={48} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-3">
            You&rsquo;re in.
          </h1>
          <p className="text-sm text-white/50">We&rsquo;ll be in touch.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        <div className="stagger">
          {/* Header */}
          <div className="text-center mb-12">
            <Image src="/logos/fmc-cube.png" alt="FMC" width={40} height={40} className="mx-auto mb-5" />
            <h1 className="text-3xl font-bold tracking-tight text-fmc-offwhite mb-3">
              Welcome to the Collective.
            </h1>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              Fill out your profile so we can pull you onto projects faster. Add your rates, your gear, and how to reach you.
            </p>
          </div>

          {/* Section 1: About You */}
          <div className="glass-panel p-6 mb-6">
            <h2 className="text-sm font-semibold text-fmc-offwhite mb-5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(224,52,19,0.15)', color: '#E03413', border: '1px solid rgba(224,52,19,0.3)' }}>1</span>
              About You
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">First Name *</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Last Name *</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">
                  AKA / Nickname <span className="normal-case tracking-normal text-white/20">(optional)</span>
                </label>
                <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={aka} onChange={(e) => setAka(e.target.value)} placeholder="What the crew calls you" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Primary Role</label>
                  <select className="glass-input w-full px-3 py-2.5 text-sm appearance-none" value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)}>
                    <option value="">Select...</option>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">
                    Other Roles <span className="normal-case tracking-normal text-white/20">(comma)</span>
                  </label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={otherRoles} onChange={(e) => setOtherRoles(e.target.value)} placeholder="e.g. Editor, BTS" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Email *</label>
                  <input type="email" className="glass-input w-full px-3 py-2.5 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70">Phone</label>
                  <input type="tel" className="glass-input w-full px-3 py-2.5 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Your Rates */}
          <div className="glass-panel p-6 mb-6">
            <h2 className="text-sm font-semibold text-fmc-offwhite mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(224,52,19,0.15)', color: '#E03413', border: '1px solid rgba(224,52,19,0.3)' }}>2</span>
              Your Rates
            </h2>
            <p className="text-xs text-white/30 mb-5 ml-7">Day rates only. Leave blank if it doesn&rsquo;t apply to you.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40 font-medium">Shooting Day Rate</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={shootingRate} onChange={(e) => setShootingRate(e.target.value)} placeholder="$" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40 font-medium">Editing Day Rate</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={editingRate} onChange={(e) => setEditingRate(e.target.value)} placeholder="$" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40 font-medium">Producing Day Rate</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={producingRate} onChange={(e) => setProducingRate(e.target.value)} placeholder="$" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/40 font-medium">Other Day Rate</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={otherRate} onChange={(e) => setOtherRate(e.target.value)} placeholder="$" />
                </div>
              </div>
              {otherRate && (
                <div className="flex flex-col gap-2" style={{ animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                  <label className="text-xs text-white/40 font-medium">Other Rate Label</label>
                  <input type="text" className="glass-input w-full px-3 py-2.5 text-sm" value={otherRateLabel} onChange={(e) => setOtherRateLabel(e.target.value)} placeholder="e.g. Drone Op, Colour Grade" />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Your Gear */}
          <div className="glass-panel p-6 mb-6">
            <h2 className="text-sm font-semibold text-fmc-offwhite mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(224,52,19,0.15)', color: '#E03413', border: '1px solid rgba(224,52,19,0.3)' }}>3</span>
              Your Gear
            </h2>
            <p className="text-xs text-white/30 mb-5 ml-7">What do you own that you bring to shoots? We&rsquo;ll track it so we can build accurate gear lists and kit fees.</p>

            <div className="space-y-4">
              {gearRows.map((row, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">Item {i + 1}</span>
                    {gearRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGear(i)}
                        className="text-[10px] text-white/20 hover:text-fmc-firestarter/60 active:scale-[0.97]"
                        style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/30">Item Name</label>
                      <input type="text" className="glass-input w-full px-2.5 py-2 text-xs" value={row.itemName} onChange={(e) => updateGear(i, 'itemName', e.target.value)} placeholder="e.g. Sony FX6" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/30">Brand</label>
                      <input type="text" className="glass-input w-full px-2.5 py-2 text-xs" value={row.brand} onChange={(e) => updateGear(i, 'brand', e.target.value)} placeholder="e.g. Sony" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/30">Category</label>
                      <select className="glass-input w-full px-2.5 py-2 text-xs appearance-none" value={row.category} onChange={(e) => updateGear(i, 'category', e.target.value)}>
                        <option value="">Select...</option>
                        {GEAR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/30">Rental Rate/day</label>
                      <input type="text" className="glass-input w-full px-2.5 py-2 text-xs" value={row.rentalRate} onChange={(e) => updateGear(i, 'rentalRate', e.target.value)} placeholder="$" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/30">Condition</label>
                      <select className="glass-input w-full px-2.5 py-2 text-xs appearance-none" value={row.condition} onChange={(e) => updateGear(i, 'condition', e.target.value)}>
                        <option value="">Select...</option>
                        {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/30">
                      Serial Number <span className="text-white/15">(optional)</span>
                    </label>
                    <input type="text" className="glass-input w-full px-2.5 py-2 text-xs" value={row.serialNumber} onChange={(e) => updateGear(i, 'serialNumber', e.target.value)} placeholder="S/N" />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addGearRow}
                className="btn-ghost w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Gear
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="glass-panel p-4 mb-4 text-sm text-fmc-firestarter/80 animate-fadeUp"
              style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-firestarter w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Joining...
              </>
            ) : (
              'Join the Roster'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
