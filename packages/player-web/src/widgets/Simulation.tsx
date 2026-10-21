import { useEffect, useMemo, useRef, useState } from 'react';
import { expr } from '@tome/core';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';
import { NAMED, SERIES } from '../lib/palette.ts';

type Ex = string | number;
interface Param { name: string; label?: string; min: number; max: number; step?: number; value?: number; default?: number; unit?: string }
interface Shape { kind: 'circle' | 'rect' | 'line' | 'text'; repeat?: number | string; when?: Ex; color?: string; opacity?: Ex; width?: Ex; text?: string; [k: string]: any }
interface Def {
  id: string; prompt: string; state: Record<string, number>; step: Record<string, Ex>; dt?: number;
  params?: Param[]; stopWhen?: Ex; readouts?: { label: string; expr: Ex; precision?: number; unit?: string }[];
  trace?: { x: Ex; y?: [number, number]; series: { expr: Ex; label?: string }[] };
  scene?: { viewBox?: [number, number, number, number]; shapes: Shape[] };
  autoplay?: boolean; description?: string;
  answer?: { kind: 'text'; accept: string[] } | { kind: 'numeric'; answer: number; tolerance?: number };
  hint?: string; explanation?: string; solutionAfterAttempts?: number;
}

/** Fallback text alternative (§7.11): the readouts and where the model has got to. */
function describeModel(def: Def, vars: Record<string, number>): string {
  const r = (def.readouts ?? []).map((x) => `${x.label} ${ev(x.expr, vars).toFixed(x.precision ?? 2)}${x.unit ?? ''}`).join(', ');
  return `Running model at t = ${(vars.t ?? 0).toFixed(2)}${r ? `. ${r}` : ''}.`;
}

const COLORS = NAMED;
const MAX_INSTANCES = 4000;
const ev = (e: Ex | undefined, vars: Record<string, number>, fallback = 0) => { if (e === undefined) return fallback; try { const v = expr.evalExpr(e, vars); return Number.isFinite(v) ? v : fallback; } catch { return fallback; } };

/**
 * Declarative model: state + a step rule in the §7.5 expression language + a view. No author code, and no
 * random() in the expression language, so every learner sees the same numbers — otherwise a question about
 * the model would not have one answer.
 */
export function Simulation({ def, courseId }: WidgetProps<Def>) {
  const st = useWidgetState<{ attempts: number }>(courseId, def.id);
  // `dt` may also be a slider: an author who exposes the time step expects moving it to change the step,
  // and silently ignoring the param is worse than either honouring it or rejecting it.
  const dtOf = (p: Record<string, number>) => p.dt ?? def.dt ?? 0.05;
  const initialParams = useMemo(() => Object.fromEntries((def.params ?? []).map((p) => [p.name, p.value ?? p.default ?? (p.min + p.max) / 2])), [def]);
  const [params, setParams] = useState<Record<string, number>>(initialParams);
  const [state, setState] = useState<Record<string, number>>({ ...def.state, t: 0 });
  const [running, setRunning] = useState(!!def.autoplay);
  const [trace, setTrace] = useState<{ x: number; ys: number[] }[]>([]);
  const [stopped, setStopped] = useState(false);
  const [budget, setBudget] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);
  const raf = useRef<number | null>(null);
  const live = useRef({ state, params, trace });
  live.current = { state, params, trace };

  const tick = () => {
    const { state: s, params: p } = live.current;
    const dt = dtOf(p);
    const vars = { ...p, ...s };
    if (def.stopWhen !== undefined && ev(def.stopWhen, vars)) { setRunning(false); setStopped(true); return; }
    // All right-hand sides read the previous state, so the order of keys cannot change the result.
    const next: Record<string, number> = { ...s, t: s.t + dt };
    for (const [k, e] of Object.entries(def.step)) next[k] = ev(e, { ...vars, dt }, s[k]);
    setState(next);
    if (def.trace) {
      const tv = { ...p, ...next, dt };
      setTrace((old) => [...old.slice(-1999), { x: ev(def.trace!.x, tv), ys: def.trace!.series.map((se) => ev(se.expr, tv)) }]);
    }
  };

  useEffect(() => {
    if (!running) return;
    let last = performance.now(), acc = 0;
    const loop = (now: number) => {
      acc += Math.min(now - last, 100); last = now;
      const budgetStart = performance.now();
      while (acc >= 1000 / 60) { tick(); acc -= 1000 / 60; if (performance.now() - budgetStart > 12) { setBudget('This model is running slower than real time on this device.'); break; } }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [running, def]);

  const reset = () => { setRunning(false); setStopped(false); setBudget(null); setState({ ...def.state, t: 0 }); setTrace([]); };
  const vars = { ...params, ...state, dt: dtOf(params) };

  const succeed = () => { setResult(true); st.save({ attempts }, true); };
  const fail = () => { setResult(false); setAttempts(attempts + 1); st.save({ attempts: attempts + 1 }); };
  const check = () => {
    const a = def.answer!;
    if (a.kind === 'numeric') { const v = Number(text.replace(',', '.')); Number.isFinite(v) && Math.abs(v - a.answer) <= (a.tolerance ?? 0) ? succeed() : fail(); return; }
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    a.accept.some((x) => norm(x) === norm(text)) ? succeed() : fail();
  };

  // ── scene ────────────────────────────────────────────────────────────────
  const scene = def.scene;
  const shapes: JSX.Element[] = [];
  if (scene) {
    let count = 0;
    scene.shapes.forEach((sh, si) => {
      const n = sh.repeat === undefined ? 1 : Math.max(0, Math.floor(ev(sh.repeat, vars)));
      for (let i = 0; i < n && count < MAX_INSTANCES; i++, count++) {
        const v = { ...vars, i };
        if (sh.when !== undefined && !ev(sh.when, v, 1)) continue; // skip this instance entirely
        const col = COLORS[sh.color ?? 'primary'] ?? COLORS.primary;
        const op = sh.opacity === undefined ? 1 : ev(sh.opacity, v, 1);
        const key = `${si}-${i}`;
        if (sh.kind === 'circle') shapes.push(<circle key={key} cx={ev(sh.cx, v)} cy={ev(sh.cy, v)} r={ev(sh.r, v, 1)} fill={col} opacity={op} />);
        else if (sh.kind === 'rect') shapes.push(<rect key={key} x={ev(sh.x, v)} y={ev(sh.y, v)} width={Math.max(0, ev(sh.w, v))} height={Math.max(0, ev(sh.h, v))} fill={col} opacity={op} />);
        else if (sh.kind === 'line') shapes.push(<line key={key} x1={ev(sh.x1, v)} y1={ev(sh.y1, v)} x2={ev(sh.x2, v)} y2={ev(sh.y2, v)} stroke={col} strokeWidth={ev(sh.width, v, 1)} opacity={op} />);
        else shapes.push(<text key={key} x={ev(sh.x, v)} y={ev(sh.y, v)} fill={col} opacity={op} className="sim-text">{sh.text ?? ''}</text>);
      }
    });
  }

  // ── trace ────────────────────────────────────────────────────────────────
  const TW = 640, TH = 220, PAD = { l: 46, r: 12, t: 10, b: 28 };
  const tr = def.trace;
  const xs = trace.map((p) => p.x);
  const yAll = trace.flatMap((p) => p.ys).filter(Number.isFinite);
  const yr = tr?.y ?? [Math.min(0, ...yAll), Math.max(1, ...yAll)];
  const xr: [number, number] = [Math.min(...xs, 0), Math.max(...xs, 1)];
  const sx = (x: number) => PAD.l + ((x - xr[0]) / (xr[1] - xr[0] || 1)) * (TW - PAD.l - PAD.r);
  const sy = (y: number) => TH - PAD.b - ((y - yr[0]) / (yr[1] - yr[0] || 1)) * (TH - PAD.t - PAD.b);
  const PALETTE = SERIES.slice(0, 4);

  return (
    <Frame kind="Model" complete={st.complete} graded={!!def.answer}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      {scene && (
        <svg className="sim-scene" viewBox={(scene.viewBox ?? [0, 0, 100, 60]).join(' ')} role="img" aria-label={def.description ?? describeModel(def, vars)}>
          {shapes}
        </svg>
      )}
      {tr && (
        <svg className="sim-trace" viewBox={`0 0 ${TW} ${TH}`} role="img" aria-label={def.description ?? describeModel(def, vars)}>
          <g className="axes"><line x1={PAD.l} x2={TW - PAD.r} y1={sy(Math.max(yr[0], 0))} y2={sy(Math.max(yr[0], 0))} /><line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={TH - PAD.b} /></g>
          <g className="ticks">
            <text x={PAD.l - 6} y={sy(yr[1]) + 4} textAnchor="end">{+yr[1].toFixed(2)}</text>
            <text x={PAD.l - 6} y={sy(yr[0]) + 4} textAnchor="end">{+yr[0].toFixed(2)}</text>
            <text x={TW - PAD.r} y={TH - 8} textAnchor="end">{+xr[1].toFixed(1)}</text>
          </g>
          {tr.series.map((se, i) => (
            <path key={i} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth={2}
              d={trace.map((p, j) => `${j ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.ys[i]).toFixed(1)}`).join('')} />
          ))}
        </svg>
      )}
      {tr && tr.series.some((s) => s.label) && (
        <ul className="legend">{tr.series.map((s, i) => s.label && <li key={i}><i style={{ background: PALETTE[i % PALETTE.length] }} /><Md src={s.label} /></li>)}</ul>
      )}
      {def.readouts && (
        <dl className="readouts">
          {def.readouts.map((r, i) => <div key={i}><dt><Md src={r.label} /></dt><dd>{ev(r.expr, vars).toFixed(r.precision ?? 2)}{r.unit ?? ''}</dd></div>)}
        </dl>
      )}
      <div className="row sim-controls">
        <button className="btn primary" onClick={() => { if (stopped) reset(); setRunning(!running); }}>{running ? '❙❙ Pause' : stopped ? '↻ Run again' : '▶ Run'}</button>
        <button className="btn small" onClick={reset}>Reset</button>
        <span className="dim small">t = {state.t.toFixed(2)}{stopped ? ' · stopped' : ''}</span>
      </div>
      {(def.params ?? []).map((p) => (
        <label key={p.name} className="sim-param">
          <span><Md src={p.label ?? p.name} /> <strong>{params[p.name].toFixed(2)}{p.unit ?? ''}</strong></span>
          <input type="range" min={p.min} max={p.max} step={p.step ?? (p.max - p.min) / 100} value={params[p.name]}
            onChange={(e) => setParams({ ...params, [p.name]: Number(e.target.value) })} aria-label={p.label ?? p.name} />
        </label>
      ))}
      {budget && <p className="dim small">{budget}</p>}
      {def.answer && !st.complete && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); check(); }}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your answer" placeholder={def.answer.kind === 'numeric' ? 'a number' : 'your answer'} />
          <button className="btn primary" type="submit" disabled={!text.trim()}>Check</button>
        </form>
      )}
      {def.answer && <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true),
          content: <>Answer: <strong>{def.answer.kind === 'numeric' ? def.answer.answer : def.answer.accept[0]}</strong></> }}>
        {result ? 'Correct.' : 'Not quite — try running it again and watching the numbers.'}
      </Feedback>}
    </Frame>
  );
}
