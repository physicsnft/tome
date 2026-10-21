/**
 * Asset limits from SPEC §2.3, which the spec says a validator MUST enforce and which, until now, nothing
 * checked: a 9000-pixel image validated cleanly. Also a size report, because an author of an image-heavy
 * course needs to see what their bundle weighs before sending it.
 */
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const MiB = 1024 * 1024;
const LIMITS: Record<string, { bytes: number; kind: string }> = {
  '.png': { bytes: 10 * MiB, kind: 'image' }, '.jpg': { bytes: 10 * MiB, kind: 'image' }, '.jpeg': { bytes: 10 * MiB, kind: 'image' },
  '.webp': { bytes: 10 * MiB, kind: 'image' }, '.svg': { bytes: 10 * MiB, kind: 'image' }, '.gif': { bytes: 10 * MiB, kind: 'image' },
  '.mp4': { bytes: 500 * MiB, kind: 'video' },
  '.mp3': { bytes: 50 * MiB, kind: 'audio' }, '.m4a': { bytes: 50 * MiB, kind: 'audio' }, '.ogg': { bytes: 50 * MiB, kind: 'audio' },
  '.json': { bytes: 5 * MiB, kind: 'animation' },
};
const MAX_PX = 8192;
/** Above this an image is legal but probably uncompressed — worth a nudge, not an error. */
const SOFT_IMAGE_BYTES = 2 * MiB;

/** Pixel dimensions from the file header, for the raster formats we accept. */
export function imageSize(buf: Buffer, ext: string): [number, number] | null {
  if (ext === '.png' && buf.length > 24 && buf.toString('ascii', 12, 16) === 'IHDR') return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (ext === '.jpg' || ext === '.jpeg') {
    let i = 2;
    while (i + 9 < buf.length && buf[i] === 0xff) {
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      i += 2 + len;
    }
    return null;
  }
  if (ext === '.webp' && buf.toString('ascii', 0, 4) === 'RIFF') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
    if (chunk === 'VP8L') { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
    if (chunk === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  }
  return null;
}

export const human = (b: number) => (b >= MiB ? `${(b / MiB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} kB`);

export function checkAssets(root: string, paths: string[], err: (f: string, m: string) => void, warn: (f: string, m: string) => void) {
  const sizes: [string, number][] = [];
  for (const rel of paths) {
    const ext = extname(rel).toLowerCase();
    const bytes = statSync(`${root}/${rel}`).size;
    sizes.push([rel, bytes]);
    const limit = LIMITS[ext];
    if (!limit || !rel.startsWith('assets/')) continue;
    if (bytes > limit.bytes) err(rel, `${limit.kind} is ${human(bytes)}; the limit is ${human(limit.bytes)} (§2.3)`);
    if (limit.kind === 'image') {
      const dims = imageSize(readFileSync(`${root}/${rel}`), ext);
      if (dims && (dims[0] > MAX_PX || dims[1] > MAX_PX)) err(rel, `image is ${dims[0]}×${dims[1]} px; the limit is ${MAX_PX} px per side (§2.3). Scale it down — see "Images" in AUTHORING.md`);
      else if (bytes > SOFT_IMAGE_BYTES && ext !== '.svg') warn(rel, `image is ${human(bytes)}${dims ? ` (${dims[0]}×${dims[1]} px)` : ''}. Probably larger than it needs to be — see "Images" in AUTHORING.md`);
    }
  }
  return sizes;
}
