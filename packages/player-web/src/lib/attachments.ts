/** Learner attachments (§7.4, 0.3): blobs keyed (courseId, widgetId, name). Prototype uses IndexedDB. */
const DB = 'tome.attachments.v1';
function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
const key = (c: string, w: string, n: string) => `${c}:${w}:${n}`;
export async function putAttachment(courseId: string, widgetId: string, name: string, blob: Blob) {
  const db = await open(); await new Promise<void>((res, rej) => { const t = db.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(blob, key(courseId, widgetId, name)); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
export async function getAttachment(courseId: string, widgetId: string, name: string): Promise<Blob | undefined> {
  const db = await open(); return new Promise((res, rej) => { const r = db.transaction('blobs').objectStore('blobs').get(key(courseId, widgetId, name)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
export async function deleteAttachment(courseId: string, widgetId: string, name: string) {
  const db = await open(); await new Promise<void>((res, rej) => { const t = db.transaction('blobs', 'readwrite'); t.objectStore('blobs').delete(key(courseId, widgetId, name)); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
export function download(blob: Blob, filename: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
