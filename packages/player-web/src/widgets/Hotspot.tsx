import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

interface Region { id: string; label: string; description?: string; shape: 'circle' | 'rect' | 'polygon'; at: number[] }
interface Def {
  id: string; image: string; alt: string; prompt: string; regions: Region[];
  /** Optional: without one, the widget is an annotated image — tap a region to read about it. */
  answer?: { kind: 'click' | 'clicks'; accept: string[] } | { kind: 'label' };
  showLabels?: 'never' | 'after' | 'always'; outline?: 'always' | 'hover' | 'never';
  hint?: string; explanation?: string; solutionAfterAttempts?: number;
}

/** Regions are percentages of the image box, so nothing depends on the rendered size (§7.3 hotspot). */
function shapeOf(r: Region, key: string, cls: string, on: (e: React.MouseEvent) => void, label: string) {
  const common = { key, className: cls, onClick: on, role: 'button' as const, tabIndex: 0, 'aria-label': label,
    // SVG elements have no .click() — calling it threw silently, so Enter and Space did nothing and the
    // regions were reachable by keyboard but never activatable. Call the handler directly.
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); on(e as unknown as React.MouseEvent); } } };
  if (r.shape === 'circle') return <circle {...common} cx={r.at[0]} cy={r.at[1]} r={r.at[2]} />;
  if (r.shape === 'rect') return <rect {...common} x={r.at[0]} y={r.at[1]} width={r.at[2]} height={r.at[3]} rx={0.8} />;
  return <polygon {...common} points={r.at.reduce<string[]>((a, v, i) => (i % 2 ? [...a.slice(0, -1), `${a.at(-1)},${v}`] : [...a, String(v)]), []).join(' ')} />;
}
const centre = (r: Region): [number, number] =>
  r.shape === 'circle' ? [r.at[0], r.at[1]]
  : r.shape === 'rect' ? [r.at[0] + r.at[2] / 2, r.at[1] + r.at[3] / 2]
  : [r.at.filter((_, i) => !(i % 2)).reduce((a, b) => a + b, 0) / (r.at.length / 2), r.at.filter((_, i) => i % 2).reduce((a, b) => a + b, 0) / (r.at.length / 2)];

export function Hotspot({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ attempts: number; placed?: Record<string, string> }>(courseId, def.id);
  const explore = !def.answer;
  const labelMode = def.answer?.kind === 'label';
  const [picked, setPicked] = useState<string[]>([]);
  const [placed, setPlaced] = useState<Record<string, string>>(st.data?.placed ?? {}); // regionId -> labelRegionId
  const [heldLabel, setHeld] = useState<string | null>(null);
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const accept = !def.answer || def.answer.kind === 'label' ? [] : def.answer.accept;

  const fail = () => { setResult(false); setAttempts(attempts + 1); st.save({ attempts: attempts + 1, placed }); };
  const succeed = (p = placed) => { setResult(true); st.save({ attempts, placed: p }, true); };

  const clickRegion = (r: Region) => {
    if (explore) { setOpen(r.id); setPicked(picked.includes(r.id) ? picked : [...picked, r.id]); return; }
    if (st.complete) return;
    setOpen(r.id);
    if (labelMode) {
      if (!heldLabel) return;
      const next = { ...placed };
      for (const k of Object.keys(next)) if (next[k] === heldLabel) delete next[k];
      next[r.id] = heldLabel;
      setPlaced(next); setHeld(null); setResult(null);
      if (def.regions.every((x) => next[x.id] === x.id)) succeed(next);
      else if (Object.keys(next).length === def.regions.length) fail();
      return;
    }
    if (def.answer!.kind === 'clicks') { setPicked(picked.includes(r.id) ? picked.filter((x) => x !== r.id) : [...picked, r.id]); setResult(null); return; }
    accept.includes(r.id) ? (setPicked([r.id]), succeed()) : (setPicked([]), fail());
  };
  const checkMulti = () => (picked.length === accept.length && picked.every((p) => accept.includes(p)) ? succeed() : fail());

  const labels = labelMode ? def.regions : [];
  const used = new Set(Object.values(placed));
  const revealed = (r: Region) => def.showLabels === 'always' || (explore && def.showLabels !== 'never' && picked.includes(r.id)) || (def.showLabels !== 'never' && (st.complete || showSol)) || (labelMode && placed[r.id] !== undefined);
  const cls = (r: Region) => [
    'hs-region', `outline-${def.outline ?? (explore ? 'always' : 'hover')}`,
    explore && picked.includes(r.id) ? 'seen' : '',
    !explore && picked.includes(r.id) ? 'picked' : '',
    showSol && accept.includes(r.id) ? 'sol' : '',
    labelMode && placed[r.id] ? (st.complete || result ? 'right' : placed[r.id] === r.id ? 'filled' : 'filled') : '',
    heldLabel && labelMode ? 'target' : '',
  ].join(' ');

  return (
    <Frame kind={explore ? 'Explore the image' : labelMode ? 'Label the diagram' : 'Find it on the diagram'} complete={st.complete} graded={!explore}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      {labelMode && !st.complete && (
        <div className="hs-labels" role="group" aria-label="Labels to place">
          {labels.map((r) => (
            <button key={r.id} type="button" className={`chip ${heldLabel === r.id ? 'on' : ''} ${used.has(r.id) ? 'used' : ''}`}
              onClick={() => setHeld(heldLabel === r.id ? null : r.id)} aria-pressed={heldLabel === r.id}>
              <Md src={r.label} />
            </button>
          ))}
          <span className="dim small">{heldLabel ? 'Now tap where it belongs.' : 'Tap a label to pick it up.'}</span>
        </div>
      )}
      <figure className="hotspot">
        <img src={assetUrl(def.image)} alt={def.alt} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="hs-overlay">
          {def.regions.map((r) => shapeOf(r, r.id, cls(r), () => clickRegion(r), labelMode ? `Place a label on region ${r.description ?? ''}`.trim() : r.label))}
        </svg>
        {def.regions.filter(revealed).map((r) => {
          const [cx, cy] = centre(r);
          const text = labelMode ? def.regions.find((x) => x.id === placed[r.id])?.label ?? r.label : r.label;
          return <span key={r.id} className={`hs-label ${labelMode && placed[r.id] && placed[r.id] !== r.id && (st.complete || result === false) ? 'wrong' : ''}`} style={{ left: `${cx}%`, top: `${cy}%` }}><Md src={text} /></span>;
        })}
      </figure>
      {open && def.regions.find((r) => r.id === open)?.description && (
        <p className="hs-desc"><strong><Md src={def.regions.find((r) => r.id === open)!.label} /></strong> — <Md src={def.regions.find((r) => r.id === open)!.description!} /></p>
      )}
      {def.answer?.kind === 'clicks' && !st.complete && <button className="btn primary" onClick={checkMulti} disabled={!picked.length}>Check</button>}
      {explore && <p className="dim small">{picked.length} of {def.regions.length} explored — tap a marked area to read about it.</p>}
      {!explore && <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: !labelMode ? def.solutionAfterAttempts : -1, attempts, shown: showSol, show: () => setShowSol(true) }}>
        {result ? 'Correct.' : labelMode ? 'Some labels are in the wrong place — the wrong ones are marked.' : 'Not that one.'}
      </Feedback>}
    </Frame>
  );
}
