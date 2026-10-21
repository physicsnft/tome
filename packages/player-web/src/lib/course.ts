import { parseLesson, type Manifest, type ParsedLesson } from '@tome/core';
import { listInstalled, mimeFor, openInstalled, originOf, type Origin } from './store.ts';

export interface LoadedCourse {
  dir: string;             // courseId for installed courses, folder name for dev courses
  manifest: Manifest;
  lessons: ParsedLesson[]; // in manifest order
  assetUrl: (rel: string) => string;
  installed: boolean;
  /** Installed courses only: store, an author's own signed course, or an unsigned draft (§4). */
  origin?: { kind: Origin; fingerprint?: string };
  release?: () => void;    // revoke object URLs
}

/** Dev courses: unzipped in /public/courses/, used while authoring. Not part of the library. */
export async function listDevCourses(): Promise<string[]> {
  try { const r = await fetch('/courses/index.json'); return r.ok ? r.json() : []; } catch { return []; }
}

export async function loadDevCourse(dir: string): Promise<LoadedCourse> {
  const base = `/courses/${dir}/`;
  const manifest: Manifest = await (await fetch(base + 'manifest.json')).json();
  const paths = manifest.structure.flatMap((c) => c.lessons);
  const lessons = await Promise.all(paths.map(async (p) => parseLesson(p, await (await fetch(base + p)).text())));
  return { dir, manifest, lessons, assetUrl: (rel) => base + rel, installed: false };
}

/** Installed course: everything comes from the local bundle, so this works with no network at all. */
export async function loadInstalledCourse(courseId: string): Promise<LoadedCourse> {
  const { manifest, file } = await openInstalled(courseId);
  const rec = (await listInstalled()).find((r) => r.courseId === courseId);
  const origin = rec ? { kind: originOf(rec), fingerprint: rec.fingerprint } : undefined;
  const td = new TextDecoder();
  const paths = manifest.structure.flatMap((c) => c.lessons);
  const lessons = await Promise.all(paths.map(async (p) => parseLesson(p, td.decode((await file(p))!))));
  const urls = new Map<string, string>();
  const assetUrl = (rel: string) => {
    if (!urls.has(rel)) urls.set(rel, URL.createObjectURL(new Blob([], { type: mimeFor(rel) })));
    return urls.get(rel)!;
  };
  // Object URLs must be created from real bytes; build them eagerly for every asset in the manifest.
  for (const rel of Object.keys(manifest.contentHashes ?? {})) {
    if (rel.endsWith('.md')) continue;
    const bytes = await file(rel);
    if (bytes) urls.set(rel, URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeFor(rel) })));
  }
  return { dir: courseId, manifest, lessons, installed: true, origin, assetUrl: (rel) => urls.get(rel) ?? assetUrl(rel), release: () => { for (const u of urls.values()) URL.revokeObjectURL(u); urls.clear(); } };
}
