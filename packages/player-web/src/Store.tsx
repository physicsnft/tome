import { useEffect, useMemo, useState } from 'react';
import { cachedCatalog, fetchCatalog, formatPrice, type CatalogEntry } from './lib/catalog.ts';
import { grantLocal, owns, purchase, useEntitlements } from './lib/entitlements.ts';
import { Offline } from './lib/api.ts';
import { downloadOwned, type DownloadState } from './lib/download.ts';
import { listInstalled } from './lib/store.ts';
import { isNative } from './lib/platform.ts';
import { freePreview, isFree } from './lib/preview.ts';
import { SignInNudge } from './SignInNudge.tsx';

/**
 * Store. Purchase and download are separate steps on purpose: buying grants an entitlement that never expires,
 * downloading is a device-local convenience you can undo. The prototype fakes the payment; everything after it is real.
 */
const fmtSize = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} kB`);

export function Store({ go }: { go: (r: any) => void }) {
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(cachedCatalog);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [, bump] = useState(0);
  useEntitlements(); // re-render when the ledger changes (purchase, sync, revocation)
  useEffect(() => { fetchCatalog().then(setCatalog).catch(() => setCatalog((c) => c ?? [])); listInstalled().then((r) => setInstalledIds(r.map((x) => x.courseId))); }, []);
  const [f, setF] = useFilter();
  const shown = useMemo(() => (catalog ?? []).filter((e) => matches(e, f)), [catalog, f]);
  if (!catalog) return <main className="library"><p className="dim">Loading the store…</p></main>;
  return (
    <main className="library">
      <h1>Store</h1>
      <p className="lede">{freePreview
        ? 'Every course here is free. Get one and it is yours to keep: offline, with no account and no expiry.'
        : 'Buy once. The course is yours: no subscription, no expiry, and it keeps working offline and after we\'re gone.'}</p>
      <SignInNudge />
      <StoreFilters catalog={catalog} f={f} setF={setF} />
      {shown.length > 0
        ? <div className="shelf">
            {shown.map((e) => <StoreCard key={e.courseId} entry={e} installed={installedIds.includes(e.courseId)} onAuthor={(a) => setF({ ...f, author: a })} onChange={() => { listInstalled().then((r) => setInstalledIds(r.map((x) => x.courseId))); bump((n) => n + 1); }} go={go} />)}
          </div>
        : <p className="empty">No course matches {describe(f)}. <button className="linklike" onClick={() => setF(NO_FILTER)}>Show all courses</button></p>}
    </main>
  );
}

function StoreCard({ entry, installed, onChange, onAuthor, go }: { entry: CatalogEntry; installed: boolean; onChange: () => void; onAuthor: (a: string) => void; go: (r: any) => void }) {
  const [state, setState] = useState<DownloadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const owned = owns(entry.courseId);

  const [buying, setBuying] = useState(false);
  const free = isFree(entry.priceCents);
  /** A free course: added to the library and downloaded in one step, with no payment and no pretend payment. */
  const get = () => { grantLocal(entry.courseId, 'sample', `free_${Date.now()}`); onChange(); download(); };
  const buy = async () => {
    if (free) return get();
    setBuying(true); setError(null);
    // The app prototype has no Play Billing yet, so a purchase is a free demo grant — said plainly before it happens.
    if (isNative) {
      setBuying(false);
      if (!confirm(`This is a prototype: no payment is taken.\n\nAdd “${entry.title}” to your library for free?`)) return;
      grantLocal(entry.courseId, 'purchase', `demo_${Date.now()}`); onChange(); download();
      return;
    }
    // Web checkout. On iOS this is the IAP call; either way the grant lands in the same account ledger.
    try { await purchase(entry.courseId); }
    catch (e) {
      if (e instanceof Offline) { grantLocal(entry.courseId, 'purchase', `local_${Date.now()}`); setError('Bought offline — this will sync to your account when you are back online.'); }
      else { setError((e as Error).message); }
    } finally { setBuying(false); onChange(); }
  };
  const download = async () => {
    setError(null);
    try { await downloadOwned(entry, setState); onChange(); }
    catch (e: any) { setError(e.message ?? String(e)); setState({ phase: 'error', received: 0, total: 0 }); }
  };
  const pct = state && state.total ? Math.round((100 * state.received) / state.total) : 0;

  return (
    <div className="book store-card">
      <img src={entry.cover} alt="" decoding="async" width="300" height="400" />
      <div className="book-meta">
        {entry.tags?.[0] && <span className="eyebrow">{entry.tags[0]}{entry.minutes ? ` · ${entry.minutes} min` : ''}</span>}
        <h2>{entry.title}</h2>
        <p>{entry.subtitle}</p>
        {entry.authors?.length ? <p className="by dim small">by {entry.authors.map((a, i) => <span key={a}>{i > 0 && ', '}<button className="linklike" onClick={() => onAuthor(a)} title={`All courses by ${a}`}>{a}</button></span>)}</p> : null}
        <span className="dim small">{free ? 'Free' : formatPrice(entry.priceCents, entry.currency)}{entry.sizeBytes ? ` · ${fmtSize(entry.sizeBytes)} download` : ''}</span>
        <div className="row store-actions">
          {!owned && <button className="btn primary" onClick={buy} disabled={buying}>{free ? 'Get it free' : buying ? 'Purchasing…' : `Buy ${formatPrice(entry.priceCents, entry.currency)}`}</button>}
          {owned && !installed && <button className="btn primary" onClick={download} disabled={!!state && state.phase !== 'error'}>{state ? phaseLabel(state, pct) : 'Download'}</button>}
          {owned && installed && <button className="btn" onClick={() => go({ view: 'library' })}>In your library →</button>}
          {owned && !freePreview && <span className="badge green">Owned</span>}
        </div>
        {state && state.phase === 'downloading' && <div className="bar"><span style={{ width: `${pct}%` }} /></div>}
        {error && <p className="feedback no">{error}</p>}
        {owned && !installed && !state && <p className="dim small">{freePreview ? 'Removed from this device. Download it again any time.' : 'Owning and downloading are separate: remove the download any time, the course stays yours.'}</p>}
      </div>
    </div>
  );
}

const phaseLabel = (s: DownloadState, pct: number) => (s.phase === 'downloading' ? `Downloading ${pct}%` : s.phase === 'verifying' ? 'Checking signature…' : s.phase === 'done' ? 'Installed' : s.phase === 'error' ? 'Retry' : 'Installing…');

/* ── Search and filters ─────────────────────────────────────────────────────
   Everything runs on the catalog already on the device, so it works offline and needs no server. The filter is
   kept for the session, so going into a course and back keeps what you were looking at. */
interface Filter { q: string; subject: string | null; author: string | null }
const NO_FILTER: Filter = { q: '', subject: null, author: null };
let remembered: Filter = NO_FILTER;
function useFilter(): [Filter, (f: Filter) => void] {
  const [f, set] = useState<Filter>(remembered);
  return [f, (next) => { remembered = next; set(next); }];
}

/** Lowercase without accents, so "espanol" finds "Español". */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function matches(e: CatalogEntry, f: Filter) {
  if (f.subject && e.tags?.[0] !== f.subject) return false;
  if (f.author && !e.authors?.includes(f.author)) return false;
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fold([e.title, e.subtitle, e.description, ...(e.authors ?? []), ...(e.tags ?? []).map((t) => t.replace(/-/g, ' ')), e.level].filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w));
}

const describe = (f: Filter) => [f.q && `“${f.q}”`, f.subject && `the subject ${f.subject}`, f.author && `courses by ${f.author}`].filter(Boolean).join(' and ') || 'this';

function StoreFilters({ catalog, f, setF }: { catalog: CatalogEntry[]; f: Filter; setF: (f: Filter) => void }) {
  const subjects = [...new Set(catalog.map((e) => e.tags?.[0]).filter(Boolean) as string[])].sort();
  return (
    <div className="store-filters">
      <label className="store-search">
        <span className="visually-hidden">Search courses</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input id="store-search" type="search" placeholder="Search courses, topics or authors" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
      </label>
      {subjects.length > 1 && (
        <div className="chips" role="group" aria-label="Subject">
          <button className={`chip ${!f.subject ? 'on' : ''}`} aria-pressed={!f.subject} onClick={() => setF({ ...f, subject: null })}>All</button>
          {subjects.map((s) => <button key={s} className={`chip ${f.subject === s ? 'on' : ''}`} aria-pressed={f.subject === s} onClick={() => setF({ ...f, subject: f.subject === s ? null : s })}>{s}</button>)}
        </div>
      )}
      {f.author && <p className="active-filter">Courses by <b>{f.author}</b> <button className="linklike" onClick={() => setF({ ...f, author: null })} aria-label={`Stop showing only courses by ${f.author}`}>Show all authors</button></p>}
    </div>
  );
}
