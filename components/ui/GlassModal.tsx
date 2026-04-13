'use client';

import { useEffect, type ReactNode } from 'react';

export default function GlassModal({
  children,
  open,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ transition: 'opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      />
      <div
        className="glass-modal relative p-8 max-w-lg w-full animate-modalIn"
        style={{ transform: 'scale(1)' }}
      >
        {children}
      </div>
    </div>
  );
}
