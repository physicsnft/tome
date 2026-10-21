/** Download with progress + install. Resumable-ready shape: the shell will swap fetch for a native downloader. */
import { installBundle, InstallError, type Installed } from './store.ts';
import type { TrustedKey } from '@tome/core';
import { API } from './api.ts';
import { freePreview } from './preview.ts';
import { anonymousId, session } from './account.ts';

export type Phase = 'downloading' | 'verifying' | 'installing' | 'done' | 'error';
export interface DownloadState { phase: Phase; received: number; total: number; error?: string }

/** The server answered, and said no. Anything else thrown by fetch means it could not be reached. */
export class HttpError extends Error {}

let keysP: Promise<TrustedKey[]> | null = null;
export const trustedKeys = () => (keysP ??= fetch('/trusted-keys.json').then((r) => r.json()).catch(() => [] as TrustedKey[]));

export async function downloadAndInstall(url: string, onProgress: (s: DownloadState) => void, opts: { headers?: Record<string, string> } = {}): Promise<Installed> {
  onProgress({ phase: 'downloading', received: 0, total: 0 });
  const res = await fetch(url, { headers: opts.headers });
  if (!res.ok) throw new HttpError((await res.json().catch(() => null))?.error ?? `Download failed (${res.status})`);
  const total = Number(res.headers.get('content-length') ?? 0);
  const chunks: Uint8Array[] = []; let received = 0;
  const reader = res.body!.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); received += value.length;
    onProgress({ phase: 'downloading', received, total });
  }
  const zip = new Uint8Array(received); let o = 0; for (const c of chunks) { zip.set(c, o); o += c.length; }
  onProgress({ phase: 'verifying', received, total: received });
  const rec = await installBundle(zip, await trustedKeys());
  onProgress({ phase: 'done', received, total: received });
  return rec;
}

/**
 * Download a course you own. The store issues a personal copy with your name in it (§3.4). With no platform to
 * reach — the offline demo, the Android prototype — the catalog's master copy is used instead. A production
 * store serves only personal copies.
 */
export async function downloadOwned(entry: { courseId: string; bundleUrl: string }, onProgress: (s: DownloadState) => void): Promise<Installed> {
  if (freePreview) return downloadAndInstall(entry.bundleUrl, onProgress); // no platform yet: the catalog's copy
  const headers: Record<string, string> = {}; const s = session(); if (s) headers.authorization = `Bearer ${s}`;
  const personal = `${API}/download/${encodeURIComponent(entry.courseId)}${s ? '' : `?anonymousId=${encodeURIComponent(anonymousId())}`}`;
  try { return await downloadAndInstall(personal, onProgress, { headers }); }
  catch (e) {
    // Reachable and refused (not owned, unknown course), or a bad bundle: show why. Otherwise the platform could
    // not be reached — fetch's error differs between browsers and the native HTTP bridge, so do not test its type.
    if (e instanceof HttpError || e instanceof InstallError) throw e;
    return downloadAndInstall(entry.bundleUrl, onProgress);
  }
}
