'use client';

import { useEffect } from 'react';

export default function Toast({
  message,
  onClose,
  duration = 5000,
}: {
  message: string;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
      <div
        className="glass-panel flex items-center gap-3 px-5 py-3 text-sm"
        style={{ borderLeft: '3px solid var(--fmc-firestarter)' }}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/70 ml-2"
          style={{ transition: 'color 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
