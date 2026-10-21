/** Stub persistence: one JSON file. Production is Postgres; the shapes here match the tables in the plan. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface Account { id: string; email?: string; /** opt-in name printed on personal copies; unset means copies carry only the order number */ displayName?: string; provider: 'email' | 'apple' | 'google'; createdAt: string }
export interface Entitlement { courseId: string; grantedAt: string; source: 'purchase' | 'gift' | 'sample' | 'bundle'; orderId?: string; platform?: 'web' | 'ios' | 'android'; revokedAt?: string; revokedReason?: string }
export interface ProgressRow { key: string; complete: boolean; data?: unknown; updatedAt: string }

export interface Db {
  accounts: Record<string, Account>;
  /** Entitlements are keyed by *subject*: an account id, or an anonymous app-user id that can later be claimed. */
  entitlements: Record<string, Entitlement[]>;
  /** anonymous subject -> account it was merged into (RevenueCat-style aliasing) */
  aliases: Record<string, string>;
  progress: Record<string, Record<string, ProgressRow>>;
  sessions: Record<string, string>;
  magicLinks: Record<string, { email: string; expiresAt: number }>;
}

const PATH = process.env.TOME_DB ?? '/tmp/tome-server/db.json';
const empty: Db = { accounts: {}, entitlements: {}, aliases: {}, progress: {}, sessions: {}, magicLinks: {} };
export const db: Db = existsSync(PATH) ? { ...empty, ...JSON.parse(readFileSync(PATH, 'utf8')) } : structuredClone(empty);
export function save() { mkdirSync(dirname(PATH), { recursive: true }); writeFileSync(PATH, JSON.stringify(db, null, 2)); }

/** Follow alias chains so an anonymous subject resolves to the account that claimed it. */
export function resolveSubject(subject: string): string {
  const seen = new Set<string>();
  let s = subject;
  while (db.aliases[s] && !seen.has(s)) { seen.add(s); s = db.aliases[s]; }
  return s;
}
export const entitlementsOf = (subject: string) => (db.entitlements[resolveSubject(subject)] ??= []);
