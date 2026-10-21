import { useEffect, useMemo, useState } from 'react';
import { isGraded, walk, type ParsedLesson } from '@tome/core';
import { listDevCourses, loadDevCourse, loadInstalledCourse, type LoadedCourse } from './lib/course.ts';
import { listInstalled, originOf, uninstall, type Installed } from './lib/store.ts';
import { fetchCatalog, isNewer, type CatalogEntry } from './lib/catalog.ts';
import { downloadOwned, type DownloadState } from './lib/download.ts';
import { Store } from './Store.tsx';
import { AccountBar } from './Account.tsx';
import { ThemeMenu } from './ThemeMenu.tsx';
import { SignInNudge } from './SignInNudge.tsx';
import { InstallTip } from './InstallTip.tsx';
import { Credits } from './Credits.tsx';
import { AssetUrlContext } from './render/assets.ts';
import { courseCards, dueCount } from './lib/courseCards.ts';
import { ReviewSession } from './components/ReviewSession.tsx';
import { useNow } from './lib/useNow.ts';
import { refresh, reloadCache, useEntitlements } from './lib/entitlements.ts';
import { startAutoSync } from './lib/sync.ts';
import { useAccount } from './lib/account.ts';
import { progress, useProgress } from './lib/progress.ts';
import { renderNodes, resetCounters, type RenderCtx } from './render/Markdown.tsx';
import { Widget } from './widgets/index.tsx';
import { importCourse, importFile, onImport, type ImportResult } from './lib/importCourse.ts';
import { isNative } from './lib/platform.ts';
import { freePreview } from './lib/preview.ts';
import { previewLessons, statusOf, useCopyStatus } from './lib/license.ts';
import type { IssuedTo } from '@tome/core';

type Route = { view: 'library' } | { view: 'store' } | { view: 'course'; dir: string; lesson?: string };

function useRoute(): [Route, (r: Route) => void] {
  const parse = (): Route => { const [, dir, lesson] = location.hash.split('/'); return dir === 'store' ? { view: 'store' } : dir ? { view: 'course', dir, lesson } : { view: 'library' }; };
  const [r, setR] = useState<Route>(parse);
  useEffect(() => { const f = () => setR(parse()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return [r, (n) => { location.hash = n.view === 'library' ? '' : n.view === 'store' ? '/store' : `/${n.dir}${n.lesson ? '/' + n.lesson : ''}`; }];
}

export default function App() {
  const [route, go] = useRoute();
  const acct = useAccount();
  // Sync is opportunistic and never blocks the UI: refresh the ledger and push progress when we can.
  // In the free preview there is no platform to sync with, so the app makes no network calls of its own.
  useEffect(() => { reloadCache(); if (freePreview) return; refresh().catch(() => {}); startAutoSync(); }, [acct?.account.id]);
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); go({ view: 'library' }); }}>Tome</a>
        <span className="tagline">Courses you keep.</span>
        <nav className="topnav">
          <a href="#" className={route.view === 'library' ? 'on' : ''} onClick={(e) => { e.preventDefault(); go({ view: 'library' }); }}>Library</a>
          <a href="#/store" className={route.view === 'store' ? 'on' : ''} onClick={(e) => { e.preventDefault(); go({ view: 'store' }); }}>Store</a>
          <ThemeMenu />
          {!freePreview && <AccountBar />}
        </nav>
      </header>
      {route.view === 'library' ? <Library go={go} /> : route.view === 'store' ? <Store go={go} /> : <CourseView dir={route.dir} lessonId={route.lesson} go={go} />}
      {/* On a phone the two destinations move to a bar under the thumb; the top bar keeps the title and account. */}
      <nav className="tabbar" aria-label="Main">
        <a href="#" className={route.view === 'store' ? '' : 'on'} aria-current={route.view !== 'store' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go({ view: 'library' }); }}><TabIcon kind="library" />Library</a>
        <a href="#/store" className={route.view === 'store' ? 'on' : ''} aria-current={route.view === 'store' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go({ view: 'store' }); }}><TabIcon kind="store" />Store</a>
      </nav>
    </div>
  );
}

function TabIcon({ kind }: { kind: 'library' | 'store' }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'library'
        ? <><path d="M4 4h4v16H4z" /><path d="M10 4h4v16h-4z" /><path d="M16.5 4.5l3.6 1 -4 15 -3.6-1z" /></>
        : <><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>}
    </svg>
  );
}

/** "Got a .course file from someone?" — the file picker, and the result of opening one from another app. */
function ImportBanners({ go, onInstalled }: { go: (r: Route) => void; onInstalled: () => void }) {
  const [results, setResults] = useState<ImportResult[]>([]);
  useEffect(() => onImport((r) => { setResults((rs) => [...rs.filter((x) => x.name !== r.name), r]); if (r.ok) onInstalled(); }), []);
  const dismiss = (r: ImportResult) => setResults((rs) => rs.filter((x) => x !== r));
  return (
    <>
      {results.map((r, i) => r.ok ? (
        <div key={i} className="import-banner ok" role="status">
          <span>Added <strong>{r.rec.manifest.title}</strong> to your library{originOf(r.rec) === 'store' ? '' : ', marked as not from the Tome store'}.
            {statusOf(r.rec.manifest) === 'other' && <> This copy was bought {r.rec.manifest.issuedTo!.name ? `by ${r.rec.manifest.issuedTo!.name}` : 'by another account'}, so the first lesson is open as a preview. To read the rest, get your own copy in the store.</>}</span>
          <span className="row">
            <button className="btn small primary" onClick={() => { dismiss(r); go({ view: 'course', dir: r.rec.courseId }); }}>Open</button>
            <button className="btn small ghost" onClick={() => dismiss(r)}>Dismiss</button>
          </span>
        </div>
      ) : r.consent ? (
        // From outside the store: not an error, a question. Courses that authors share directly land here.
        <div key={i} className="import-banner ask" role="alert">
          <span><strong>{r.name}</strong> is a course from outside the Tome store. {r.error}</span>
          <span className="dim small">Authors share their own courses like this. Open it if you know who sent it.</span>
          <span className="row">
            <button className="btn small primary" onClick={() => { dismiss(r); importCourse(r.bytes, r.name, { outsideStore: true }); }}>Open it</button>
            <button className="btn small ghost" onClick={() => dismiss(r)}>Not now</button>
          </span>
        </div>
      ) : (
        <div key={i} className="import-banner no" role="alert">
          <span><strong>{r.name}</strong> was not added. {r.error}</span>
          <span className="row"><button className="btn small ghost" onClick={() => dismiss(r)}>Dismiss</button></span>
        </div>
      ))}
    </>
  );
}

function AddCourseFile() {
  // `accept=".course"` would grey out every file on Android, which knows no MIME type for the extension.
  return (
    <label className="add-file">
      <input type="file" accept={isNative ? undefined : '.course'} onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
      <span className="btn small">Add a .course file…</span>
      <span className="dim small">For a course someone sent you. It is checked before it is added.</span>
    </label>
  );
}

function Library({ go }: { go: (r: Route) => void }) {
  const [courses, setCourses] = useState<LoadedCourse[] | null>(null);
  const [installed, setInstalled] = useState<Installed[]>([]);
  const [dev, setDev] = useState<LoadedCourse[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const prog = useProgress();
  const ents = useEntitlements();

  const refresh2 = async () => {
    const recs = await listInstalled();
    setInstalled(recs);
    const own = await Promise.all(recs.map((r) => loadInstalledCourse(r.courseId).catch(() => null)));
    const devDirs = await listDevCourses();
    const devCourses = (await Promise.all(devDirs.map((d) => loadDevCourse(d).catch(() => null)))).filter(Boolean) as LoadedCourse[];
    setDev(devCourses.filter((d) => !recs.some((r) => r.courseId === d.manifest.id)));
    setCourses(own.filter(Boolean) as LoadedCourse[]);
    fetchCatalog().then(setCatalog).catch(() => setCatalog([]));
  };
  useEffect(() => { refresh2(); }, [ents.length]);

  const remove = async (c: LoadedCourse) => {
    if (!confirm(`Remove “${c.manifest.title}” from this device? You keep the course — your progress stays, and you can download it again any time.`)) return;
    c.release?.(); await uninstall(c.manifest.id); refresh2();
  };

  const refreshAll = refresh2;
  const ownedIds = ents.filter((e) => !e.revokedAt).map((e) => e.courseId);
  const elsewhere = catalog.filter((c) => ownedIds.includes(c.courseId) && !installed.some((i) => i.courseId === c.courseId));
  const revoked = ents.filter((e) => e.revokedAt && installed.some((i) => i.courseId === e.courseId));
  if (!courses) return <main className="library"><p className="dim">Opening your library…</p></main>;
  return (
    <main className="library">
      <h1>Your library</h1>
      <p className="lede">Every course here is yours. Open it now, or in ten years — it works the same, online or off.</p>
      {revoked.length > 0 && <p className="feedback no">{revoked.map((r) => `“${catalog.find((c) => c.courseId === r.courseId)?.title ?? r.courseId}” was refunded (${r.revokedReason}). It stays on this device until you remove it.`).join(' ')}</p>}
      <SignInNudge />
      <InstallTip hasCourses={courses.length > 0} />
      <ImportBanners go={go} onInstalled={refresh2} />
      {!courses.length && !elsewhere.length && <p className="empty">Nothing downloaded yet. <a href="#/store" onClick={(e) => { e.preventDefault(); go({ view: 'store' }); }}>Visit the store</a> to get your first course.</p>}
      {courses.length > 0 && <div className="shelf">
        {courses.map((c) => { const rec = installed.find((r) => r.courseId === c.manifest.id); const upd = rec && originOf(rec) === 'store' ? catalog.find((e) => e.courseId === rec.courseId && e.version && isNewer(e.version, rec.version)) : undefined;
          return <Book key={c.dir} c={c} prog={prog} rec={rec} update={upd} onUpdated={refresh2} onOpen={() => go({ view: 'course', dir: c.dir })} onRemove={() => remove(c)} />; })}
      </div>}
      {elsewhere.length > 0 && (
        <section className="elsewhere">
          <h2 className="eyebrow">{freePreview ? 'Not on this device' : 'Owned, not on this device'}</h2>
          <p className="dim small">{freePreview ? 'Removed from this device. Download it again to use it here — including offline.' : 'Bought on another device. Download to use it here — including offline.'}</p>
          <div className="shelf">
            {elsewhere.map((e) => <RemoteBook key={e.courseId} entry={e} onDone={refreshAll} />)}
          </div>
        </section>
      )}
      <AddCourseFile />
      {/* Unpacked courses in /public/courses are an authoring convenience (vite dev and `tome preview`), never shown
          on the published site, which serves that folder only for the store's cover images. */}
      {dev.length > 0 && !isNative && (import.meta.env.DEV || (window as any).__TOME_PREVIEW__) && (
        <section className="devshelf">
          <h2 className="eyebrow">Developer mode — unpacked courses in /public/courses</h2>
          <div className="shelf">{dev.map((c) => <Book key={c.dir} c={c} prog={prog} onOpen={() => go({ view: 'course', dir: c.dir })} />)}</div>
        </section>
      )}
    </main>
  );
}

function Book({ c, prog, rec, update, onUpdated, onOpen, onRemove }: { c: LoadedCourse; prog: Record<string, any>; rec?: Installed; update?: CatalogEntry; onUpdated?: () => void; onOpen: () => void; onRemove?: () => void }) {
  const now = useNow();
  const status = useCopyStatus(c.manifest);
  const it = c.manifest.issuedTo;
  const { done, total } = courseProgress(c, prog);
  return (
    // The whole card opens the course: the title carries the accessible name and its ::after covers the
    // card, so there is one focusable target rather than a cover button and a title button that do the same
    // thing. "Remove from device" sits above that overlay.
    <div className="book is-openable">
      <img src={c.assetUrl(c.manifest.cover)} alt="" />
      <div className="book-meta">
        <span className="eyebrow">{c.manifest.tags?.[0]} · {c.manifest.estimatedMinutes} min</span>
        <h2><button className="linklike card-open" onClick={onOpen}>{c.manifest.title}</button></h2>
        <p>{c.manifest.subtitle}</p>
        {(c.manifest.uses?.length || c.manifest.bestOn?.length) ? <span className="badges">{c.manifest.uses?.map((u) => <span key={u} className="badge">{u}</span>)}{c.manifest.bestOn && <span className="badge amber">best on {c.manifest.bestOn.join(' / ')}</span>}</span> : null}
        <div className="bar"><span style={{ width: `${total ? (100 * done) / total : 0}%` }} /></div>
        <span className="dim small">{done} of {total} lessons complete</span>
        {(() => { const n = dueCount(courseCards(c), prog, now); return n ? <span className="badge due">{n} card{n === 1 ? '' : 's'} to review</span> : null; })()}
        {update && onUpdated && <UpdateNotice entry={update} c={c} onDone={onUpdated} />}
        {status === 'other' && <span className="badge amber">Preview · bought by another account</span>}
        {rec && originOf(rec) !== 'store' && <span className="badge outside">{originOf(rec) === 'author' ? 'From an author · not reviewed by Tome' : 'Unsigned draft · not reviewed by Tome'}</span>}
        {rec && <span className="dim small owned">{originOf(rec) === 'author' ? `By ${c.manifest.authors.map((a) => a.name).join(', ')} · key ${rec.fingerprint}` : originOf(rec) === 'draft' ? `By ${c.manifest.authors.map((a) => a.name).join(', ')} · not signed` : status === 'other' ? 'Someone else’s copy' : it ? (it.name ? `Licensed to ${it.name}` : 'Your personal copy') : freePreview ? 'From Tome' : 'Owned'} · v{rec.version}{originOf(rec) === 'store' ? ` · signed by ${rec.keyId}` : ''} · {rec.bytes >= 1e6 ? `${(rec.bytes / 1e6).toFixed(1)} MB` : `${Math.round(rec.bytes / 1e3)} kB`} {onRemove && <button className="linklike" onClick={onRemove}>Remove from device</button>}</span>}
      </div>
    </div>
  );
}

/** A lesson is complete when every required widget before each checkpoint is complete (§7.4). */
function lessonSegments(lesson: ParsedLesson) {
  const segments: number[][] = [[]];
  walk(lesson.tree, (n: any) => {
    if (n.type === 'paragraph' && n.children?.[0]?.type === 'text') { const m = /^@@widget:(\d+)@@$/.exec(n.children[0].value); if (m) segments[segments.length - 1].push(Number(m[1])); }
    if (n.type === 'containerDirective' && n.name === 'checkpoint') segments.push([]);
  });
  return segments; // segments[i] = widgets before checkpoint i; last = trailing widgets
}
const isRequired = (w: any) => w.required ?? isGraded(w);
function checkpointDone(lesson: ParsedLesson, courseId: string, prog: Record<string, any>, upTo: number) {
  const segs = lessonSegments(lesson);
  return segs.slice(0, upTo + 1).flat().every((i) => !isRequired(lesson.widgets[i]) || prog[`${courseId}:${lesson.widgets[i].id}`]?.complete);
}
function lessonDone(lesson: ParsedLesson, courseId: string, prog: Record<string, any>) {
  const n = lessonSegments(lesson).length - 1;
  return n > 0 && checkpointDone(lesson, courseId, prog, n - 1);
}
function courseProgress(c: LoadedCourse, prog: Record<string, any>) {
  return { done: c.lessons.filter((l) => lessonDone(l, c.manifest.id, prog)).length, total: c.lessons.length };
}

function CourseView({ dir, lessonId, go }: { dir: string; lessonId?: string; go: (r: Route) => void }) {
  const [course, setCourse] = useState<LoadedCourse | null>(null);
  const [tocOpen, setTocOpen] = useState(false); // phones only: the contents fold away above the lesson
  useEffect(() => {
    let released: LoadedCourse | null = null;
    (dir.includes('.') ? loadInstalledCourse(dir) : loadDevCourse(dir)).then((c) => { released = c; setCourse(c); }).catch(() => setCourse(null));
    return () => released?.release?.();
  }, [dir]);
  const prog = useProgress();
  const cards = useMemo(() => (course ? courseCards(course) : []), [course]);
  const now = useNow();
  const status = useCopyStatus(course?.manifest);
  if (!course) return <main className="library"><p className="dim">Opening course…</p></main>;
  // A course-wide review gathers due cards from every deck. Reserved route, unless a lesson is called that.
  const reviewing = lessonId === 'review' && !course.lessons.some((l) => l.id === 'review');
  // Only cards already met in a lesson take part in course review — including "practise all".
  const metCards = cards.filter((c) => prog[`${c.courseId}:${c.widgetId}#${c.key}`]);
  const started = metCards.length > 0;
  const due = dueCount(cards, prog, now);
  const lesson = course.lessons.find((l) => l.id === lessonId) ?? course.lessons[0];
  const idx = course.lessons.indexOf(lesson);
  // Someone else's copy (§3.4): the first lesson is a preview; the rest, and review, wait for a copy of one's own.
  const locked = status === 'other';
  const lockedAt = (i: number) => locked && i >= previewLessons;
  const open = (id: string) => { setTocOpen(false); go({ view: 'course', dir, lesson: id }); scrollTo({ top: 0 }); };
  return (
    <div className="course">
      <nav className={`toc ${tocOpen ? 'open' : ''}`} aria-label="Course contents">
        <div className="toc-title"><h2>{course.manifest.title}</h2><span className="dim small">{courseProgress(course, prog).done}/{course.lessons.length} complete</span></div>
        <button type="button" className="toc-toggle" aria-expanded={tocOpen} aria-controls="toc-body" onClick={() => setTocOpen(!tocOpen)}>
          <span className="toc-toggle-label"><span className="eyebrow">{course.manifest.title} · {reviewing ? 'review' : `${idx + 1} of ${course.lessons.length}`}</span>{reviewing ? 'Cards due today' : lesson.frontMatter.title}</span>
          <span className="toc-toggle-action">{tocOpen ? 'Close' : 'Contents'}{due > 0 && !tocOpen ? <span className="toc-due-dot" aria-label={`${due} cards due`} /> : null}</span>
        </button>
        <div id="toc-body" className="toc-body">
        {started && (
          <a href={`#/${dir}/review`} className={`toc-review ${reviewing ? 'current' : ''} ${due ? 'has-due' : ''}`} onClick={(e) => { e.preventDefault(); open('review'); }}>
            Review <span className="toc-review-count">{due ? `${due} due` : 'nothing due'}</span>
          </a>
        )}
        {course.manifest.structure.map((ch) => (
          <div key={ch.id} className="chapter">
            <div className="eyebrow">{ch.title}</div>
            {ch.lessons.map((p) => { const l = course.lessons.find((x) => x.path === p)!; const done = lessonDone(l, course.manifest.id, prog); const shut = lockedAt(course.lessons.indexOf(l)); return <a key={p} href={`#/${dir}/${l.id}`} className={`toc-item ${l.id === lesson.id ? 'current' : ''} ${done ? 'done' : ''} ${shut ? 'locked' : ''}`} onClick={(e) => { e.preventDefault(); open(l.id); }}><span className="dot" />{l.frontMatter.title}{shut && <span className="lock" aria-label="not in this copy">🔒</span>}</a>; })}
          </div>
        ))}
        <button className="btn ghost small" onClick={() => { if (confirm('Reset all progress in this course?')) progress.reset(course.manifest.id); }}>Reset progress</button>
        </div>
      </nav>
      {locked && (reviewing || lockedAt(idx)) ? <LockedLesson title={reviewing ? 'Review' : lesson.frontMatter.title} course={course.manifest.title} owner={course.manifest.issuedTo!} go={go} />
      : reviewing ? (
        <main className="lesson review-page">
          <AssetUrlContext.Provider value={course.assetUrl}>
            <h1>Review</h1>
            <p className="dim">Cards from every deck in this course that are due today. Only cards you have already met in a lesson come back here.</p>
            <ReviewSession cards={metCards} assetUrl={course.assetUrl} allowNew={false} emptyHint="Nothing is due — you are up to date." />
          </AssetUrlContext.Provider>
        </main>
      ) : <LessonView key={lesson.id} course={course} lesson={lesson} onNavigate={open} prev={course.lessons[idx - 1]} next={course.lessons[idx + 1]} licensedTo={status === 'mine' ? course.manifest.issuedTo : undefined} />}
    </div>
  );
}

/** A lesson beyond the preview, in a copy that belongs to someone else. */
function LockedLesson({ title, course, owner, go }: { title: string; course: string; owner: IssuedTo; go: (r: Route) => void }) {
  return (
    <main className="lesson">
      <div className="spine" aria-hidden />
      <article className="locked-lesson">
        <div className="lesson-eyebrow eyebrow">Not included in this copy</div>
        <h1>{title}</h1>
        <p>This copy of <strong>{course}</strong> was bought {owner.name ? <>by <strong>{owner.name}</strong></> : 'by another account'} (order {owner.order}). Its first lesson is open as a preview.</p>
        <p>To read the rest, get your own copy. It is yours from then on: on every device, offline, with no subscription.</p>
        <p className="row"><button className="btn primary" onClick={() => go({ view: 'store' })}>See it in the store</button></p>
        <p className="dim small">Bought it already? Sign in with the account you used, and this copy opens completely.</p>
      </article>
    </main>
  );
}

function LessonView({ course, lesson, onNavigate, prev, next, licensedTo }: { course: LoadedCourse; lesson: ParsedLesson; onNavigate: (id: string, anchor?: string) => void; prev?: ParsedLesson; next?: ParsedLesson; licensedTo?: IssuedTo }) {
  const prog = useProgress();
  const courseId = course.manifest.id;
  useEffect(() => { if (!location.hash.includes('#', 1)) scrollTo({ top: 0 }); }, [lesson.id]);
  const ctx: RenderCtx = useMemo(() => ({
    course, lesson,
    isComplete: (i) => !!prog[`${courseId}:${lesson.widgets[i].id}`]?.complete,
    renderWidget: (i) => <Widget def={lesson.widgets[i]} courseId={courseId} courseDir={course.dir} assetUrl={course.assetUrl} />,
    renderCheckpoint: (i, children) => { const ok = checkpointDone(lesson, courseId, prog, i); return <div className={`checkpoint ${ok ? 'passed' : ''}`}><span className="notch" /><div><span className="eyebrow">{ok ? 'Checkpoint passed' : 'Checkpoint — finish the exercises above to continue'}</span>{children}</div></div>; },
    onNavigate: (id, anchor) => { onNavigate(id); if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView(), 50); },
  }), [course, lesson, prog]);
  resetCounters();
  const body = renderNodes(lesson.tree.children as any, ctx);
  const segs = lessonSegments(lesson);
  const required = segs.flat().filter((i) => isRequired(lesson.widgets[i]));
  const doneCount = required.filter((i) => prog[`${courseId}:${lesson.widgets[i].id}`]?.complete).length;
  const errors = lesson.problems.filter((p) => p.level === 'error');
  return (
    <main className="lesson">
      <div className="spine" aria-hidden><span style={{ height: `${required.length ? (100 * doneCount) / required.length : 0}%` }} /></div>
      <AssetUrlContext.Provider value={course.assetUrl}>
      <article>
        {course.origin && course.origin.kind !== 'store' && (
          // Persistent, on every lesson (§4): this course did not come through the store's review.
          <p className="origin-note">{course.origin.kind === 'author'
            ? <>Not from the Tome store. Signed by its author with key <code>{course.origin.fingerprint}</code>; unchanged since then, but not reviewed by Tome.</>
            : <>Not from the Tome store: an unsigned draft. Tome cannot check who made it or whether it was changed.</>}</p>
        )}
        <div className="lesson-eyebrow eyebrow">{lesson.frontMatter.estimatedMinutes ? `${lesson.frontMatter.estimatedMinutes} min · ` : ''}{required.length ? `${doneCount}/${required.length} exercises` : 'reading'}</div>
        {errors.length > 0 && <aside className="callout callout-warning"><div className="callout-title">Validation problems in this lesson</div><ul>{errors.map((p, i) => <li key={i}>{p.line ? `line ${p.line}: ` : ''}{p.message}</li>)}</ul></aside>}
        {body}
        <nav className="pager">
          {prev ? <button className="btn" onClick={() => onNavigate(prev.id)}>← {prev.frontMatter.title}</button> : <span />}
          {next && <button className="btn primary" onClick={() => onNavigate(next.id)}>{next.frontMatter.title} →</button>}
        </nav>
        <Credits credits={course.manifest.credits} assetsByAuthor={course.manifest.assetsByAuthor} authors={course.manifest.authors} />
        {licensedTo && <p className="licensed dim small">{licensedTo.name ? `This copy is licensed to ${licensedTo.name}` : 'This is your personal copy'} · order {licensedTo.order}. It is for your own use, on all your devices.</p>}
      </article>
      </AssetUrlContext.Provider>
    </main>
  );
}

/** A course you own but have not downloaded here — the cross-device case. */
/** A newer version of a store course is in the catalog. Updating replaces the files; progress is kept by course and exercise id. */
function UpdateNotice({ entry, c, onDone }: { entry: CatalogEntry; c: LoadedCourse; onDone: () => void }) {
  const [state, setState] = useState<DownloadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    try { await downloadOwned(entry, setState); c.release?.(); onDone(); }
    catch (e: any) { setError(e.message); setState(null); }
  };
  return (
    <div className="update-notice">
      <span><b>Update available</b> · v{entry.version}{entry.changelog ? ` — ${entry.changelog}` : ''}</span>
      <button className="btn small primary" onClick={run} disabled={!!state}>{state ? (state.phase === 'downloading' ? 'Downloading…' : 'Checking…') : 'Update'}</button>
      {error && <span className="feedback no">{error}</span>}
    </div>
  );
}

function RemoteBook({ entry, onDone }: { entry: CatalogEntry; onDone: () => void }) {
  const [state, setState] = useState<DownloadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pct = state && state.total ? Math.round((100 * state.received) / state.total) : 0;
  const get = async () => {
    setError(null);
    try { await downloadOwned(entry, setState); onDone(); }
    catch (e: any) { setError(e.message); setState(null); }
  };
  return (
    <div className="book">
      <img src={entry.cover} alt="" />
      <div className="book-meta">
        <h2>{entry.title}</h2>
        <p>{entry.subtitle}</p>
        <button className="btn primary" onClick={get} disabled={!!state}>{state ? (state.phase === 'downloading' ? `Downloading ${pct}%` : 'Checking signature…') : 'Download to this device'}</button>
        {state?.phase === 'downloading' && <div className="bar"><span style={{ width: `${pct}%` }} /></div>}
        {error && <p className="feedback no">{error}</p>}
      </div>
    </div>
  );
}
