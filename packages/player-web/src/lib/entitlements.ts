/**
 * Entitlement ledger (client mirror). An entitlement is a *grant*, not a lease: it has no expiry, and the
 * player never checks the network to open a course. Revocation exists only for chargebacks/refunds and is
 * recorded with a reason so the learner can see why.
 *
 * The ledger is cached locally per subject (account id, or this install's anonymous id) so an offline
 * desktop still shows the right library.
 */
import { useSyncExternalStore } from 'react';
import { api, Offline } from './api.ts';
import { account, anonymousId, session } from './account.ts';

export interface Entitlement { courseId: string; grantedAt: string; source: 'purchase' | 'gift' | 'sample' | 'bundle'; orderId?: string; platform?: 'web' | 'ios' | 'android'; revokedAt?: string; revokedReason?: string }

/** Cached per subject: a shared device must not show the previous user's library. */
const KEY = () => `tome.entitlements.v1:${session() ? account()!.id : anonymousId()}`;
const subs = new Set<() => void>();
const load = (): Entitlement[] => { try { return JSON.parse(localStorage.getItem(KEY()) ?? '[]'); } catch { return []; } };
let cache: Entitlement[] = load();
const emit = () => { localStorage.setItem(KEY(), JSON.stringify(cache)); subs.forEach((f) => f()); };

/** Re-read the cache after the subject changes (sign-in, sign-out, account switch). */
export function reloadCache() { cache = load(); subs.forEach((f) => f()); }

export const listEntitlements = () => cache;
export const owns = (courseId: string) => cache.some((e) => e.courseId === courseId && !e.revokedAt);
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useEntitlements = () => useSyncExternalStore(subscribe, listEntitlements);

/**
 * Merge server state in. Grants always win; a revocation applies only when the server sends one explicitly.
 * A failed request leaves the local ledger untouched — a network problem must never take a course away.
 */
export function mergeFromServer(remote: Entitlement[]) {
  const byId = new Map(cache.map((e) => [e.courseId, e]));
  for (const r of remote) {
    const l = byId.get(r.courseId);
    byId.set(r.courseId, l ? { ...l, ...r, grantedAt: l.grantedAt < r.grantedAt ? l.grantedAt : r.grantedAt } : r);
  }
  cache = [...byId.values()]; emit();
}

export async function refresh(): Promise<'synced' | 'offline'> {
  try {
    const q = session() ? '' : `?anonymousId=${encodeURIComponent(anonymousId())}`;
    const r = await api<{ entitlements: Entitlement[] }>('/entitlements' + q, { session: session() });
    mergeFromServer(r.entitlements);
    return 'synced';
  } catch (e) { if (e instanceof Offline) return 'offline'; throw e; }
}

/** Web checkout (Stripe stands behind this in production). On iOS this call is replaced by an IAP + webhook. */
export async function purchase(courseId: string) {
  const r = await api<{ entitlements: Entitlement[] }>('/purchases/web', { method: 'POST', body: { courseId, anonymousId: anonymousId() }, session: session() });
  mergeFromServer(r.entitlements);
}

/** Local-only grant, used when the platform is unreachable and for offline demos. */
export function grantLocal(courseId: string, source: Entitlement['source'] = 'purchase', orderId?: string) {
  if (owns(courseId)) return;
  cache = [...cache, { courseId, grantedAt: new Date().toISOString(), source, orderId }]; emit();
}

/** Signed proof of ownership the learner can keep, independent of the platform (see plan: longevity). */
export async function downloadReceipt() {
  const r = await api<any>('/receipt', { session: session() });
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `tome-receipt-${account()?.id ?? 'account'}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Called on sign-out: the cached ledger belongs to the account that fetched it. */
export function clearCache() { cache = []; subs.forEach((f) => f()); }
