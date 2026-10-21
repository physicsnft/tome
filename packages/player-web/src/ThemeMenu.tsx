import { useEffect, useRef, useState } from 'react';
import { setThemePref, useTheme, useThemePref, type ThemePref } from './lib/theme.ts';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Same as device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Appearance: follow the device (the default), or always light, or always dark. */
export function ThemeMenu() {
  const pref = useThemePref();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const click = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    addEventListener('keydown', key); addEventListener('pointerdown', click);
    return () => { removeEventListener('keydown', key); removeEventListener('pointerdown', click); };
  }, [open]);
  return (
    <span className="theme-menu" ref={root}>
      <button type="button" className="btn small ghost theme-btn" aria-haspopup="true" aria-expanded={open} aria-label={`Appearance: ${OPTIONS.find((o) => o.value === pref)!.label}`} onClick={() => setOpen(!open)}>
        <ThemeIcon dark={theme === 'dark'} />
      </button>
      {open && (
        <div className="theme-pop" role="radiogroup" aria-label="Appearance">
          <span className="eyebrow">Appearance</span>
          {OPTIONS.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={pref === o.value} className="theme-opt" onClick={() => { setThemePref(o.value); setOpen(false); }}>
              {o.label}<span className="tick" aria-hidden>✓</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {dark
        ? <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
    </svg>
  );
}
