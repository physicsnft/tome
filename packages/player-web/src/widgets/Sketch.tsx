import { useEffect, useRef, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { download, getAttachment, putAttachment } from '../lib/attachments.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; prompt: string; canvas?: { width: number; height: number }; reference?: string; trace?: string; traceOpacity?: number; model?: string; tools?: ('pen' | 'eraser' | 'fill')[]; palette?: string[]; widths?: number[]; pressure?: boolean; rubric?: string[]; minStrokes?: number; explanation?: string }
type Stroke = { color: string; width: number; erase?: boolean; points: [number, number, number][] };
type Saved = { strokes: number; ticks: boolean[]; skipped?: boolean };

const DEFAULT_PALETTE = ['#1b2030', '#6b7280', '#2b4acb', '#c2410c', '#15803d', '#b45309'];

export function Sketch({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<Saved>(courseId, def.id);
  const W = def.canvas?.width ?? 800, H = def.canvas?.height ?? 600;
  const palette = def.palette ?? DEFAULT_PALETTE, widths = def.widths ?? [2, 5, 10], tools = def.tools ?? ['pen', 'eraser'];
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const cur = useRef<Stroke | null>(null);
  const [color, setColor] = useState(palette[0]);
  const [width, setWidth] = useState(widths[Math.min(1, widths.length - 1)]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [showTrace, setShowTrace] = useState(!!def.trace);
  const [count, setCount] = useState(st.data?.strokes ?? 0);
  const [ticks, setTicks] = useState<boolean[]>(st.data?.ticks ?? (def.rubric ?? []).map(() => false));
  const [compare, setCompare] = useState(st.complete);

  // Restore strokes from the attachment, if any.
  useEffect(() => {
    getAttachment(courseId, def.id, 'strokes').then(async (b) => { if (!b) return; strokes.current = JSON.parse(await b.text()); setCount(strokes.current.length); redraw(); });
  }, [courseId, def.id]);

  const ctx = () => canvas.current!.getContext('2d')!;
  const drawStroke = (c: CanvasRenderingContext2D, s: Stroke) => {
    c.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    c.strokeStyle = s.color; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 1; i < s.points.length; i++) {
      const [x0, y0] = s.points[i - 1], [x1, y1, p] = s.points[i];
      c.lineWidth = s.width * (def.pressure === false ? 1 : 0.5 + p); // pressure 0.5 (mouse/finger) → ×1
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    if (s.points.length === 1) { const [x, y, p] = s.points[0]; c.fillStyle = s.color; c.beginPath(); c.arc(x, y, (s.width * (0.5 + p)) / 2, 0, 7); c.fill(); }
  };
  const redraw = () => { const c = ctx(); c.clearRect(0, 0, W, H); for (const s of strokes.current) drawStroke(c, s); };

  const pos = (e: React.PointerEvent): [number, number, number] => {
    const r = canvas.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H, e.pointerType === 'pen' ? e.pressure : 0.5];
  };
  const down = (e: React.PointerEvent) => {
    if (st.complete) return;
    e.preventDefault(); canvas.current!.setPointerCapture(e.pointerId);
    cur.current = { color, width, erase: tool === 'eraser', points: [pos(e)] };
    drawStroke(ctx(), cur.current);
  };
  const move = (e: React.PointerEvent) => {
    const s = cur.current; if (!s) return;
    const p = pos(e); const last = s.points[s.points.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
    s.points.push(p);
    drawStroke(ctx(), { ...s, points: [last, p] });
  };
  const up = async () => {
    const s = cur.current; if (!s) return; cur.current = null;
    strokes.current.push(s); setCount(strokes.current.length); await persist();
  };
  const persist = async () => {
    await putAttachment(courseId, def.id, 'strokes', new Blob([JSON.stringify(strokes.current)], { type: 'application/json' }));
    canvas.current!.toBlob((b) => b && putAttachment(courseId, def.id, 'image', b), 'image/png');
    st.save({ strokes: strokes.current.length, ticks });
  };
  const undo = () => { strokes.current.pop(); setCount(strokes.current.length); redraw(); persist(); };
  const clear = () => { if (!confirm('Clear the drawing?')) return; strokes.current = []; setCount(0); redraw(); persist(); };
  const done = (skipped = false) => { setCompare(true); st.save({ strokes: strokes.current.length, ticks, skipped }, true); };
  const exportPng = () => canvas.current!.toBlob((b) => b && download(b, `${def.id}.png`), 'image/png');

  return (
    <Frame kind="Draw" complete={st.complete}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <div className={`sketch ${def.reference ? 'with-ref' : ''} ${compare && def.model ? 'with-model' : ''}`}>
        {def.reference && <figure className="ref"><img src={assetUrl(def.reference)} alt="Reference" /><figcaption className="eyebrow">Reference</figcaption></figure>}
        <div className="easel" style={{ aspectRatio: `${W} / ${H}` }}>
          {def.trace && showTrace && <img className="trace" src={assetUrl(def.trace)} alt="" style={{ opacity: def.traceOpacity ?? 0.3 }} />}
          <canvas ref={canvas} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} aria-label="Drawing canvas" />
        </div>
        {compare && def.model && <figure className="model-compare" style={{ aspectRatio: `${W} / ${H}` }}><img src={assetUrl(def.model)} alt="Instructor's drawing" /><figcaption className="eyebrow">Instructor's version — compare proportions, not line quality</figcaption></figure>}
      </div>
      <div className="row toolbar sketch-tools">
        {tools.includes('pen') && <button type="button" className={`btn small ${tool === 'pen' ? 'on' : ''}`} onClick={() => setTool('pen')}>Pen</button>}
        {tools.includes('eraser') && <button type="button" className={`btn small ${tool === 'eraser' ? 'on' : ''}`} onClick={() => setTool('eraser')}>Eraser</button>}
        <span className="swatches">{palette.map((c) => <button key={c} type="button" className={`swatch ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => { setColor(c); setTool('pen'); }} aria-label={`Colour ${c}`} />)}</span>
        <span className="swatches">{widths.map((w) => <button key={w} type="button" className={`dotw ${width === w ? 'on' : ''}`} onClick={() => setWidth(w)} aria-label={`Width ${w}`}><i style={{ width: Math.min(w * 1.6, 22), height: Math.min(w * 1.6, 22) }} /></button>)}</span>
        <span className="spacer" />
        {def.trace && <label className="small dim"><input type="checkbox" checked={showTrace} onChange={(e) => setShowTrace(e.target.checked)} /> trace</label>}
        <button type="button" className="btn ghost small" onClick={undo} disabled={!count || st.complete}>Undo</button>
        <button type="button" className="btn ghost small" onClick={clear} disabled={!count || st.complete}>Clear</button>
        <button type="button" className="btn ghost small" onClick={exportPng} disabled={!count}>Export</button>
      </div>
      <p className="dim small">{count} stroke{count === 1 ? '' : 's'}{(def.minStrokes ?? 1) > count ? ` · at least ${def.minStrokes ?? 1} needed` : ''}</p>
      {def.rubric && compare && <ul className="rubric">{def.rubric.map((r, i) => <li key={i}><label><input type="checkbox" checked={ticks[i]} onChange={(e) => { const t = [...ticks]; t[i] = e.target.checked; setTicks(t); st.save({ strokes: count, ticks: t }, st.complete); }} /> <Md src={r} /></label></li>)}</ul>}
      {st.complete && def.explanation && <Feedback ok why={def.explanation}>Done.</Feedback>}
      {!st.complete && <div className="row"><button className="btn primary" onClick={() => done()} disabled={count < (def.minStrokes ?? 1)}>Done</button><button className="btn ghost small" onClick={() => done(true)}>Skip — I can't draw on this device</button></div>}
    </Frame>
  );
}
