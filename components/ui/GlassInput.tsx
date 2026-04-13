'use client';

import type { TextareaHTMLAttributes } from 'react';

export default function GlassInput({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`glass-input w-full p-4 text-sm resize-y ${className}`}
      {...props}
    />
  );
}
