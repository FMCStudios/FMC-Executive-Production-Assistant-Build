'use client';

import { useEffect, useState, useMemo } from 'react';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export default function SkillsPicker({ value, onChange }: Props) {
  const [library, setLibrary] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.json())
      .then((d: { skills?: string[] }) => setLibrary(d.skills || []))
      .catch(() => {});
  }, []);

  const selectedSet = useMemo(
    () => new Set(value.map(s => s.toLowerCase())),
    [value]
  );

  const available = useMemo(
    () => library.filter(s => !selectedSet.has(s.toLowerCase())),
    [library, selectedSet]
  );

  const addSelected = (skill: string) => {
    const s = skill.trim();
    if (!s) return;
    if (value.some(v => v.toLowerCase() === s.toLowerCase())) return;
    onChange([...value, s]);
  };

  const removeSelected = (skill: string) => {
    onChange(value.filter(v => v.toLowerCase() !== skill.toLowerCase()));
  };

  const handleSubmitNew = async () => {
    const s = input.trim();
    if (!s) return;
    const match = library.find(lib => lib.toLowerCase() === s.toLowerCase());
    if (match) {
      addSelected(match);
      setInput('');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: s }),
      });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data?.skills)) setLibrary(data.skills);
      addSelected(s);
      setInput('');
    } catch {
      // best-effort — don't lose user's text
    } finally {
      setAdding(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitNew();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(skill => (
            <button
              type="button"
              key={skill}
              onClick={() => removeSelected(skill)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium active:scale-[0.97] group inline-flex items-center gap-1.5"
              style={{
                background: 'rgba(224,52,19,0.2)',
                border: '1px solid rgba(224,52,19,0.4)',
                color: '#F0EBE1',
                transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              title="Click to remove"
            >
              {skill}
              <span className="text-white/50 group-hover:text-white/90 leading-none">×</span>
            </button>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map(skill => (
            <button
              type="button"
              key={skill}
              onClick={() => addSelected(skill)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium active:scale-[0.97]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              + {skill}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          className="glass-input flex-1 px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add new skill..."
          disabled={adding}
        />
        <button
          type="button"
          onClick={handleSubmitNew}
          disabled={adding || !input.trim()}
          className="btn-ghost px-3 py-2 text-[11px] active:scale-[0.97] disabled:opacity-40"
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}
