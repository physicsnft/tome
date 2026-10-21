import { useMemo } from 'react';
import { expr } from '@tome/core';
import { Md } from '../render/Inline.tsx';
import { Frame } from './common.tsx';
import type { WidgetProps } from './index.tsx';
import { SERIES } from '../lib/palette.ts';

export interface Series { expr?: string; points?: [number, number][]; label?: string; style?: 'line' | 'dashed' | 'dots' | 'bars' | 'area' }
export interface PlotDef { id?: string; description?: string; expr?: string; series?: Series[]; x: [number, number] | { labels: string[]; label?: string }; y?: [number, number]; samples?: number; axes?: { xLabel?: string; yLabel?: string; grid?: boolean }; caption?: string; source?: string }

const PALETTE = SERIES;
const W = 640, H = 360, PAD = { l: 52, r: 16, t: 16, b: 44 };

/** Static plot: expression or data series; numeric or categorical x axis (§7.3 plot, 0.3 additions). */
export function Plot({ def }: WidgetProps<PlotDef>) {
  return <Frame kind="Chart" graded={false}><PlotView def={def} /></Frame>;
}

/**
 * The chart itself, shared by the `plot` widget and by `slider-explore`, which passes live slider values
 * in `vars`. One renderer, so the two cannot drift apart again.
 */
export function PlotView({ def, vars = {} }: { def: PlotDef; vars?: Record<string, number> }) {
  const categorical = !Array.isArray(def.x);
  const labels = categorical ? (def.x as { labels: string[] }).labels : null;
  // `expr` is sugar for a single series (§7.3 slider-explore).
  const series: Series[] = def.series ?? (def.expr !== undefined ? [{ expr: def.expr }] : []);
  const data = useMemo(() => series.map((s) => {
    if (s.points) return s.points;
    const [x0, x1] = categorical ? [0, labels!.length - 1] : (def.x as [number, number]);
    const n = def.samples ?? 200; const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; let y = NaN; try { y = expr.evalExpr(s.expr!, { ...vars, x }); } catch { /* gap */ } pts.push([x, y]); }
    return pts;
  }), [def, vars]);
  const xs = categorical ? [-0.5, labels!.length - 0.5] : (def.x as [number, number]);
  const ysAll = data.flat().map((p) => p[1]).filter(Number.isFinite);
  const hasBars = series.some((s) => s.style === 'bars' || s.style === 'area');
  const ys = def.y ?? [Math.min(hasBars ? 0 : Infinity, ...ysAll), Math.max(hasBars ? 0 : -Infinity, ...ysAll)];
  const sx = (x: number) => PAD.l + ((x - xs[0]) / (xs[1] - xs[0])) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - ((y - ys[0]) / (ys[1] - ys[0] || 1)) * (H - PAD.t - PAD.b);
  const ticks = (a: number, b: number, n = 5) => { const step = niceStep((b - a) / n); const out: number[] = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10)); return out; };
  const xt = categorical ? labels!.map((_, i) => i) : ticks(xs[0], xs[1]), yt = ticks(ys[0], ys[1]);
  const barSeries = series.filter((s) => s.style === 'bars').length;
  const path = (pts: [number, number][], close = false) => { let d = '', open = false; for (const [x, y] of pts) { if (!Number.isFinite(y)) { open = false; continue; } d += `${open ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`; open = true; } if (close && pts.length) d += `L${sx(pts[pts.length - 1][0]).toFixed(1)},${sy(Math.max(ys[0], 0)).toFixed(1)}L${sx(pts[0][0]).toFixed(1)},${sy(Math.max(ys[0], 0)).toFixed(1)}Z`; return d; };
  const x0 = sy(Math.max(ys[0], Math.min(ys[1], 0)));
  return (
    <>
      <svg className="plot" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={def.description ?? describePlot(def, series, xs, ys)}>
        {(def.axes?.grid ?? true) && <g className="grid">{yt.map((v) => <line key={v} x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} />)}{!categorical && xt.map((v) => <line key={v} y1={PAD.t} y2={H - PAD.b} x1={sx(v)} x2={sx(v)} />)}</g>}
        <g className="axes"><line x1={PAD.l} x2={W - PAD.r} y1={x0} y2={x0} /><line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} /></g>
        <g className="ticks">{yt.map((v) => <text key={v} x={PAD.l - 8} y={sy(v) + 4} textAnchor="end">{fmt(v)}</text>)}{xt.map((v, i) => <text key={i} x={sx(v)} y={H - PAD.b + 18} textAnchor="middle">{categorical ? labels![i] : fmt(v)}</text>)}</g>
        {data.map((pts, i) => { const s = series[i], col = PALETTE[i % PALETTE.length]; const st = s.style ?? 'line';
          if (st === 'bars') { const bw = ((W - PAD.l - PAD.r) / (categorical ? labels!.length : pts.length)) * 0.7 / Math.max(1, barSeries), bi = series.slice(0, i).filter((q) => q.style === 'bars').length; return <g key={i} fill={col}>{pts.map(([x, y], j) => Number.isFinite(y) && <rect key={j} x={sx(x) - (bw * barSeries) / 2 + bi * bw} y={Math.min(sy(y), x0)} width={bw} height={Math.abs(sy(y) - x0)} rx={2} />)}</g>; }
          if (st === 'dots') return <g key={i} fill={col}>{pts.map(([x, y], j) => Number.isFinite(y) && <circle key={j} cx={sx(x)} cy={sy(y)} r={4} />)}</g>;
          if (st === 'area') return <g key={i}><path d={path(pts, true)} fill={col} fillOpacity={0.18} /><path d={path(pts)} fill="none" stroke={col} strokeWidth={2.5} /></g>;
          return <path key={i} d={path(pts)} fill="none" stroke={col} strokeWidth={2.5} strokeDasharray={st === 'dashed' ? '8 6' : undefined} strokeLinejoin="round" />; })}
        {def.axes?.xLabel && <text className="axis-label" x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle">{def.axes.xLabel}</text>}
        {def.axes?.yLabel && <text className="axis-label" transform={`translate(14 ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} textAnchor="middle">{def.axes.yLabel}</text>}
      </svg>
      {series.some((s) => s.label) && <ul className="legend">{series.map((s, i) => s.label && <li key={i}><i style={{ background: PALETTE[i % PALETTE.length] }} /><Md src={s.label} /></li>)}</ul>}
      {def.caption && <p className="caption"><Md src={def.caption} /></p>}
      {def.source && <p className="dim small"><Md src={def.source} /></p>}
    </>
  );
}
/**
 * Fallback text alternative (§7.11): what is on screen, when the author has not said what it means.
 * Never good enough on its own for a graded chart, which is why the validator warns in that case.
 */
function describePlot(def: PlotDef, series: Series[], xs: number[], ys: number[]): string {
  const names = series.map((s, i) => s.label ?? `series ${i + 1}`).join(', ');
  const kinds = [...new Set(series.map((s) => s.style ?? 'line'))].join(' and ');
  const x = Array.isArray(def.x) ? `x from ${fmt(xs[0])} to ${fmt(xs[1])}` : `x categories ${(def.x as any).labels.join(', ')}`;
  const caption = def.caption ? `: ${def.caption.replace(/\s*[.。]\s*$/, '')}` : '';
  return `Chart${caption}. ${series.length} ${kinds} ${series.length === 1 ? 'series' : 'series'} (${names}). ${x}, y from ${fmt(ys[0])} to ${fmt(ys[1])}.`;
}

function niceStep(raw: number) { const p = 10 ** Math.floor(Math.log10(raw || 1)); const r = raw / p; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p; }
function fmt(v: number) { return Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(1) : String(+v.toFixed(4)); }
