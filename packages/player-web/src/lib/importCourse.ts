/**
 * Adding a .course file someone sent you — from the file picker, or (in the app) by tapping the file in
 * Downloads, an email or a chat. Same rule as a store download: nothing is installed unless the hashes match
 * and the signature is from a trusted key. A course from outside the store opens only after the learner agrees.
 */
import { installBundle, InstallError, listInstalled, type Installed } from './store.ts';
import { trustedKeys } from './download.ts';
import { storageReady } from './storage.ts';
import { readManifest, unpackBundle } from '@tome/core';
import { fetchCatalog } from './catalog.ts';
import { owns } from './entitlements.ts';

export type ImportResult =
  | { ok: true; rec: Installed; name: string }
  | { ok: false; error: string; name: string; consent?: { origin: 'author' | 'draft'; fingerprint?: string }; bytes: Uint8Array };

const EVENT = 'tome:import';
// A file opened on a cold start is imported before the library has mounted to listen, so results wait here
// until a listener takes them.
let waiting: ImportResult[] = [];
const publish = (r: ImportResult) => { waiting.push(r); dispatchEvent(new Event(EVENT)); };

export async function importCourse(bytes: Uint8Array, name: string, opts: { outsideStore?: boolean } = {}): Promise<ImportResult> {
  let result: ImportResult;
  let id = '';
  try { id = readManifest(unpackBundle(bytes)).id; } catch { /* unreadable: installBundle says so below */ }
  try {
    await storageReady; // a file opened on a cold start can arrive before the app has picked its storage
    // A course from outside the store that reuses a store course's id is almost always a bought copy with its
    // stamp removed (§3.4) — refuse it whatever it is signed with.
    // It can never replace a store course either, owned or not.
    if (opts.outsideStore) {
      const entry = id ? (await fetchCatalog().catch(() => [])).find((c) => c.courseId === id) : undefined;
      if (entry && !owns(id)) throw new InstallError(`This is an altered copy of “${entry.title}” from the store, so it cannot be opened. Get your own copy in the store.`);
      if (entry) throw new InstallError(`It uses the identity of “${entry.title}” from the store, and a course from outside the store cannot replace a store course.`);
    }
    const rec = await installBundle(bytes, await trustedKeys(), opts);
    result = { ok: true, rec, name };
  } catch (e) {
    const msg = e instanceof InstallError ? e.message : `Could not open this file (${(e as Error).message}).`;
    const consent = e instanceof InstallError ? e.needsConsent : undefined;
    // Same id as a course already here from a different author key (or from none): say it would replace that one.
    const here = consent && id ? (await listInstalled().catch(() => [])).find((r) => r.courseId === id) : undefined;
    const replaces = here && (here.origin !== consent!.origin || here.fingerprint !== consent!.fingerprint)
      ? ` Opening it replaces “${here.manifest.title}” already in your library${here.fingerprint ? `, which came from key ${here.fingerprint}` : ''}.` : '';
    result = { ok: false, error: msg + replaces, name, consent, bytes };
  }
  publish(result);
  return result;
}

/** For failures before there are any bytes to check, such as a file the OS would not let us read. */
export function reportImportError(name: string, error: string) {
  publish({ ok: false, error, name, bytes: new Uint8Array() });
}

export async function importFile(file: File) {
  return importCourse(new Uint8Array(await file.arrayBuffer()), file.name);
}

/** Receive import results, including any that arrived before this listener existed. */
export function onImport(f: (r: ImportResult) => void) {
  const h = () => { const rs = waiting; waiting = []; rs.forEach(f); };
  addEventListener(EVENT, h); h();
  return () => removeEventListener(EVENT, h);
}
