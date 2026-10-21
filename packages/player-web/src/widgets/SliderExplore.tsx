import { useState } from 'react';
import { expr } from '@tome/core';
import { Md } from '../render/Inline.tsx';
import { Frame } from './common.tsx';
import { SceneView, type Scene } from './Geometry.tsx';
import { PlotView, type PlotDef } from './Plot.tsx';
import type { WidgetProps } from './index.tsx';

export interface Param { name: string; min: number; max: number; step?: number; default?: number; value?: number; label?: string }
interface Def { id: string; params: Param[]; plot?: PlotDef; outputs?: { label: string; expr: string; precision?: number; suffix?: string }[]; geometry?: Scene; caption?: string }

export function SliderExplore({ def }: WidgetProps<Def>) {
  const [vars, setVars] = useState<Record<string, number>>(Object.fromEntries(def.params.map((p) => [p.name, p.value ?? p.default ?? p.min])));
  const set = (k: string, v: number) => setVars((s) => ({ ...s, [k]: v }));
  const set2 = (a: string, av: number, b: string, bv: number) => setVars((s) => ({ ...s, [a]: av, [b]: bv }));
  return (
    <Frame kind="Explore" graded={false}>
      {def.geometry && <SceneView scene={def.geometry} vars={vars} params={def.params} onChange={set} onChange2={set2} />}
      {def.plot && <PlotView def={def.plot} vars={vars} />}
      <Sliders params={def.params} vars={vars} onChange={set} />
      {def.outputs && (
        <dl className="outputs">
          {def.outputs.map((o, i) => { let v: number; try { v = expr.evalExpr(o.expr, vars); } catch { v = NaN; } return <div key={i}><dt><Md src={o.label} /></dt><dd>{Number.isFinite(v) ? v.toFixed(o.precision ?? 2) : '—'}{o.suffix ?? ''}</dd></div>; })}
        </dl>
      )}
      {def.caption && <p className="caption"><Md src={def.caption} /></p>}
    </Frame>
  );
}

export function Sliders({ params, vars, onChange }: { params: Param[]; vars: Record<string, number>; onChange: (k: string, v: number) => void }) {
  return (
    <div className="sliders">
      {params.map((p) => (
        <label key={p.name} className="slider">
          <span className="slider-label"><Md src={p.label ?? p.name} /></span>
          <input type="range" min={p.min} max={p.max} step={p.step ?? 0.1} value={vars[p.name]} onChange={(e) => onChange(p.name, parseFloat(e.target.value))} />
          <output>{+vars[p.name].toFixed(4)}</output>
        </label>
      ))}
    </div>
  );
}
