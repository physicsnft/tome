/**
 * Progress sync. Push what changed since the last successful sync, merge what comes back.
 * Last write wins per widget; conflicts are practically impossible because a widget's state only moves forward.
 * Attachments (recordings, sketches) are never synced here — they stay on the device unless the learner opts in.
 */
import { api, Offline } from './api.ts';
import { account, anonymousId, session } from './account.ts';
import { progress } from './progress.ts';

/**
 * The high-water mark is per *subject*. Signing in changes the subject, so the new one starts from scratch
 * and pulls the full history — otherwise rows written before sign-in are silently skipped.
 */
const subject = () => (session() ? account()!.id : anonymousId());
const MARK = () => `tome.sync.since.v1:${subject()}`;
let running: Promise<'synced' | 'offline'> | null = null;

export function syncProgress(): Promise<'synced' | 'offline'> {
  return (running ??= run().finally(() => { running = null; }));
}

async function run(): Promise<'synced' | 'offline'> {
  const mark = MARK();
  const since = localStorage.getItem(mark) ?? '';
  const rows = progress.rowsSince(since);
  try {
    const r = await api<{ rows: any[]; now: string }>('/progress/sync', { method: 'POST', body: { since, rows, anonymousId: anonymousId() }, session: session() });
    progress.merge(r.rows);
    localStorage.setItem(mark, r.now);
    return 'synced';
  } catch (e) {
    if (e instanceof Offline) return 'offline'; // rows stay pending; the next sync picks them up
    throw e;
  }
}

/** Sync opportunistically: on load, when the tab regains focus, and when the network comes back. */
export function startAutoSync() {
  const go = () => { syncProgress().catch(() => {}); };
  go();
  addEventListener('online', go);
  addEventListener('visibilitychange', () => document.visibilityState === 'visible' && go());
  setInterval(go, 60_000);
}

export function resetSyncMark() { localStorage.removeItem(MARK()); }
