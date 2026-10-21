/**
 * Local course store: downloaded .course bundles, verified once on install and kept as files.
 * Web uses IndexedDB; the Capacitor shell swaps in the filesystem (see storage.ts) with no change here.
 */
import { unpackBundle, verifyBundle, verifyAuthorSignature, readManifest, type BundleFiles, type Manifest, type TrustedKey } from '@tome/core';
import * as s from './storage.ts';

/**
 * Where a course came from (§4). `store`: signed with a platform key. `author`: signed with the author's own key —
 * unchanged since they signed it, but not reviewed by Tome. `draft`: not signed at all.
 */
export type Origin = 'store' | 'author' | 'draft';
export interface Installed { courseId: string; version: string; manifest: Manifest; installedAt: string; keyId: string; bytes: number; origin?: Origin; fingerprint?: string }
/** Records written before `origin` existed: unsigned ones were drafts, the rest came from the store. */
export const originOf = (r: Installed): Origin => r.origin ?? (r.keyId === 'unsigned' ? 'draft' : 'store');

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', md: 'text/markdown', json: 'application/json' };
export const mimeFor = (p: string) => MIME[p.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';

/** `needsConsent`: a course from outside the store, which opens after the learner says so (§4). */
export class InstallError extends Error {
  constructor(message: string, readonly needsConsent?: { origin: 'author' | 'draft'; fingerprint?: string }) { super(message); }
}

/**
 * Verify a bundle and store it. A store course installs when its hashes and platform signature pass. A course
 * from outside the store — signed with its author's own key, or not signed — installs only with `outsideStore`,
 * i.e. after the learner has agreed to open it; it is then marked as such wherever it appears.
 */
export async function installBundle(zip: Uint8Array, trusted: TrustedKey[], opts: { outsideStore?: boolean } = {}): Promise<Installed> {
  let files: BundleFiles;
  try { files = unpackBundle(zip); } catch { throw new InstallError('The file is not a readable .course bundle.'); }
  const { hashes, signature, manifest } = verifyBundle(files, trusted);
  if (hashes.length) throw new InstallError(`This file has been changed since it was made (${hashes[0]}), so it cannot be opened.`);
  let origin: Origin = 'store', fingerprint: string | undefined, keyId = signature.ok ? signature.keyId : 'unsigned';
  if (!signature.ok) {
    const author = signature.reason === 'unsigned' ? null : verifyAuthorSignature(files);
    if (signature.reason !== 'unsigned' && !author) throw new InstallError(`The signature does not match the file (${signature.reason}), so it cannot be opened.`);
    // A signature that names one of Tome's own keys but does not verify with it is an impersonation, not an author.
    if (author && trusted.some((k) => k.keyId === author.keyId)) throw new InstallError('This file claims to be signed by Tome, but the signature does not check out, so it cannot be opened.');
    origin = author ? 'author' : 'draft'; fingerprint = author?.fingerprint; if (author) keyId = author.keyId;
    if (!opts.outsideStore) throw new InstallError(author
      ? `It is signed by its author (key ${fingerprint}), not by Tome: it is unchanged since they signed it, but Tome has not reviewed it.`
      : 'It is not signed, so Tome cannot check who made it or that it arrived unchanged.', { origin, fingerprint });
  }
  const rec: Installed = { courseId: manifest.id, version: manifest.version, manifest, installedAt: new Date().toISOString(), keyId, bytes: zip.byteLength, origin, fingerprint };
  await s.storage.putCourse(manifest.id, files, rec);
  // Ask the browser to keep the library even when space runs low (a no-op in the native app).
  (navigator as any).storage?.persist?.().catch?.(() => {});
  return rec;
}

export const listInstalled = () => s.storage.listCourses();
export const uninstall = (courseId: string) => s.storage.deleteCourse(courseId);

/** Files of an installed course, for the loader. */
export async function openInstalled(courseId: string): Promise<{ manifest: Manifest; file: (p: string) => Promise<Uint8Array | undefined> }> {
  const files = await s.storage.readCourse(courseId);
  if (!files) throw new InstallError('Course not installed.');
  return { manifest: readManifest(files), file: async (p) => files[p] };
}
