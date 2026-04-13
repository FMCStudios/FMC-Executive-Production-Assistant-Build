'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function Button({
  variant = 'firestarter',
  children,
  className = '',
  ...props
}: {
  variant?: 'firestarter' | 'ghost';
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = variant === 'firestarter' ? 'btn-firestarter' : 'btn-ghost';
  return (
    <button className={`${base} px-5 py-2.5 text-sm ${className}`} {...props}>
      {children}
    </button>
  );
}
