'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

const ERRORS: Record<string, string> = {
  expired: 'That link has expired. Request a new one.',
  missing: 'Invalid login link.',
  notfound: 'Account not found.',
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const errorCode = params.get('error');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch { /* silent */ }
    setSending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 animate-fadeUp">
          <Image src="/logos/fmc-cube.png" alt="FMC" width={40} height={40} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold tracking-tight text-fmc-offwhite mb-2">
            EPA
          </h1>
          <p className="text-sm text-white/40">Executive Production Assistant</p>
        </div>

        {errorCode && ERRORS[errorCode] && (
          <div
            className="glass-panel p-4 mb-6 text-sm text-fmc-firestarter/80 animate-fadeUp"
            style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
          >
            {ERRORS[errorCode]}
          </div>
        )}

        {sent ? (
          <div className="glass-panel p-6 text-center animate-fadeUp">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(73,121,123,0.15)', border: '1px solid rgba(73,121,123,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#49797B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-fmc-offwhite font-medium mb-1">Check your email</p>
            <p className="text-xs text-white/40">
              If your email is on the roster, you&rsquo;ll get a login link. It expires in 30 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel p-6 animate-fadeUp">
            <label className="text-xs uppercase tracking-[0.15em] text-fmc-firestarter/70 block mb-2">
              Email
            </label>
            <input
              type="email"
              className="glass-input w-full px-3 py-2.5 text-sm mb-4"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              autoFocus
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="btn-firestarter w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                'Send me a link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
