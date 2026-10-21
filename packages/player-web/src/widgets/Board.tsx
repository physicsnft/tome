import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';
import { NAMED } from '../lib/palette.ts';

type Sq = string | [number, number];
interface Def { id: string; prompt: string; rows: number; cols: number; grid?: 'squares' | 'intersections'; theme?: 'checkered' | 'plain' | 'wood'; coordinates?: 'algebraic' | 'none'; orientation?: 'normal' | 'flipped'; pieces: { at: Sq; glyph?: string; sprite?: string; color?: string }[]; answer: { kind: 'square' | 'squares' | 'move'; accept: string[] }; marks?: { at: Sq; to?: Sq; kind: 'circle' | 'square' | 'arrow'; color?: string }[]; explanation?: string; hint?: string; solutionAfterAttempts?: number }

const COLORS = NAMED;

/** Board with no rules engine: answers are matched against the author's list (§7.3 board). */
export function Board({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ attempts: number }>(courseId, def.id);
  const { rows, cols } = def;
  const inter = def.grid === 'intersections';
  const flipped = def.orientation === 'flipped';
  const toRC = (s: Sq): [number, number] => typeof s === 'string' ? [rows - parseInt(s.slice(1)), s.charCodeAt(0) - 97] : s;
  const toAlg = ([r, c]: [number, number]) => `${String.fromCharCode(97 + c)}${rows - r}`;
  const [sel, setSel] = useState<[number, number][]>([]);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [showSol, setShowSol] = useState(false);

  const pieceAt = (r: number, c: number) => def.pieces.find((p) => { const [pr, pc] = toRC(p.at); return pr === r && pc === c; });
  const fail = () => { setResult(false); setAttempts(attempts + 1); if (def.answer.kind !== 'squares') setSel([]); st.save({ attempts: attempts + 1 }); };
  const succeed = () => { setResult(true); st.save({ attempts }, true); };

  const click = (r: number, c: number) => {
    if (st.complete) return;
    setResult(null);
    const alg = toAlg([r, c]);
    if (def.answer.kind === 'square') { def.answer.accept.includes(alg) ? (setSel([[r, c]]), succeed()) : fail(); return; }
    if (def.answer.kind === 'squares') { setSel(sel.some(([a, b]) => a === r && b === c) ? sel.filter(([a, b]) => !(a === r && b === c)) : [...sel, [r, c]]); return; }
    // move: first click picks a piece, second picks a destination
    if (!sel.length) { if (pieceAt(r, c)) setSel([[r, c]]); return; }
    const from = toAlg(sel[0]); const norm = (m: string) => m.replace('-', '').slice(0, 4);
    if (def.answer.accept.some((a) => norm(a) === from + alg)) { setSel([sel[0], [r, c]]); succeed(); } else fail();
  };
  const checkSquares = () => {
    const got = new Set(sel.map(toAlg)); const want = new Set(def.answer.accept);
    got.size === want.size && [...want].every((w) => got.has(w)) ? succeed() : fail();
  };

  // Geometry
  const S = 64, pad = def.coordinates === 'none' ? 8 : 28;
  const W = cols * S + pad * 2, H = rows * S + pad * 2;
  const vr = (r: number) => (flipped ? rows - 1 - r : r), vc = (c: number) => (flipped ? cols - 1 - c : c);
  const cx = (c: number) => pad + vc(c) * S + (inter ? 0 : S / 2), cy = (r: number) => pad + vr(r) * S + (inter ? 0 : S / 2);
  const light = def.theme === 'plain' ? '#f7f8fa' : def.theme === 'wood' || (inter && !def.theme) ? '#e7c892' : '#f0e6d2';
  const dark = def.theme === 'plain' ? '#e3e6ec' : '#a8734a';
  const isSel = (r: number, c: number) => sel.some(([a, b]) => a === r && b === c);
  // One tab stop for the board. Arrow keys move in screen directions, so a flipped board still feels
  // natural; Enter or Space acts on the square. Squares were neither focusable nor activatable before.
  const [cursor, setCursor] = useState<[number, number]>([Math.floor(rows / 2), Math.floor(cols / 2)]);
  const onKey = (e: React.KeyboardEvent) => {
    const [r, c] = cursor;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(r, c); return; }
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const mv = d[e.key]; if (!mv) return;
    e.preventDefault();
    const f = flipped ? -1 : 1;
    setCursor([Math.min(rows - 1, Math.max(0, r + mv[0] * f)), Math.min(cols - 1, Math.max(0, c + mv[1] * f))]);
  };
  const describe = (r: number, c: number) => { const p = pieceAt(r, c); return `${toAlg([r, c])}${p?.glyph ? `, ${p.glyph}` : ''}${isSel(r, c) ? ', selected' : ''}`; };
  const solutionSquares = showSol ? def.answer.accept.flatMap((a) => { const m = a.replace('-', ''); return m.length >= 4 ? [m.slice(0, 2), m.slice(2, 4)] : [m]; }) : [];

  return (
    <Frame kind={def.answer.kind === 'move' ? 'Find the move' : def.answer.kind === 'squares' ? 'Select the squares' : 'Find the square'} complete={st.complete}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <svg className="board" viewBox={`0 0 ${W} ${H}`} role="grid" aria-label="Board">
        <defs><marker id="barrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker></defs>
        {inter ? (
          <g>
            <rect x={pad - S / 2} y={pad - S / 2} width={cols * S} height={rows * S} fill={light} />
            {Array.from({ length: rows }, (_, r) => <line key={'r' + r} x1={pad} y1={pad + r * S} x2={pad + (cols - 1) * S} y2={pad + r * S} stroke="#4a3b2a" />)}
            {Array.from({ length: cols }, (_, c) => <line key={'c' + c} x1={pad + c * S} y1={pad} x2={pad + c * S} y2={pad + (rows - 1) * S} stroke="#4a3b2a" />)}
          </g>
        ) : Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => <rect key={`${r}-${c}`} x={pad + vc(c) * S} y={pad + vr(r) * S} width={S} height={S} fill={(r + c) % 2 ? dark : light} />))}
        {def.coordinates !== 'none' && (<g className="coords">
          {Array.from({ length: cols }, (_, c) => <text key={'f' + c} x={cx(c)} y={H - 8}>{String.fromCharCode(97 + c)}</text>)}
          {Array.from({ length: rows }, (_, r) => <text key={'k' + r} x={10} y={cy(r) + 4}>{rows - r}</text>)}
        </g>)}
        {(def.marks ?? []).map((m, i) => { const [r, c] = toRC(m.at); const col = COLORS[m.color ?? 'red']; if (m.kind === 'arrow' && m.to) { const [r2, c2] = toRC(m.to); return <line key={i} x1={cx(c)} y1={cy(r)} x2={cx(c2)} y2={cy(r2)} stroke={col} strokeWidth={6} strokeOpacity={0.7} markerEnd="url(#barrow)" />; } if (m.kind === 'square') return <rect key={i} x={cx(c) - S / 2 + 3} y={cy(r) - S / 2 + 3} width={S - 6} height={S - 6} fill="none" stroke={col} strokeWidth={4} />; return <circle key={i} cx={cx(c)} cy={cy(r)} r={S / 2 - 6} fill="none" stroke={col} strokeWidth={4} />; })}
        {solutionSquares.map((a, i) => { const [r, c] = toRC(a); return <rect key={'s' + i} x={cx(c) - S / 2} y={cy(r) - S / 2} width={S} height={S} fill="var(--c-green)" fillOpacity={0.35} />; })}
        {sel.map(([r, c], i) => <rect key={'sel' + i} x={cx(c) - S / 2} y={cy(r) - S / 2} width={S} height={S} fill={result === true ? 'var(--c-green)' : 'var(--ink-primary)'} fillOpacity={0.4} />)}
        {def.pieces.map((p, i) => { let [r, c] = toRC(p.at); if (result === true && def.answer.kind === 'move' && sel.length === 2 && r === sel[0][0] && c === sel[0][1]) [r, c] = sel[1]; /* show the move played */ return p.sprite ? <image key={i} href={assetUrl(p.sprite)} x={cx(c) - S / 2 + 4} y={cy(r) - S / 2 + 4} width={S - 8} height={S - 8} /> : <text key={i} className="piece" x={cx(c)} y={cy(r) + S * 0.33} fill={p.color ? COLORS[p.color] : '#1b2030'} stroke="#fff" strokeWidth={2} paintOrder="stroke">{p.glyph}</text>; })}
        {Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => <rect key={`h${r}-${c}`} className={`hit ${cursor[0] === r && cursor[1] === c ? 'cursor' : ''}`} x={cx(c) - S / 2} y={cy(r) - S / 2} width={S} height={S} fill="transparent" role="gridcell" aria-label={describe(r, c)} aria-selected={isSel(r, c)}
            tabIndex={cursor[0] === r && cursor[1] === c ? 0 : -1} onKeyDown={onKey}
            ref={(el) => { if (el && cursor[0] === r && cursor[1] === c && document.activeElement?.closest('svg.board') === el.ownerSVGElement) el.focus(); }}
            onClick={() => { setCursor([r, c]); click(r, c); }} />))}
      </svg>
      {def.answer.kind === 'squares' && !st.complete && <button className="btn primary" onClick={checkSquares} disabled={!sel.length}>Check</button>}
      {def.answer.kind === 'move' && !st.complete && sel.length === 1 && <p className="dim small">{toAlg(sel[0])} selected — now tap the destination.</p>}
      <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true) }}>
        {result ? 'Correct.' : 'Not that one.'}
      </Feedback>
    </Frame>
  );
}
