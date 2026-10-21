import { useEffect, useMemo, useRef, useState } from 'react';
import abcjs from 'abcjs';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { playSequence, type Instrument, type NoteEvent } from '../lib/sampler.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

interface Answer { kind: 'note' | 'notes' | 'bar' | 'text'; accept: (string | number)[] }
interface Def {
  id: string; abc: string; prompt?: string; play?: boolean; tempo?: number; tempoRange?: [number, number];
  transpose?: number; highlight?: { from: number; to: number; label?: string }[]; follow?: boolean;
  instrument?: Instrument; answer?: Answer; explanation?: string; hint?: string; solutionAfterAttempts?: number;
}

/** ABC needs an X: line; authors are allowed to leave it out (§7.8). */
const normalise = (abc: string) => (/^X:/m.test(abc) ? abc : `X:1\n${abc}`);

export function Score({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ attempts: number }>(courseId, def.id);
  const host = useRef<HTMLDivElement>(null);
  const tuneRef = useRef<any>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [tempo, setTempo] = useState(def.tempo ?? 90);
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);
  const graded = !!def.answer;

  /** Render, then index every note element by "bar:index" so answers can address them. */
  useEffect(() => {
    if (!host.current) return;
    const tunes = abcjs.renderAbc(host.current, normalise(def.abc), {
      responsive: 'resize', add_classes: true, staffwidth: 640,
      visualTranspose: def.transpose ?? 0, selectTypes: false,
    });
    tuneRef.current = tunes[0];
    // Walk the rendered SVG: notes carry .abcjs-note, bar lines .abcjs-bar.
    const svg = host.current.querySelector('svg');
    if (!svg) return;
    // abcjs labels its SVG "Sheet Music"; that would win over our note-by-note description, so hide it
    // from the accessibility tree and let the wrapper carry the label.
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('role');
    let bar = 1, idx = 0;
    const els = Array.from(svg.querySelectorAll<SVGGElement>('g.abcjs-note, g.abcjs-bar'));
    for (const el of els) {
      if (el.classList.contains('abcjs-bar')) { bar++; idx = 0; continue; }
      if (el.classList.contains('abcjs-rest')) continue;
      idx++;
      el.dataset.addr = `${bar}:${idx}`;
      el.dataset.bar = String(bar);
      // Note heads are ~6 px tall and the staff lines sit on top of them. Give each note a finger-sized
      // hit area of its own, or the widget is unusable on a phone (and untappable even with a mouse).
      try {
        const bb = el.getBBox();
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hit.setAttribute('x', String(bb.x - 5)); hit.setAttribute('y', String(bb.y - 4));
        hit.setAttribute('width', String(Math.max(bb.width + 10, 22)));
        hit.setAttribute('height', String(Math.max(bb.height + 8, 30)));
        hit.setAttribute('class', 'note-hit'); hit.setAttribute('fill', 'transparent');
        el.appendChild(hit);
      } catch { /* getBBox needs a laid-out SVG; skip if not */ }
    }
    // Author highlights (bar ranges)
    for (const h of def.highlight ?? []) {
      for (const el of els) {
        const b = Number(el.dataset.bar ?? 0);
        if (b >= h.from && b <= h.to) el.classList.add('score-marked');
      }
    }
    return () => { if (host.current) host.current.innerHTML = ''; };
  }, [def.abc, def.transpose]);

  /** Note events in seconds, from abcjs's own audio model, so what plays matches what is drawn. */
  const events = useMemo<NoteEvent[]>(() => {
    try {
      const tune = abcjs.parseOnly(normalise(def.abc))[0] as any;
      const audio = tune.setUpAudio({ visualTranspose: def.transpose ?? 0 });
      const spw = (60 / tempo) * 4; // seconds per whole note, assuming a quarter-note beat
      return (audio.tracks.flat() as any[])
        .filter((e) => e.cmd === 'note' && typeof e.pitch === 'number')
        .map((e) => ({ midi: e.pitch + (def.transpose ?? 0), start: e.start * spw, duration: Math.max(0.12, e.duration * spw) }));
    } catch { return []; }
  }, [def.abc, def.transpose, tempo]);

  const stop = () => { stopRef.current?.(); stopRef.current = null; setPlaying(false); clearFollow(); };
  const clearFollow = () => host.current?.querySelectorAll('.score-playing').forEach((e) => e.classList.remove('score-playing'));

  const play = async () => {
    if (playing) return stop();
    setPlaying(true);
    stopRef.current = await playSequence(events, { instrument: def.instrument, assetUrl });
    if (def.follow !== false) {
      const els = Array.from(host.current?.querySelectorAll<SVGGElement>('g.abcjs-note[data-addr]') ?? []);
      const t0 = performance.now();
      const tick = () => {
        if (!stopRef.current) return;
        const now = (performance.now() - t0) / 1000;
        clearFollow();
        const i = events.findIndex((e) => now >= e.start && now < e.start + e.duration);
        if (i >= 0 && els[i]) els[i].classList.add('score-playing');
        if (now < (events.at(-1)?.start ?? 0) + (events.at(-1)?.duration ?? 0)) requestAnimationFrame(tick);
        else stop();
      };
      requestAnimationFrame(tick);
    }
  };
  useEffect(() => () => stop(), []);

  const clickNote = (e: React.MouseEvent) => {
    const g = (e.target as Element).closest('g[data-addr]') as HTMLElement | null;
    if (g) pickNote(g);
  };
  const pickNoteRef = useRef<(g: HTMLElement) => void>(() => {});
  const pickNote = (g: HTMLElement) => {
    if (!graded || st.complete || def.answer!.kind === 'text') return;
    const addr = def.answer!.kind === 'bar' ? g.dataset.bar! : g.dataset.addr!;
    const kind = def.answer!.kind;
    if (kind === 'notes') { setSel(sel.includes(addr) ? sel.filter((a) => a !== addr) : [...sel, addr]); return; }
    check([addr]);
  };
  pickNoteRef.current = pickNote;

  /**
   * Keyboard access to the notes. abcjs draws plain SVG, so focus and keys are attached to the DOM it
   * produced: one tab stop for the score, Left/Right to move between notes, Enter or Space to choose.
   * Notes were neither focusable nor choosable by keyboard before.
   */
  useEffect(() => {
    const svg = host.current?.querySelector('svg');
    if (!svg || !graded || def.answer!.kind === 'text') return;
    const notes = Array.from(svg.querySelectorAll<SVGGElement>('g[data-addr]'));
    notes.forEach((g, i) => {
      g.setAttribute('tabindex', i === 0 ? '0' : '-1');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Bar ${g.dataset.bar}, note ${g.dataset.addr!.split(':')[1]}${events[i] ? `, ${midiName(events[i].midi)}` : ''}`);
      g.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickNoteRef.current(g as unknown as HTMLElement); return; }
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = notes[Math.min(notes.length - 1, Math.max(0, i + step))];
        g.setAttribute('tabindex', '-1'); next.setAttribute('tabindex', '0'); next.focus();
      };
    });
    // The wrapper keeps the whole score's description; the notes become the interactive layer.
    svg.removeAttribute('aria-hidden');
  }, [def.abc, def.transpose, graded, events]);

  const check = (picked: string[]) => {
    const accept = def.answer!.accept.map(String);
    const ok = def.answer!.kind === 'notes'
      ? picked.length === accept.length && picked.every((p) => accept.includes(p))
      : accept.includes(picked[0]);
    setSel(picked); setResult(ok);
    if (ok) st.save({ attempts }, true); else { setAttempts(attempts + 1); st.save({ attempts: attempts + 1 }); }
  };
  const checkText = () => {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const ok = def.answer!.accept.map(String).some((a) => norm(a) === norm(text));
    setResult(ok);
    if (ok) st.save({ attempts }, true); else { setAttempts(attempts + 1); st.save({ attempts: attempts + 1 }); }
  };

  // Reflect selection + revealed solution in the SVG.
  useEffect(() => {
    const els = host.current?.querySelectorAll<SVGGElement>('g[data-addr]') ?? [];
    const accept = (def.answer?.accept ?? []).map(String);
    els.forEach((el) => {
      const addr = def.answer?.kind === 'bar' ? el.dataset.bar! : el.dataset.addr!;
      el.classList.toggle('score-picked', sel.includes(addr));
      el.classList.toggle('score-solution', showSol && accept.includes(addr));
    });
  }, [sel, showSol, result]);

  const describe = () => {
    const names = events.map((e) => midiName(e.midi)).join(' ');
    return `Notation: ${names || 'no notes'}`;
  };

  return (
    <Frame kind={graded ? 'Read the score' : 'Score'} complete={st.complete} graded={graded}>
      {def.prompt && <div className="prompt"><Md src={def.prompt} block /></div>}
      <div className={`score ${graded && def.answer!.kind !== 'text' ? 'clickable' : ''}`} onClick={clickNote}>
        <div ref={host} role={graded && def.answer!.kind !== 'text' ? 'group' : 'img'} aria-label={describe()} />
      </div>
      <div className="row score-controls">
        {def.play !== false && <button type="button" className="btn small" onClick={play}>{playing ? '■ Stop' : '▶ Play'}</button>}
        {def.tempoRange && (
          <label className="small dim tempo">
            {tempo} bpm
            <input type="range" min={def.tempoRange[0]} max={def.tempoRange[1]} value={tempo} onChange={(e) => { stop(); setTempo(Number(e.target.value)); }} aria-label="Tempo" />
          </label>
        )}
        {(def.highlight ?? []).filter((h) => h.label).map((h, i) => <span key={i} className="badge amber"><Md src={h.label!} /></span>)}
      </div>
      {graded && def.answer!.kind === 'notes' && !st.complete && <button className="btn primary" onClick={() => check(sel)} disabled={!sel.length}>Check</button>}
      {graded && def.answer!.kind === 'text' && !st.complete && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); checkText(); }}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your answer" placeholder="e.g. G major" />
          <button className="btn primary" type="submit" disabled={!text.trim()}>Check</button>
        </form>
      )}
      {graded && <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true) }}>
        {result ? 'Correct.' : 'Not that one.'}
      </Feedback>}
    </Frame>
  );
}

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiName = (n: number) => `${SHARP[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
