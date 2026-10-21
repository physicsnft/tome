/**
 * Account and identity. The identity is *only* used to move entitlements and progress between devices —
 * the player never needs it to open a course you already have.
 */
import { useSyncExternalStore } from 'react';
import { api } from './api.ts';

export interface Account { id: string; email?: string; provider: string; displayName?: string }
interface Session { session: string; account: Account }

const KEY = 'tome.session.v1';
const ANON = 'tome.anonymousId.v1';
const subs = new Set<() => void>();
let current: Session | null = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; } })();
const emit = () => { current ? localStorage.setItem(KEY, JSON.stringify(current)) : localStorage.removeItem(KEY); subs.forEach((f) => f()); };

/** Stable per-install id, so a purchase made before signing in is not lost. Claimed on first sign-in. */
export function anonymousId(): string {
  let id = localStorage.getItem(ANON);
  if (!id) { id = `anon_${crypto.randomUUID().slice(0, 12)}`; localStorage.setItem(ANON, id); }
  return id;
}

export const session = () => current?.session ?? null;
export const account = () => current?.account ?? null;
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useAccount = () => useSyncExternalStore(subscribe, () => current);

export const requestLink = (email: string) => api<{ sent: boolean; token: string }>('/auth/start', { method: 'POST', body: { email } });

export async function verifyLink(token: string) {
  const r = await api<Session & { entitlements: any[] }>('/auth/verify', { method: 'POST', body: { token, anonymousId: anonymousId() } });
  current = { session: r.session, account: r.account }; emit(); return r;
}

/** Stands in for Sign in with Apple / Google: one tap, stable subject, no password. */
export async function oauth(provider: 'apple' | 'google', subject: string, email?: string) {
  const r = await api<Session & { entitlements: any[] }>('/auth/oauth', { method: 'POST', body: { provider, subject, email, anonymousId: anonymousId() } });
  current = { session: r.session, account: r.account }; emit(); return r;
}

/** "Restore purchases": attach this device's anonymous purchases to the signed-in account. */
export const claimAnonymous = () => api<{ entitlements: any[]; claimed: number }>('/auth/claim', { method: 'POST', body: { anonymousId: anonymousId() }, session: session() });

export function signOut() { current = null; emit(); }

/**
 * Opt-in name printed on copies downloaded from now on (§3.4). Empty means copies carry only the order number.
 * Never an email address: a copy can end up public.
 */
export async function setDisplayName(displayName: string) {
  const r = await api<{ account: Account }>('/account/display-name', { method: 'POST', body: { displayName }, session: session() });
  if (current) { current = { ...current, account: r.account }; emit(); }
  return r.account;
}
