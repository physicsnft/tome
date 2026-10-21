/**
 * Offline sampler. Five synthesised piano samples ship with the app (public/soundfont); anything in
 * between is pitch-shifted from the nearest one. A course may supply its own samples as bundle assets.
 * Nothing is ever fetched from a third party — that is the whole reason we generate our own soundfont.
 */
export type Pitch = string; // scientific pitch, e.g. "F#4"

const NOTES: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function pitchToMidi(p: Pitch): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(p);
  if (!m) throw new Error(`Bad pitch ${p}`);
  return 12 * (Number(m[3]) + 1) + NOTES[m[1] + (m[2] ?? '')];
}
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const midiToPitch = (n: number) => `${SHARP[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;

const BUILT_IN = [36, 48, 60, 72, 84]; // C2…C6
const buffers = new Map<string, Promise<AudioBuffer>>();
let ctx: AudioContext | null = null;
const audioCtx = () => (ctx ??= new (window.AudioContext ?? (window as any).webkitAudioContext)());

async function load(url: string, key: string): Promise<AudioBuffer> {
  if (!buffers.has(key)) buffers.set(key, fetch(url).then((r) => r.arrayBuffer()).then((b) => audioCtx().decodeAudioData(b)));
  return buffers.get(key)!;
}

export interface Instrument { kind?: string; samples?: Record<string, string>; range?: [string, string] }

/** Resolve which sample to use for a midi note, and at what playback rate. */
function pick(midi: number, inst: Instrument | undefined, assetUrl?: (p: string) => string) {
  const custom = Object.entries(inst?.samples ?? {});
  if (custom.length && assetUrl) {
    let best = custom[0];
    for (const c of custom) if (Math.abs(pitchToMidi(c[0]) - midi) < Math.abs(pitchToMidi(best[0]) - midi)) best = c;
    return { url: assetUrl(best[1]), key: `c:${best[1]}`, rate: 2 ** ((midi - pitchToMidi(best[0])) / 12) };
  }
  const near = BUILT_IN.reduce((a, b) => (Math.abs(b - midi) < Math.abs(a - midi) ? b : a));
  return { url: `/soundfont/${midiToPitch(near)}.ogg`, key: `b:${near}`, rate: 2 ** ((midi - near) / 12) };
}

/** Play one note. Returns when scheduled, not when finished. */
export async function playNote(midi: number, opts: { when?: number; duration?: number; gain?: number; instrument?: Instrument; assetUrl?: (p: string) => string } = {}) {
  const c = audioCtx();
  if (c.state === 'suspended') await c.resume();
  const { url, key, rate } = pick(midi, opts.instrument, opts.assetUrl);
  const buf = await load(url, key);
  const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const g = c.createGain(); g.gain.value = opts.gain ?? 0.9;
  src.connect(g).connect(c.destination);
  const t0 = (opts.when ?? 0) + c.currentTime;
  src.start(t0);
  if (opts.duration) { // release, so held notes stop rather than ringing the whole sample
    const end = t0 + opts.duration;
    g.gain.setValueAtTime(g.gain.value, Math.max(t0, end - 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.12);
    src.stop(end + 0.15);
  }
  return src;
}

export interface NoteEvent { midi: number; start: number; duration: number }

/** Schedule a sequence (seconds). Returns a stop handle. */
export async function playSequence(events: NoteEvent[], opts: { instrument?: Instrument; assetUrl?: (p: string) => string; gain?: number } = {}) {
  const c = audioCtx();
  if (c.state === 'suspended') await c.resume();
  const srcs = await Promise.all(events.map((e) => playNote(e.midi, { ...opts, when: e.start, duration: e.duration, gain: opts.gain ?? 0.8 })));
  return () => srcs.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } });
}

/** Warm the cache so the first click is not late. */
export const preload = () => Promise.all(BUILT_IN.map((m) => load(`/soundfont/${midiToPitch(m)}.ogg`, `b:${m}`))).then(() => {});
