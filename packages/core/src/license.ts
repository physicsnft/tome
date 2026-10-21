/**
 * Personal copies (§3.4). When someone buys a course, the store writes who it was issued to into the manifest
 * and signs the result. The lesson and asset files — and so `contentHashes` — are untouched, which makes issuing
 * a copy cheap: one small JSON edit and one signature per purchase.
 *
 * Because the signature covers the manifest, the stamp cannot be removed or changed without the copy failing
 * verification. It does not stop copying; it makes every copy say whose it is.
 */
import { packBundle, readManifest, signBundle, verifyHashes, type BundleFiles } from './bundle.ts';
import type { IssuedTo, Manifest } from './types.ts';

const te = new TextEncoder();

export function issueCopy(base: BundleFiles, to: IssuedTo, privateKeyHex: string, keyId: string): Uint8Array {
  const problems = verifyHashes(base);
  if (problems.length) throw new Error(`base bundle is inconsistent: ${problems[0]}`);
  const m: Manifest = { ...readManifest(base), issuedTo: to };
  const files: BundleFiles = { ...base, 'manifest.json': te.encode(JSON.stringify(m, null, 2)) };
  delete files['signature.json'];
  return packBundle(signBundle(files, privateKeyHex, keyId));
}

/** Who a copy belongs to, from the player's point of view. Needs nothing but what is already on the device. */
export type CopyStatus = 'unlicensed' | 'mine' | 'other';
export function copyStatus(m: Manifest, knownSubjects: string[], owned: boolean): CopyStatus {
  if (!m.issuedTo) return 'unlicensed';
  return owned || knownSubjects.includes(m.issuedTo.subject) ? 'mine' : 'other';
}
