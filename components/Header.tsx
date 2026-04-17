'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import OperatorSelector from './OperatorSelector';
import { useSession } from '@/context/SessionContext';
import { useProfileModal } from '@/context/ProfileModalContext';

export default function Header({ briefTypeName }: { briefTypeName?: string }) {
  const { user } = useSession();
  const router = useRouter();
  const profileModal = useProfileModal();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
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

        {briefTypeName && (
          <span className="label-upper text-white/40">{briefTypeName}</span>
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
          <OperatorSelector />
        </div>
      </div>
    </header>
  );
}
