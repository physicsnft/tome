import { createContext, useContext } from 'react';
import { useSyncExternalStore } from 'react';

/** Prototype progress store: in-memory + localStorage, keyed (courseId, widgetId). */
export type WidgetState = { complete: boolean; data?: unknown; updatedAt?: string };
type Store = Record<string, WidgetState>;

const KEY = 'tome.progress.v1';
let store: Store = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } })();
const subs = new Set<() => void>();
const emit = () => { localStorage.setItem(KEY, JSON.stringify(store)); subs.forEach((f) => f()); };

export const progress = {
  get(courseId: string, widgetId: string): WidgetState | undefined { return store[`${courseId}:${widgetId}`]; },
  set(courseId: string, widgetId: string, s: WidgetState) { store = { ...store, [`${courseId}:${widgetId}`]: { ...s, updatedAt: new Date().toISOString() } }; emit(); },
  /** Apply rows pulled from the platform; local wins on ties so an in-flight answer is never clobbered. */
  merge(rows: { key: string; complete: boolean; data?: unknown; updatedAt: string }[]) {
    const next = { ...store };
    for (const r of rows) { const cur = next[r.key]; if (!cur || (cur.updatedAt ?? '') < r.updatedAt) next[r.key] = { complete: r.complete, data: r.data, updatedAt: r.updatedAt }; }
    store = next; emit();
  },
  rowsSince(since: string) { return Object.entries(store).filter(([, v]) => (v.updatedAt ?? '') > since).map(([key, v]) => ({ key, complete: v.complete, data: v.data, updatedAt: v.updatedAt! })); },
  reset(courseId: string) { store = Object.fromEntries(Object.entries(store).filter(([k]) => !k.startsWith(courseId + ':'))); emit(); },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  snapshot: () => store,
};

/** A `:::listening` group listens for wrong answers from the widgets it wraps, to reset its play limit per attempt. */
export const GroupCtx = createContext<{ onSave: (complete: boolean) => void } | null>(null);

export function useWidgetState<T>(courseId: string, widgetId: string) {
  const all = useSyncExternalStore(progress.subscribe, progress.snapshot);
  const group = useContext(GroupCtx);
  const s = all[`${courseId}:${widgetId}`];
  return {
    complete: !!s?.complete,
    data: s?.data as T | undefined,
    save: (data: T, complete?: boolean) => { const c = complete ?? !!s?.complete; group?.onSave(c); progress.set(courseId, widgetId, { complete: c, data }); },
  };
}

export function useProgress() { return useSyncExternalStore(progress.subscribe, progress.snapshot); }
