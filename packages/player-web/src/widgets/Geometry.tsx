import { useRef, useState, type ReactNode } from 'react';
import { expr } from '@tome/core';
import { Md } from '../render/Inline.tsx';
import { Frame } from './common.tsx';
import { Sliders, type Param } from './SliderExplore.tsx';
import type { WidgetProps } from './index.tsx';
import { NAMED } from '../lib/palette.ts';

export interface Scene { view: { x: [number, number]; y: [number, number]; grid?: boolean; axes?: boolean; aspect?: 'equal' | 'auto' }; shapes: any[]; caption?: string }
interface Def extends Scene { id: string; params?: Param[] }

const COLORS = NAMED;
const col = (c?: string) => COLORS[c ?? 'primary'] ?? COLORS.primary;
const ev = (e: string | number, vars: Record<string, number>) => { try { return expr.evalExpr(e, vars); } catch { return NaN; } };

/** Standalone geometry widget: owns its params. */
export function GeometryWidget({ def }: WidgetProps<Def>) {
  const [vars, setVars] = useState<Record<string, number>>(Object.fromEntries((def.params ?? []).map((p) => [p.name, p.default ?? p.min])));
  return (
    <Frame kind="Explore" graded={false}>
      <SceneView scene={def} vars={vars} params={def.params ?? []} onChange={(k, v) => setVars((s) => ({ ...s, [k]: v }))} onChange2={(a, av, b, bv) => setVars((s) => ({ ...s, [a]: av, [b]: bv }))} />
      {def.params && <Sliders params={def.params} vars={vars} onChange={(k, v) => setVars((s) => ({ ...s, [k]: v }))} />}
      {def.caption && <p className="caption"><Md src={def.caption} /></p>}
    </Frame>
  );
}

export function SceneView({ scene, vars, params, onChange, onChange2 = (a, av, b, bv) => { onChange(a, av); onChange(b, bv); } }: { scene: Scene; vars: Record<string, number>; params: Param[]; onChange: (k: string, v: number) => void; onChange2?: (a: string, av: number, b: string, bv: number) => void }) {
  const W = 560, H = scene.view.aspect === 'auto' ? 360 : undefined;
  const [x0, x1] = scene.view.x, [y0, y1] = scene.view.y;
  const height = H ?? Math.round((W * (y1 - y0)) / (x1 - x0));
  const sx = (x: number) => ((x - x0) / (x1 - x0)) * W;
  const sy = (y: number) => height - ((y - y0) / (y1 - y0)) * height;
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ bind: [string, string] } | null>(null);

  const toWorld = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: x0 + ((e.clientX - r.left) / r.width) * (x1 - x0), y: y1 - ((e.clientY - r.top) / r.height) * (y1 - y0) };
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const w = toWorld(e);
    const [px, py] = drag.current.bind;
    const snap = (name: string, v: number) => { const p = params.find((q) => q.name === name); if (!p) return v; const st = p.step ?? 0.1; return +Math.min(p.max, Math.max(p.min, Math.round(v / st) * st)).toFixed(6); };
    onChange2(px, snap(px, w.x), py, snap(py, w.y));
  };

  const ticks = (a: number, b: number) => { const step = niceStep(b - a); const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(6)); return out; };
  const pt = (c: [any, any]) => [sx(ev(c[0], vars)), sy(ev(c[1], vars))] as const;

  const els: ReactNode[] = scene.shapes.map((s, i) => {
    const c = col(s.color); const dash = s.dashed ? '6 5' : undefined;
    switch (s.kind) {
      case 'vector': { const [ax, ay] = pt(s.from ?? [0, 0]); const [bx, by] = pt(s.to); return <g key={i}><line x1={ax} y1={ay} x2={bx} y2={by} stroke={c} strokeWidth={2.5} strokeDasharray={dash} markerEnd={`url(#arrow-${s.color ?? 'primary'})`} />{s.label && <Label x={bx} y={by} dx={(bx - ax) / 2 > 0 ? 8 : -8} color={c} src={s.label} />}</g>; }
      case 'segment': { const [ax, ay] = pt(s.from); const [bx, by] = pt(s.to); return <g key={i}><line x1={ax} y1={ay} x2={bx} y2={by} stroke={c} strokeWidth={2} strokeDasharray={dash} />{s.label && <Label x={(ax + bx) / 2} y={(ay + by) / 2} dx={8} color={c} src={s.label} />}</g>; }
      case 'line': { const [px, py] = [ev(s.through[0], vars), ev(s.through[1], vars)]; const [dx, dy] = [ev(s.direction[0], vars), ev(s.direction[1], vars)]; const k = 1000; return <line key={i} x1={sx(px - dx * k)} y1={sy(py - dy * k)} x2={sx(px + dx * k)} y2={sy(py + dy * k)} stroke={c} strokeWidth={1.5} strokeDasharray={dash} />; }
      case 'circle': { const [cx, cy] = pt(s.center); const r = ev(s.radius, vars); return <ellipse key={i} cx={cx} cy={cy} rx={(r / (x1 - x0)) * W} ry={(r / (y1 - y0)) * height} fill={c} fillOpacity={s.fill ?? 0} stroke={c} strokeWidth={1.5} />; }
      case 'polygon': return <polygon key={i} points={s.points.map((p: any) => pt(p).join(',')).join(' ')} fill={c} fillOpacity={s.fill ?? 0} stroke={c} strokeWidth={1.5} />;
      case 'arc': { const [cx, cy] = [ev(s.center[0], vars), ev(s.center[1], vars)]; const r = ev(s.radius, vars); const a0 = (ev(s.from, vars) * Math.PI) / 180, a1 = (ev(s.to, vars) * Math.PI) / 180; const p0 = [sx(cx + r * Math.cos(a0)), sy(cy + r * Math.sin(a0))], p1 = [sx(cx + r * Math.cos(a1)), sy(cy + r * Math.sin(a1))]; const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0; const mid = (a0 + a1) / 2; return <g key={i}><path d={`M${p0} A${(r / (x1 - x0)) * W} ${(r / (y1 - y0)) * height} 0 ${large} 0 ${p1}`} fill="none" stroke={c} strokeWidth={1.5} />{s.label && <Label x={sx(cx + r * 1.5 * Math.cos(mid))} y={sy(cy + r * 1.5 * Math.sin(mid))} color={c} src={s.label} />}</g>; }
      case 'text': { const [x, y] = pt(s.at); return <Label key={i} x={x} y={y} color={c} src={s.text} />; }
      case 'point': { const [x, y] = pt(s.at); const draggable = !!s.bind; return <g key={i} className={draggable ? 'draggable' : ''} onPointerDown={draggable ? (e) => { e.preventDefault(); drag.current = { bind: s.bind }; svg.current!.setPointerCapture(e.pointerId); } : undefined}><circle cx={x} cy={y} r={draggable ? 14 : 5} fill={c} fillOpacity={draggable ? 0.15 : 1} /><circle cx={x} cy={y} r={5} fill={c} />{s.label && <Label x={x} y={y} dx={12} dy={-10} color={c} src={s.label} />}</g>; }
      default: return null;
    }
  });

  return (
    <svg ref={svg} className="scene" viewBox={`0 0 ${W} ${height}`} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)} role="img"
      aria-label={(scene as any).description ?? describeScene(scene, vars, params)}>
      <defs>{Object.keys(COLORS).map((k) => <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={COLORS[k]} /></marker>)}</defs>
      {scene.view.grid !== false && <g className="grid">{ticks(x0, x1).map((v) => <line key={'x' + v} x1={sx(v)} y1={0} x2={sx(v)} y2={height} />)}{ticks(y0, y1).map((v) => <line key={'y' + v} x1={0} y1={sy(v)} x2={W} y2={sy(v)} />)}</g>}
      {scene.view.axes !== false && <g className="axes"><line x1={0} y1={sy(0)} x2={W} y2={sy(0)} /><line x1={sx(0)} y1={0} x2={sx(0)} y2={height} />{ticks(x0, x1).filter((v) => v !== 0).map((v) => <text key={v} x={sx(v)} y={sy(0) + 14}>{v}</text>)}{ticks(y0, y1).filter((v) => v !== 0).map((v) => <text key={v} x={sx(0) - 6} y={sy(v) + 4} textAnchor="end">{v}</text>)}</g>}
      {els}
    </svg>
  );
}

function Label({ x, y, dx = 0, dy = 0, color, src }: { x: number; y: number; dx?: number; dy?: number; color: string; src: string }) {
  return <foreignObject x={x + dx - 60} y={y + dy - 14} width={120} height={28} style={{ overflow: 'visible', pointerEvents: 'none' }}><div className="scene-label" style={{ color, textAlign: dx >= 0 ? 'left' : 'right', paddingLeft: dx >= 0 ? 60 : 0, paddingRight: dx < 0 ? 60 : 0 }}><Md src={src} /></div></foreignObject>;
}

function niceStep(range: number) { const raw = range / 8; const p = Math.pow(10, Math.floor(Math.log10(raw))); const m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }

/**
 * Fallback text alternative (§7.11). The scene used to be an unnamed role="img" — announced as just
 * "image". Without an author `description`, say what can be read off it: its labels and current values.
 */
function describeScene(scene: Scene, vars: Record<string, number>, params: Param[]): string {
  const shapes = ((scene as any).shapes ?? []) as any[];
  const labels = shapes.map((s) => s.label ?? (s.type === 'text' ? s.text : null)).filter(Boolean).map((l: string) => l.replace(/[$\\{}]/g, ''));
  const values = params.map((p) => `${(p.label ?? p.name).replace(/[$\\{}]/g, '')} = ${+(vars[p.name] ?? 0).toFixed(3)}`);
  return `Diagram${labels.length ? ` showing ${labels.join(', ')}` : ''}${values.length ? `. ${values.join(', ')}` : ''}.`;
}
