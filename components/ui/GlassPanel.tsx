'use client';

import type { ReactNode } from 'react';

export default function GlassPanel({
  children,
  className = '',
  active = false,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`glass-panel ${active ? 'glass-panel-active' : ''} ${hover ? 'hover-glow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
