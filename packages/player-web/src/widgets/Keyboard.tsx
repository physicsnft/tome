import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { midiToPitch, pitchToMidi, playNote, type Instrument } from '../lib/sampler.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

interface Def {
  id: string; prompt: string; range?: [string, string]; labels?: 'none' | 'c-only' | 'all';
  answer: { kind: 'keys' | 'sequence'; accept: string[][] };
  given?: string[]; showAnswerAs?: 'keys' | 'score' | 'both'; octaveTolerant?: boolean;
  instrument?: Instrument; hint?: string; explanation?: string; solutionAfterAttempts?: number;
}

const BLACK = new Set([1, 3, 6, 8, 10]);
const WHITE_W = 34, WHITE_H = 130, BLACK_W = 21, BLACK_H = 82;

/** A piano as an answer surface: no theory engine, the author lists what counts (§7.3 keyboard). */
export function Keyboard({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ attempts: number }>(courseId, def.id);
  const [lo, hi] = (def.range ?? ['C4', 'C6']).map(pitchToMidi);
  const sequence = def.answer.kind === 'sequence';
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);
  const given = (def.given ?? []).map(pitchToMidi);
  const [focusKey, setFocusKey] = useState(() => { const c4 = pitchToMidi('C4'); return c4 >= lo && c4 <= hi ? c4 : lo; });

  const pc = (m: number) => ((m % 12) + 12) % 12;
  const same = (a: number[], b: number[]) => {
    const norm = (xs: number[]) => (def.octaveTolerant ? xs.map(pc) : xs);
    const A = norm(a), B = norm(b);
    if (A.length !== B.length) return false;
    return sequence ? A.every((v, i) => v === B[i]) : [...A].sort((x, y) => x - y).every((v, i) => v === [...B].sort((x, y) => x - y)[i]);
  };
  const accepted = def.answer.accept.map((set) => set.map(pitchToMidi));

  const press = (m: number) => {
    playNote(m, { duration: 1.4, instrument: def.instrument, assetUrl });
    if (st.complete) return;
    setResult(null);
    if (sequence) {
      const next = [...picked, m];
      setPicked(next);
      const target = accepted.find((a) => a.length >= next.length);
      // Wrong note in a sequence: say so immediately rather than after eight taps.
      if (target && !accepted.some((a) => same(a.slice(0, next.length), next))) { fail(); setPicked([]); return; }
      if (accepted.some((a) => same(a, next))) succeed();
    } else {
      setPicked(picked.includes(m) ? picked.filter((x) => x !== m) : [...picked, m]);
    }
  };
  const succeed = () => { setResult(true); st.save({ attempts }, true); };
  const fail = () => { setResult(false); setAttempts(attempts + 1); st.save({ attempts: attempts + 1 }); };
  const check = () => (accepted.some((a) => same(a, [...picked, ...given].filter((v, i, arr) => arr.indexOf(v) === i))) || accepted.some((a) => same(a, picked)) ? succeed() : fail());

  const whites: number[] = [], blacks: number[] = [];
  for (let m = lo; m <= hi; m++) (BLACK.has(pc(m)) ? blacks : whites).push(m);
  const xOf = (m: number) => {
    const i = whites.filter((w) => w < m).length;
    return BLACK.has(pc(m)) ? i * WHITE_W - BLACK_W / 2 : i * WHITE_W;
  };
  const W = whites.length * WHITE_W;
  const solution = showSol ? accepted[0] : [];
  const isOn = (m: number) => picked.includes(m) || given.includes(m);

  // One tab stop for the whole keyboard; arrow keys move between keys in pitch order (white and black
  // alike), Enter or Space presses. Previously each key was focusable but nothing activated it.
  const onKey = (e: React.KeyboardEvent, m: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(m); return; }
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(hi, Math.max(lo, m + step));
    setFocusKey(next);
    (e.currentTarget.parentElement?.querySelector(`[data-midi="${next}"]`) as SVGGElement | null)?.focus();
  };
  const key = (m: number, black: boolean) => (
    <g key={m} data-midi={m} onClick={() => { setFocusKey(m); press(m); }} onKeyDown={(e) => onKey(e, m)} className="kbd-key" role="button"
      aria-label={`${midiToPitch(m)}${isOn(m) ? ', pressed' : ''}`} aria-pressed={isOn(m)} tabIndex={m === focusKey ? 0 : -1}>
      <rect x={xOf(m)} y={0} width={black ? BLACK_W : WHITE_W - 1} height={black ? BLACK_H : WHITE_H} rx={3}
        className={`${black ? 'black' : 'white'} ${isOn(m) ? 'on' : ''} ${solution.includes(m) ? 'sol' : ''} ${given.includes(m) ? 'given' : ''}`} />
      {!black && (def.labels === 'all' || ((def.labels ?? 'c-only') === 'c-only' && pc(m) === 0)) &&
        <text x={xOf(m) + WHITE_W / 2 - 0.5} y={WHITE_H - 10} className="kbd-label">{midiToPitch(m)}</text>}
    </g>
  );

  return (
    <Frame kind={sequence ? 'Play the notes in order' : 'Press the keys'} complete={st.complete}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <svg className="keyboard" viewBox={`0 0 ${W} ${WHITE_H}`} role="group" aria-label="Piano keyboard">
        {whites.map((m) => key(m, false))}
        {blacks.map((m) => key(m, true))}
      </svg>
      <div className="row kbd-controls">
        <span className="dim small">{picked.length ? picked.map(midiToPitch).join(' · ') : 'Nothing pressed yet'}</span>
        {!!picked.length && !st.complete && <button className="btn ghost small" onClick={() => { setPicked([]); setResult(null); }}>Clear</button>}
        {!sequence && !st.complete && <button className="btn primary" onClick={check} disabled={!picked.length}>Check</button>}
      </div>
      <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true), content: <>Answer: {accepted[0].map(midiToPitch).join(' · ')}</> }}>
        {result ? 'Correct.' : sequence ? 'Wrong note — start again.' : 'Not those notes.'}
      </Feedback>
    </Frame>
  );
}
