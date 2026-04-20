'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const ERRORS: Record<string, string> = {
  AccessDenied: 'Your Google account isn\u2019t on the FMC roster. Contact Ferg to be added.',
  Configuration: 'Sign-in is temporarily unavailable. Try again in a minute.',
  OAuthSignin: 'Couldn\u2019t reach Google. Try again.',
  OAuthCallback: 'Google returned an unexpected response. Try again.',
  Default: 'Sign-in failed. Try again.',
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
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogle = async () => {
    setSigningIn(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const errorMessage =
    errorCode && (ERRORS[errorCode] || ERRORS.Default);

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

        {errorMessage && (
          <div
            className="glass-panel p-4 mb-6 text-sm text-fmc-firestarter/80 animate-fadeUp"
            style={{ borderLeft: '2px solid rgba(224,52,19,0.4)' }}
          >
            {errorMessage}
          </div>
        )}

        <div className="glass-panel p-6 animate-fadeUp">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={signingIn}
            className="btn-firestarter w-full py-3 text-sm font-semibold flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {signingIn ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#fff" d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.891-1.74 2.986-4.3 2.986-7.351z"/>
                  <path fill="#fff" fillOpacity="0.85" d="M12 22c2.7 0 4.964-.895 6.614-2.422l-3.227-2.51c-.895.6-2.04.955-3.387.955-2.604 0-4.81-1.76-5.595-4.122H3.064v2.59A9.996 9.996 0 0 0 12 22z"/>
                  <path fill="#fff" fillOpacity="0.7" d="M6.405 13.9A5.996 5.996 0 0 1 6.09 12c0-.66.114-1.302.314-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.341-2.59z"/>
                  <path fill="#fff" fillOpacity="0.55" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.992 14.695 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.341 2.59C7.19 7.737 9.396 5.977 12 5.977z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <p className="text-[11px] text-white/35 mt-4 text-center leading-relaxed">
            FMC roster only. If your Google email isn&rsquo;t listed,
            <br />reach out to Ferg.
          </p>
        </div>
      </div>
    </div>
  );
}
