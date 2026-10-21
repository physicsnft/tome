/**
 * Bundle integrity (SPEC §3.2, §4): content hashes + Ed25519 signature over manifest.json.
 * Pure functions over in-memory files so the same code runs in the CLI, the web player and the native shell.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { unzipSync, zipSync } from 'fflate';
import type { Manifest } from './types.ts';

// @noble/ed25519 v2 needs a sync sha512 for the sync API (and for environments without WebCrypto).
(ed as any).etc.sha512Sync = (...m: Uint8Array[]) => sha512((ed as any).etc.concatBytes(...m));

/** `publicKey` (hex) lets anyone check an author's own signature without knowing the author in advance (§4). */
export interface Signature { algorithm: 'Ed25519'; keyId: string; signedAt: string; manifestHash: string; signature: string; publicKey?: string }
export interface TrustedKey { keyId: string; publicKey: string /* hex */; expires?: string }
export type BundleFiles = Record<string, Uint8Array>;

const te = new TextEncoder(), td = new TextDecoder();
export const hashBytes = (b: Uint8Array) => 'sha256:' + bytesToHex(sha256(b));
const b64 = { enc: (b: Uint8Array) => btoa(String.fromCharCode(...b)), dec: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) };

/**
 * Unpack a bundle, tolerating one malformed shape: everything nested under a single wrapper directory,
 * which is what you get from zipping the folder rather than its contents. §2.2 requires the manifest at
 * the root, so we accept it and say so rather than failing with "manifest.json missing" — strict in what
 * we produce, lenient in what we read.
 */
export function unpackBundle(zip: Uint8Array, opts: { onFix?: (message: string) => void } = {}): BundleFiles {
  const raw = unzipSync(zip);
  if (raw['manifest.json']) return raw;

  const prefixes = new Set(Object.keys(raw).map((p) => p.split('/')[0]));
  for (const prefix of prefixes) {
    if (!raw[`${prefix}/manifest.json`]) continue;
    opts.onFix?.(`Bundle entries are nested under '${prefix}/'. A bundle must have manifest.json at its root (§2.2) — rebuild it with \`tome build\` rather than zipping the folder.`);
    const out: BundleFiles = {};
    for (const [path, bytes] of Object.entries(raw)) {
      if (path.startsWith(`${prefix}/`)) out[path.slice(prefix.length + 1)] = bytes;
    }
    return out;
  }
  return raw;
}
export function packBundle(files: BundleFiles): Uint8Array { return zipSync(files, { level: 6 }); }

export function readManifest(files: BundleFiles): Manifest {
  if (!files['manifest.json']) {
    const found = Object.keys(files).slice(0, 5).join(', ') || '(empty)';
    throw new Error(`This is not a course bundle: it has no manifest.json at the root. It contains: ${found}`);
  }
  return JSON.parse(td.decode(files['manifest.json']));
}

/** Every file except manifest/signature must be listed and match; every listed file must exist. */
export function verifyHashes(files: BundleFiles): string[] {
  const problems: string[] = [];
  const manifest = readManifest(files);
  const listed = manifest.contentHashes ?? {};
  for (const [p, h] of Object.entries(listed)) { if (!files[p]) problems.push(`listed but missing: ${p}`); else if (hashBytes(files[p]) !== h) problems.push(`hash mismatch: ${p}`); }
  for (const p of Object.keys(files)) if (!['manifest.json', 'signature.json'].includes(p) && !(p in listed) && !p.endsWith('/')) problems.push(`not listed in contentHashes: ${p}`);
  return problems;
}

export function signManifest(manifestBytes: Uint8Array, privateKeyHex: string, keyId: string, now = new Date()): Signature {
  const sig = ed.sign(manifestBytes, privateKeyHex);
  return { algorithm: 'Ed25519', keyId, signedAt: now.toISOString(), manifestHash: hashBytes(manifestBytes), signature: b64.enc(sig), publicKey: bytesToHex(ed.getPublicKey(privateKeyHex)) };
}

export function signBundle(files: BundleFiles, privateKeyHex: string, keyId: string): BundleFiles {
  return { ...files, 'signature.json': te.encode(JSON.stringify(signManifest(files['manifest.json'], privateKeyHex, keyId), null, 2)) };
}

export type VerifyResult = { ok: true; keyId: string } | { ok: false; reason: string };

/** Signature over raw manifest bytes, against pinned keys. Unsigned bundles are rejected here; developer mode is the caller's decision. */
export function verifySignature(files: BundleFiles, trusted: TrustedKey[], now = new Date()): VerifyResult {
  if (!files['signature.json']) return { ok: false, reason: 'unsigned' };
  let sig: Signature;
  try { sig = JSON.parse(td.decode(files['signature.json'])); } catch { return { ok: false, reason: 'signature.json unreadable' }; }
  if (sig.algorithm !== 'Ed25519') return { ok: false, reason: `unsupported algorithm ${sig.algorithm}` };
  const key = trusted.find((k) => k.keyId === sig.keyId);
  if (!key) return { ok: false, reason: `unknown key ${sig.keyId}` };
  if (key.expires && new Date(key.expires) < new Date(sig.signedAt)) return { ok: false, reason: `key ${sig.keyId} expired before signing` };
  const m = files['manifest.json'];
  if (hashBytes(m) !== sig.manifestHash) return { ok: false, reason: 'manifest hash mismatch' };
  try { if (!ed.verify(b64.dec(sig.signature), m, key.publicKey)) return { ok: false, reason: 'bad signature' }; } catch (e) { return { ok: false, reason: 'bad signature' }; }
  void now;
  return { ok: true, keyId: sig.keyId };
}

/** A short, readable form of a public key, so a learner can tell two authors apart: "3c93 19c1 3ce7 501c". */
export const keyFingerprint = (publicKeyHex: string) => bytesToHex(sha256(hexToBytes(publicKeyHex))).slice(0, 16).replace(/(.{4})(?!$)/g, '$1 ');
const hexToBytes = (h: string) => Uint8Array.from(h.match(/.{2}/g) ?? [], (b) => parseInt(b, 16));

/**
 * An author's own signature (§4): signed with a key that is not one of the platform's. It cannot say who the
 * author is — anyone can make a key — but it does prove the course is unchanged since the holder of that key
 * signed it, and the fingerprint stays the same across everything that author signs.
 */
export function verifyAuthorSignature(files: BundleFiles): { keyId: string; fingerprint: string } | null {
  if (!files['signature.json']) return null;
  let sig: Signature;
  try { sig = JSON.parse(td.decode(files['signature.json'])); } catch { return null; }
  if (sig.algorithm !== 'Ed25519' || !sig.publicKey || !/^[a-f0-9]{64}$/.test(sig.publicKey)) return null;
  const m = files['manifest.json'];
  if (!m || hashBytes(m) !== sig.manifestHash) return null;
  try { if (!ed.verify(b64.dec(sig.signature), m, sig.publicKey)) return null; } catch { return null; }
  return { keyId: sig.keyId, fingerprint: keyFingerprint(sig.publicKey) };
}

export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const priv = ed.utils.randomPrivateKey();
  return { privateKey: bytesToHex(priv), publicKey: bytesToHex(ed.getPublicKey(priv)) };
}

/** Full check used by players before opening a bundle. */
export function verifyBundle(files: BundleFiles, trusted: TrustedKey[]): { hashes: string[]; signature: VerifyResult; manifest: Manifest } {
  const manifest = readManifest(files);
  return { hashes: verifyHashes(files), signature: verifySignature(files, trusted), manifest };
}
