/**
 * Storage backend. Web: IndexedDB. Native (Capacitor): the app's private filesystem — same interface,
 * so nothing above this file knows which platform it is on.
 */
import type { BundleFiles } from '@tome/core';
import type { Installed } from './store.ts';
import { isNative } from './platform.ts';

export interface Storage {
  putCourse(id: string, files: BundleFiles, rec: Installed): Promise<void>;
  readCourse(id: string): Promise<BundleFiles | undefined>;
  deleteCourse(id: string): Promise<void>;
  listCourses(): Promise<Installed[]>;
}

const DB = 'tome.library.v1';
function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { const db = r.result; db.createObjectStore('courses'); db.createObjectStore('index'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const tx = async <T>(store: string[], mode: IDBTransactionMode, f: (t: IDBTransaction) => T | Promise<T>): Promise<T> => {
  const db = await open(); const t = db.transaction(store, mode);
  const out = await f(t);
  return new Promise((res, rej) => { t.oncomplete = () => res(out); t.onerror = () => rej(t.error); });
};
const req = <T>(r: IDBRequest<T>): Promise<T> => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

const web: Storage = {
  putCourse: (id, files, rec) => tx(['courses', 'index'], 'readwrite', (t) => { t.objectStore('courses').put(files, id); t.objectStore('index').put(rec, id); }),
  readCourse: (id) => tx(['courses'], 'readonly', (t) => req(t.objectStore('courses').get(id))),
  deleteCourse: (id) => tx(['courses', 'index'], 'readwrite', (t) => { t.objectStore('courses').delete(id); t.objectStore('index').delete(id); }),
  listCourses: () => tx(['index'], 'readonly', (t) => req(t.objectStore('index').getAll() as IDBRequest<Installed[]>)),
};

/**
 * Native backend: one directory per course under Data/courses/<id>/, plus an index.json.
 * Files are written unpacked so assets can be served by path and the OS can page them in,
 * rather than holding a whole bundle in memory.
 */
function nativeStorage(fs: typeof import('@capacitor/filesystem')): Storage {
  const { Filesystem, Directory, Encoding } = fs;
  const dir = Directory.Data;
  // Chunked: spreading a whole file into String.fromCharCode overflows the stack above roughly 100 kB,
  // which any real course image or recording exceeds.
  const b64 = {
    enc: (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); },
    dec: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  };
  const indexPath = 'courses/index.json';
  const readIndex = async (): Promise<Installed[]> => { try { const r = await Filesystem.readFile({ path: indexPath, directory: dir, encoding: Encoding.UTF8 }); return JSON.parse(r.data as string); } catch { return []; } };
  const writeIndex = (recs: Installed[]) => Filesystem.writeFile({ path: indexPath, directory: dir, data: JSON.stringify(recs), encoding: Encoding.UTF8, recursive: true });
  return {
    async putCourse(id, files, rec) {
      for (const [rel, bytes] of Object.entries(files)) {
        if (rel.endsWith('/')) continue;
        await Filesystem.writeFile({ path: `courses/${id}/${rel}`, directory: dir, data: b64.enc(bytes), recursive: true });
      }
      const recs = (await readIndex()).filter((r) => r.courseId !== id); recs.push(rec); await writeIndex(recs);
    },
    async readCourse(id) {
      const recs = await readIndex(); const rec = recs.find((r) => r.courseId === id); if (!rec) return undefined;
      const out: BundleFiles = {};
      const paths = ['manifest.json', 'signature.json', ...Object.keys(rec.manifest.contentHashes ?? {})];
      for (const rel of paths) {
        try { const r = await Filesystem.readFile({ path: `courses/${id}/${rel}`, directory: dir }); out[rel] = b64.dec(r.data as string); } catch { /* signature.json may be absent in dev bundles */ }
      }
      return out;
    },
    async deleteCourse(id) {
      try { await Filesystem.rmdir({ path: `courses/${id}`, directory: dir, recursive: true }); } catch { /* already gone */ }
      await writeIndex((await readIndex()).filter((r) => r.courseId !== id));
    },
    listCourses: readIndex,
  };
}


/** Resolved once at startup; the app awaits `storageReady` before touching the library. */
export let storage: Storage = web;
export const storageReady: Promise<Storage> = isNative
  ? import('@capacitor/filesystem').then((fs) => (storage = nativeStorage(fs)))
  : Promise.resolve(web);
