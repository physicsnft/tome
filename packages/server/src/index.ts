#!/usr/bin/env tsx
/**
 * Stub platform API for the ownership path. Not production code: no real auth, no payments, one JSON file.
 * It exists so the client's sync, claim and revocation flows are exercised against something real.
 *
 *   POST /auth/start          { email }                     -> { token }  (the "magic link" — printed, not emailed)
 *   POST /auth/verify         { token }                     -> { session, account }
 *   POST /auth/oauth          { provider, subject, email? } -> { session, account }   (Sign in with Apple/Google, faked)
 *   POST /auth/claim          { anonymousId }               -> merges an anonymous subject into the session account
 *   GET  /entitlements        (session or ?anonymousId=)    -> { entitlements }
 *   POST /purchases/web       { courseId, orderId }         -> grant (stands in for Stripe checkout completion)
 *   POST /webhooks/revenuecat { app_user_id, product_id, … }-> grant (stands in for an IAP webhook)
 *   POST /admin/revoke        { subject, courseId, reason } -> revoke (chargeback path)
 *   POST /progress/sync       { since, rows }               -> { rows, now }  (last-write-wins per widget)
 *   GET  /receipt             (session)                     -> Ed25519-signed proof of ownership the user can keep
 *   GET  /download/<courseId> (session or ?anonymousId=)    -> this buyer's personal copy: the bundle with issuedTo set, re-signed
 *   POST /account/display-name { displayName }               -> opt-in name printed on future copies (never an email)
 */
import { createServer } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { signManifest, issueCopy, unpackBundle, readManifest } from '@tome/core';
import { db, save, entitlementsOf, resolveSubject, type Account, type Entitlement, type ProgressRow } from './store.ts';

const PORT = Number(process.env.PORT ?? 8787);
const HERE = fileURLToPath(new URL('.', import.meta.url));
/** Platform signing key. Defaults to the newest dev key in the repo's keys/ folder (never committed). */
const KEY = process.env.TOME_KEY ?? (() => {
  const dir = join(HERE, '../../../keys');
  const keys = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  return keys.length ? join(dir, keys[keys.length - 1]) : join(dir, 'dev-signing-key.json');
})();
/** The store's master copies: signed, unpersonalised bundles, one per course, and the catalog that lists them. */
const PUBLIC = process.env.TOME_PUBLIC ?? join(HERE, '../../player-web/public');
const PRODUCT_TO_COURSE: Record<string, string> = {
  'tome.chess_tactics': 'courses.tome.chess-tactics', 'tome.spanish_cafe': 'courses.tome.spanish-cafe',
  'tome.python_first_steps': 'courses.tome.python-first-steps', 'tome.vectors_visually': 'courses.tome.vectors-visually',
  'tome.sketching_basics': 'courses.tome.sketching-basics',
};

const json = (res: any, code: number, body: unknown) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const body = (req: any) => new Promise<any>((resolve) => { let b = ''; req.on('data', (c: any) => (b += c)); req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { resolve({}); } }); });

function accountFor(req: any): Account | null {
  const t = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const id = t && db.sessions[t];
  return id ? db.accounts[id] ?? null : null;
}
/** The subject whose ledger we read/write: the signed-in account, else the client's anonymous id. */
function subjectFor(req: any, url: URL, payload: any = {}): string | null {
  const acct = accountFor(req);
  if (acct) return acct.id;
  const anon = payload.anonymousId ?? url.searchParams.get('anonymousId');
  return anon || null;
}
function grant(subject: string, courseId: string, source: Entitlement['source'], orderId?: string, platform?: Entitlement['platform']) {
  const list = entitlementsOf(subject);
  if (list.some((e) => e.courseId === courseId && !e.revokedAt)) return list;
  list.push({ courseId, grantedAt: new Date().toISOString(), source, orderId, platform });
  save(); return list;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  res.setHeader('access-control-allow-origin', req.headers.origin ?? '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const p = await body(req);
  const acct = accountFor(req);

  try {
    switch (`${req.method} ${url.pathname}`) {
      case 'POST /auth/start': {
        if (!p.email) return json(res, 400, { error: 'email required' });
        const token = randomUUID();
        db.magicLinks[token] = { email: String(p.email).toLowerCase(), expiresAt: Date.now() + 15 * 60_000 };
        save();
        console.log(`[auth] magic link for ${p.email}: ${token}`);
        // The prototype returns the token so tests can use it; a real server only emails it.
        return json(res, 200, { sent: true, token });
      }
      case 'POST /auth/verify': {
        const link = db.magicLinks[p.token];
        if (!link || link.expiresAt < Date.now()) return json(res, 400, { error: 'link expired' });
        delete db.magicLinks[p.token];
        const existing = Object.values(db.accounts).find((a) => a.email === link.email);
        const account: Account = existing ?? { id: `acct_${randomUUID().slice(0, 8)}`, email: link.email, provider: 'email', createdAt: new Date().toISOString() };
        db.accounts[account.id] = account;
        const session = randomUUID(); db.sessions[session] = account.id;
        if (p.anonymousId) { mergeLedger(p.anonymousId, account.id); db.aliases[p.anonymousId] = account.id; }
        save();
        return json(res, 200, { session, account, entitlements: entitlementsOf(account.id) });
      }
      case 'POST /auth/oauth': {
        // Stands in for Sign in with Apple / Google: one tap, no password, stable subject id.
        if (!p.subject) return json(res, 400, { error: 'subject required' });
        const id = `acct_${createHash('sha256').update(`${p.provider}:${p.subject}`).digest('hex').slice(0, 8)}`;
        const account: Account = db.accounts[id] ?? { id, email: p.email, provider: p.provider ?? 'apple', createdAt: new Date().toISOString() };
        db.accounts[id] = account;
        const session = randomUUID(); db.sessions[session] = id;
        if (p.anonymousId) { mergeLedger(p.anonymousId, id); db.aliases[p.anonymousId] = id; }
        save();
        return json(res, 200, { session, account, entitlements: entitlementsOf(id) });
      }
      case 'POST /auth/claim': {
        // "Restore purchases": attach an anonymous subject (an IAP made before signing in) to this account.
        if (!acct) return json(res, 401, { error: 'sign in first' });
        if (!p.anonymousId) return json(res, 400, { error: 'anonymousId required' });
        if (resolveSubject(p.anonymousId) === acct.id) return json(res, 200, { entitlements: entitlementsOf(acct.id), claimed: 0 });
        const moved = mergeLedger(p.anonymousId, acct.id);
        db.aliases[p.anonymousId] = acct.id; save();
        return json(res, 200, { entitlements: entitlementsOf(acct.id), claimed: moved });
      }
      case 'GET /entitlements': {
        const subject = subjectFor(req, url);
        if (!subject) return json(res, 200, { entitlements: [] });
        return json(res, 200, { entitlements: entitlementsOf(subject), account: acct ?? null });
      }
      case 'POST /purchases/web': {
        const subject = subjectFor(req, url, p);
        if (!subject) return json(res, 401, { error: 'no subject' });
        if (!p.courseId) return json(res, 400, { error: 'courseId required' });
        return json(res, 200, { entitlements: grant(subject, p.courseId, 'purchase', p.orderId ?? `web_${randomUUID().slice(0, 8)}`, 'web') });
      }
      case 'POST /webhooks/revenuecat': {
        // Shape follows RevenueCat's event webhook: the app_user_id is whatever the client set — account id or anonymous.
        const e = p.event ?? p;
        const courseId = PRODUCT_TO_COURSE[e.product_id] ?? e.course_id;
        if (!e.app_user_id || !courseId) return json(res, 400, { error: 'app_user_id and known product_id required' });
        if (e.type === 'CANCELLATION' || e.type === 'REFUND') {
          const list = entitlementsOf(e.app_user_id);
          for (const it of list) if (it.courseId === courseId && !it.revokedAt) { it.revokedAt = new Date().toISOString(); it.revokedReason = 'Refunded through the App Store'; }
          save(); return json(res, 200, { ok: true, revoked: true });
        }
        grant(e.app_user_id, courseId, 'purchase', e.transaction_id, e.store === 'PLAY_STORE' ? 'android' : 'ios');
        return json(res, 200, { ok: true });
      }
      case 'POST /admin/revoke': {
        const list = entitlementsOf(p.subject);
        for (const it of list) if (it.courseId === p.courseId && !it.revokedAt) { it.revokedAt = new Date().toISOString(); it.revokedReason = p.reason ?? 'Chargeback'; }
        save(); return json(res, 200, { entitlements: list });
      }
      case 'POST /progress/sync': {
        const subject = subjectFor(req, url, p);
        if (!subject) return json(res, 401, { error: 'no subject' });
        const key = resolveSubject(subject);
        const mine = (db.progress[key] ??= {});
        for (const row of (p.rows ?? []) as ProgressRow[]) {
          const cur = mine[row.key];
          if (!cur || cur.updatedAt <= row.updatedAt) mine[row.key] = row; // last write wins per widget
        }
        const since = p.since ?? '';
        const rows = Object.values(mine).filter((r) => r.updatedAt > since);
        save();
        return json(res, 200, { rows, now: new Date().toISOString() });
      }
      case 'POST /account/display-name': {
        // Opt-in: the name printed on this account's future copies. Empty clears it. Never an email address.
        if (!acct) return json(res, 401, { error: 'sign in first' });
        const n = String(p.displayName ?? '').trim();
        if (n.includes('@') || n.length > 60) return json(res, 400, { error: 'A display name, not an email address, up to 60 characters.' });
        if (n) acct.displayName = n; else delete acct.displayName;
        save(); return json(res, 200, { account: acct });
      }
      case 'GET /receipt': {
        // A portable proof of ownership: signed with the platform key, verifiable with the same code the player
        // uses for bundles. The point is that it keeps meaning if the platform disappears.
        if (!acct) return json(res, 401, { error: 'sign in first' });
        const key = JSON.parse(readFileSync(KEY, 'utf8'));
        const payload = { type: 'tome.receipt', account: { id: acct.id, email: acct.email }, issuedAt: new Date().toISOString(), entitlements: entitlementsOf(acct.id).filter((e) => !e.revokedAt) };
        const bytes = new TextEncoder().encode(JSON.stringify(payload));
        return json(res, 200, { payload, signature: signManifest(bytes, key.privateKey, key.keyId) });
      }
      default: {
        const dl = /^\/download\/([a-z0-9.-]+)$/.exec(url.pathname);
        if (req.method === 'GET' && dl) return download(res, dl[1], subjectFor(req, url), acct);
        return json(res, 404, { error: 'not found' });
      }
    }
  } catch (err: any) {
    console.error(err);
    return json(res, 500, { error: err?.message ?? 'server error' });
  }
});

/**
 * A personal copy (§3.4): the master bundle with the buyer written into the manifest, signed again. Issued only
 * to a subject that owns the course; every download is a fresh copy, so a leaked file names its buyer and order.
 */
function download(res: any, courseId: string, subject: string | null, acct: Account | null) {
  if (!subject) return json(res, 401, { error: 'sign in, or send the anonymousId that made the purchase' });
  const ent = entitlementsOf(subject).find((e) => e.courseId === courseId && !e.revokedAt);
  if (!ent) return json(res, 403, { error: 'This account does not own that course.' });
  const catalog: { courseId: string; bundleUrl: string }[] = JSON.parse(readFileSync(join(PUBLIC, 'catalog.json'), 'utf8'));
  const entry = catalog.find((c) => c.courseId === courseId);
  if (!entry) return json(res, 404, { error: 'unknown course' });
  const base = unpackBundle(new Uint8Array(readFileSync(join(PUBLIC, entry.bundleUrl))));
  const key = JSON.parse(readFileSync(KEY, 'utf8'));
  // No email, no real name: a copy can end up public. The order number is what traces it, and only the store can
  // resolve that. A buyer may opt in to a display name of their own (POST /account/display-name).
  const zip = issueCopy(base, { order: ent.orderId ?? `order_${randomUUID().slice(0, 8)}`, subject: resolveSubject(subject), issuedAt: new Date().toISOString(), ...(acct?.displayName ? { name: acct.displayName } : {}) }, key.privateKey, key.keyId);
  const m = readManifest(base);
  res.writeHead(200, {
    'content-type': 'application/vnd.tome.course',
    'content-length': zip.byteLength,
    'content-disposition': `attachment; filename="${m.id}-${m.version}.course"`,
    'access-control-expose-headers': 'content-length, content-disposition',
  });
  res.end(Buffer.from(zip));
}

/** Move an anonymous subject's grants onto an account, keeping the earliest grantedAt. */
function mergeLedger(from: string, to: string): number {
  const src0 = resolveSubject(from);
  if (src0 === to) return 0; // already claimed by this account — merging would delete its own ledger
  const src = db.entitlements[src0] ?? [];
  const dst = (db.entitlements[to] ??= []);
  let moved = 0;
  for (const e of src) {
    const hit = dst.find((d) => d.courseId === e.courseId);
    if (!hit) { dst.push(e); moved++; }
    else if (e.grantedAt < hit.grantedAt) hit.grantedAt = e.grantedAt;
  }
  const srcProg = db.progress[src0];
  if (srcProg) { const dstProg = (db.progress[to] ??= {}); for (const [k, r] of Object.entries(srcProg)) if (!dstProg[k] || dstProg[k].updatedAt < r.updatedAt) dstProg[k] = r; }
  delete db.entitlements[src0];
  delete db.progress[src0];
  return moved;
}

server.listen(PORT, '127.0.0.1', () => console.log(`tome stub API on http://127.0.0.1:${PORT}`));
