'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useSession } from '@/context/SessionContext';
import type { CrewMember } from '@/lib/crew';
import type { GearItem } from '@/lib/gear';

export default function CrewPage() {
  const { user } = useSession();
  const canSeeRates = user?.accessLevel === 'Admin' || user?.accessLevel === 'Supervisor';
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/crew').then((r) => r.json()),
      fetch('/api/gear').then((r) => r.json()),
    ])
      .then(([crewData, gearData]) => {
        if (crewData.crew) setCrew(crewData.crew);
        else setError(crewData.error || 'Failed to load roster');
        if (gearData.gear) setGear(gearData.gear);
      })
      .catch(() => setError('Failed to fetch data'))
      .finally(() => setLoading(false));
  }, []);

  // Build gear-by-owner lookup (match "First Last")
  const gearByOwner = new Map<string, GearItem[]>();
  for (const item of gear) {
    const owner = item.owner.toLowerCase();
    if (!gearByOwner.has(owner)) gearByOwner.set(owner, []);
    gearByOwner.get(owner)!.push(item);
  }

  const houseGear = gearByOwner.get('fmc house') || gearByOwner.get('fmc') || gearByOwner.get('house') || [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <div className="stagger">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-2">
              Crew &amp; Gear
            </h1>
            <p className="text-sm text-white/50">
              Managed in Google Sheets — read-only view.
            </p>
          </div>

          {loading && (
            <div className="text-sm text-white/40 animate-pulse">Loading roster...</div>
          )}

          {error && (
            <div
              className="glass-panel p-5 text-sm text-fmc-firestarter/80"
              style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
            >
              {error}
            </div>
          )}

          {!loading && !error && crew.length === 0 && (
            <div className="glass-panel p-5 text-sm text-white/50">
              No crew members found. Add rows to the &ldquo;Roster&rdquo; tab in Google Sheets.
            </div>
          )}

          {crew.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crew.map((member, i) => {
                const memberGear = gearByOwner.get(member.fullName.toLowerCase()) || [];
                const gearByCategory = new Map<string, GearItem[]>();
                for (const g of memberGear) {
                  const cat = g.category || 'Other';
                  if (!gearByCategory.has(cat)) gearByCategory.set(cat, []);
                  gearByCategory.get(cat)!.push(g);
                }

                const rates: string[] = [];
                if (member.shootingRate) rates.push(`Shoot $${member.shootingRate}`);
                if (member.editingRate) rates.push(`Edit $${member.editingRate}`);
                if (member.producingRate) rates.push(`Produce $${member.producingRate}`);
                if (member.otherRate) rates.push(`${member.otherRateLabel || 'Other'} $${member.otherRate}`);

                return (
                  <div
                    key={i}
                    className="glass-panel p-5 opacity-0 animate-fadeUp"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: 'rgba(224,52,19,0.15)',
                          color: '#E03413',
                          border: '1px solid rgba(224,52,19,0.3)',
                        }}
                      >
                        {member.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-fmc-offwhite block">
                          {member.displayName}
                        </span>
                        {member.displayName !== member.fullName && (
                          <span className="text-[10px] text-white/30 block">{member.lastName}</span>
                        )}
                        <span className="text-xs text-fmc-copper">{member.primaryRole}</span>
                      </div>
                    </div>

                    {/* Other roles */}
                    {member.otherRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {member.otherRoles.map((r, ri) => (
                          <span
                            key={ri}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(73,121,123,0.1)',
                              border: '1px solid rgba(73,121,123,0.2)',
                              color: 'rgba(73,121,123,0.7)',
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rates (supervisors + admins only) */}
                    {canSeeRates && rates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {rates.map((r, ri) => (
                          <span key={ri} className="text-[10px] text-fmc-firestarter/60">{r}</span>
                        ))}
                      </div>
                    )}

                    {/* Gear by category */}
                    {memberGear.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-1.5">Gear</span>
                        {Array.from(gearByCategory.entries()).map(([cat, items]) => (
                          <div key={cat} className="mb-1.5 last:mb-0">
                            <span className="text-[9px] uppercase tracking-[0.15em] text-fmc-copper/50">{cat}</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {items.map((g, gi) => (
                                <span
                                  key={gi}
                                  className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.5)',
                                  }}
                                >
                                  {g.brand && <span className="text-white/30">{g.brand} </span>}
                                  {g.itemName}
                                  {canSeeRates && g.rentalRate && <span className="text-fmc-firestarter/40 ml-1">${g.rentalRate}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {member.notes && (
                      <p className="text-xs text-white/30 mt-2 italic">{member.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* House gear */}
          {houseGear.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-fmc-offwhite mb-4">FMC House Gear</h2>
              <div className="glass-panel p-5">
                {Array.from(new Set(houseGear.map(g => g.category || 'Other'))).map((cat) => (
                  <div key={cat} className="mb-4 last:mb-0">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-fmc-firestarter/60 block mb-2">{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {houseGear.filter(g => (g.category || 'Other') === cat).map((g, gi) => (
                        <span
                          key={gi}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)',
                          }}
                          title={[g.serialNumber && `S/N: ${g.serialNumber}`, g.condition, g.notes].filter(Boolean).join(' — ')}
                        >
                          {g.brand && <span className="text-white/30">{g.brand} </span>}
                          {g.itemName}
                          {canSeeRates && g.rentalRate && <span className="text-fmc-copper/50 ml-1">${g.rentalRate}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
