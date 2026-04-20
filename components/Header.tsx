'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useProfileModal } from '@/context/ProfileModalContext';

type NavItem = {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: (pathname: string) => boolean;
  divider?: boolean;
};

export default function Header({ briefTypeName }: { briefTypeName?: string }) {
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const profileModal = useProfileModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const items: NavItem[] = [];
  items.push({ key: 'home', label: 'Home', href: '/', isActive: (p) => p === '/' });
  items.push({ key: 'briefs', label: 'My Briefs', href: '/dashboard', isActive: (p) => p.startsWith('/dashboard') });
  if (user) {
    items.push({
      key: 'crew',
      label: 'Crew & Gear',
      href: '/crew',
      isActive: (p) => p.startsWith('/crew') && !p.startsWith('/crew/join'),
    });
  }

  const trigger = (item: NavItem) => {
    if (item.href) router.push(item.href);
    else item.onClick?.();
    setMobileOpen(false);
  };

  const showNav = !briefTypeName;

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logos/fmc-cube.png"
            alt="FMC"
            width={28}
            height={28}
            style={{
              filter: 'drop-shadow(0 0 0px rgba(224,52,19,0))',
              transition: 'filter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 8px rgba(224,52,19,0.3))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.filter = 'drop-shadow(0 0 0px rgba(224,52,19,0))'; }}
          />
          <span className="text-xs tracking-[0.15em] uppercase text-white/40 font-medium">EPA</span>
        </Link>

        {/* Center slot */}
        {briefTypeName ? (
          <span className="label-upper text-white/40">{briefTypeName}</span>
        ) : user ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {items.map((item) => {
                const active = item.isActive?.(pathname) ?? false;
                return <NavPill key={item.key} item={item} active={active} onTrigger={trigger} />;
              })}
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Open navigation"
              className="sm:hidden p-2 rounded-lg text-white/60 hover:text-white/90 active:scale-[0.97]"
              style={{ transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => profileModal.open()}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/70 active:scale-[0.97]"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: 'rgba(224,52,19,0.15)', color: '#E03413', border: '1px solid rgba(224,52,19,0.3)' }}>
                  {user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                {user.displayName}
              </button>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: user.accessLevel === 'Admin' ? 'rgba(224,52,19,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${user.accessLevel === 'Admin' ? 'rgba(224,52,19,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: user.accessLevel === 'Admin' ? '#E03413' : 'rgba(255,255,255,0.3)',
                }}
              >
                {user.accessLevel}
              </span>
              <button
                onClick={handleLogout}
                className="text-[10px] text-white/25 hover:text-white/50 active:scale-[0.97]"
                style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {showNav && user && mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 sm:hidden"
            style={{ zIndex: 40, background: 'transparent' }}
          />
          <div
            className="sm:hidden absolute left-4 right-4 overflow-hidden"
            style={{
              top: '3.5rem',
              zIndex: 60,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              animation: 'fmcNavDrop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            {items.map((item) => {
              const active = item.isActive?.(pathname) ?? false;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => trigger(item)}
                  className="w-full flex items-center gap-2 p-3 text-sm text-left active:scale-[0.97] relative"
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: active ? '#F0EBE1' : 'rgba(255,255,255,0.7)',
                    borderTop: item.divider ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {active && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        bottom: '20%',
                        width: '3px',
                        background: '#E03413',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                  <span className="pl-2">{item.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes fmcNavDrop {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}

function NavPill({
  item,
  active,
  onTrigger,
}: {
  item: NavItem;
  active: boolean;
  onTrigger: (item: NavItem) => void;
}) {
  const baseBg = active ? 'rgba(255,255,255,0.06)' : 'transparent';
  const baseColor = active ? '#F0EBE1' : 'rgba(255,255,255,0.5)';
  const baseBorder = active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent';
  const baseShadow = active ? '0 0 16px rgba(224,52,19,0.12)' : 'none';

  return (
    <button
      type="button"
      onClick={() => onTrigger(item)}
      className="relative text-xs font-medium tracking-wide rounded-full px-3 py-1.5 active:scale-[0.97]"
      style={{
        background: baseBg,
        color: baseColor,
        border: baseBorder,
        boxShadow: baseShadow,
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
        e.currentTarget.style.boxShadow = '0 0 16px rgba(224,52,19,0.08)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = baseBg;
        e.currentTarget.style.color = baseColor;
        e.currentTarget.style.boxShadow = baseShadow;
      }}
    >
      {item.label}
      {active && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '4px',
            height: '4px',
            borderRadius: '9999px',
            background: '#E03413',
          }}
        />
      )}
    </button>
  );
}
