'use client';

import { useState, useRef, useEffect } from 'react';
import { useOperator } from '@/context/OperatorContext';
import { operatorsList } from '@/lib/operators';

export default function OperatorSelector() {
  const { activeOperator, setOperator } = useOperator();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium active:scale-[0.97]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: 'rgba(224,52,19,0.2)', color: '#E03413' }}
        >
          {activeOperator.initials}
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/40 font-medium">Viewing as</span>
        <span className="text-white/70">{activeOperator.name}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/30"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden animate-fadeUp"
          style={{
            background: 'rgba(13,13,13,0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(224,52,19,0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(224,52,19,0.15)',
          }}
        >
          <div className="p-1.5">
            {operatorsList.map((op) => {
              const isActive = op.id === activeOperator.id;
              return (
                <button
                  key={op.id}
                  onClick={() => {
                    setOperator(op.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left active:scale-[0.97]"
                  style={{
                    background: isActive ? 'rgba(224,52,19,0.08)' : 'transparent',
                    transition: 'background 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget.style.background = 'rgba(255,255,255,0.04)');
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget.style.background = 'transparent');
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: isActive ? 'rgba(224,52,19,0.25)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#E03413' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {op.initials}
                  </span>
                  <div className="min-w-0">
                    <span className={`text-xs font-medium block ${isActive ? 'text-fmc-offwhite' : 'text-white/60'}`}>
                      {op.name}
                    </span>
                    <span className="text-[10px] text-white/30 block truncate">{op.role}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
