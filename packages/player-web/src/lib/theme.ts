/**
 * Light / dark appearance. The learner's choice is a per-device preference ("system" follows the phone or
 * computer), kept in localStorage — it is not progress and does not sync. index.html applies it before the
 * first paint, so a dark-mode reader never sees a white flash; this module keeps it current afterwards.
 */
import { useSyncExternalStore } from 'react';
import { isNative } from './platform.ts';

export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const KEY = 'tome.theme';
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
const subs = new Set<() => void>();

const readPref = (): ThemePref => { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; } };
let pref: ThemePref = readPref();
const resolve = (): Theme => (pref === 'system' ? (media?.matches ? 'dark' : 'light') : pref);
let theme: Theme = resolve();

function apply() {
  theme = resolve();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1a1e29' : '#ffffff');
  // Status-bar and navigation-bar icons: dark on the light page, light on the dark one.
  if (isNative) import('@capacitor/core').then(({ SystemBars, SystemBarsStyle }) => SystemBars.setStyle({ style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light })).catch(() => {});
  subs.forEach((f) => f());
}

export function setThemePref(p: ThemePref) {
  pref = p;
  try { p === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, p); } catch { /* private mode: still applies for this visit */ }
  apply();
}

media?.addEventListener('change', () => { if (pref === 'system') apply(); });
apply();

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useTheme = () => useSyncExternalStore(subscribe, () => theme);
export const useThemePref = () => useSyncExternalStore(subscribe, () => pref);
