'use client';

import { useEffect } from 'react';
import type { PipelineBrief } from '@/components/BriefCard';

export default function DeleteConfirmModal({
  brief,
  title,
  onCancel,
  onConfirm,
}: {
  brief: PipelineBrief | null;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isOpen = !!brief;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onCancel]);

  if (!brief) return null;

  return (
    <>
      <div
        onClick={onCancel}
        className="glass-modal-backdrop fixed inset-0 z-[100] animate-fadeIn"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none px-6">
        <div
          className="glass-modal pointer-events-auto max-w-md w-full animate-modalIn relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-lg font-bold text-fmc-offwhite mb-2">Delete this brief?</h2>
            <p className="text-sm text-white/60 mb-1 break-words">{title}</p>
            <p className="text-sm text-white/60 mb-5">
              This will permanently remove the brief from the pipeline sheet. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="btn-ghost px-4 py-2 text-xs active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-firestarter px-4 py-2 text-xs active:scale-[0.97]"
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
