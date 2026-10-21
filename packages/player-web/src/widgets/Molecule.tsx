import { useEffect, useRef, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';
import { useTheme } from '../lib/theme.ts';

interface Def {
  id: string; smiles: string; name?: string; prompt?: string; reaction?: string; showFormula?: boolean;
  highlight?: number[];
  answer?: { kind: 'atom' | 'atoms'; accept: number[] } | { kind: 'text'; accept: string[] };
  hint?: string; explanation?: string; solutionAfterAttempts?: number;
}

type Atom = { i: number; x: number; y: number; element: string };

/** smiles-drawer (~200 kB) is bundled, not fetched: structures must render with no network (§7.10). */
let libP: Promise<any> | null = null;
const lib = () => (libP ??= import('smiles-drawer').then((m: any) => m.default ?? m));

export function Molecule({ def, courseId }: WidgetProps<Def>) {
  const st = useWidgetState<{ attempts: number }>(courseId, def.id);
  const host = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clickRef = useRef<(i: number) => void>(() => {});
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [box, setBox] = useState<[number, number, number, number]>([0, 0, 500, 300]);
  const [formula, setFormula] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);
  const graded = !!def.answer;
  const atomAnswer = def.answer && def.answer.kind !== 'text' ? def.answer.accept : [];

  const theme = useTheme();
  useEffect(() => {
    let live = true;
    lib().then((SD) => {
      if (!live || !host.current) return;
      host.current.innerHTML = '';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '520'); svg.setAttribute('height', '320');
      host.current.appendChild(svg);
      try {
        const opts = { width: 520, height: 320, padding: 24, compactDrawing: false, terminalCarbons: true, explicitHydrogens: false };
        if (def.reaction) {
          const drawer = new SD.ReactionDrawer({ scale: 1 }, new SD.SvgDrawer(opts));
          drawer.draw(SD.ReactionParser.parse(def.reaction), svg, theme, null, '', ''); // no reagent captions above or below the arrow
          setAtoms([]);
        } else {
          const drawer = new SD.SvgDrawer(opts);
          drawer.draw(SD.Parser.parse(def.smiles), svg, theme, false);
          // Atom positions come from the drawer's own graph, so hit targets sit exactly on the drawn atoms.
          const verts = drawer.preprocessor?.graph?.vertices ?? [];
          setAtoms(verts.map((v: any, i: number) => ({ i, x: v.position.x, y: v.position.y, element: v.value?.element ?? 'C' })));
          setFormula(drawer.preprocessor?.getMolecularFormula?.() ?? null);
        }
        const vb = svg.getAttribute('viewBox');
        setBox(vb ? (vb.split(/[\s,]+/).map(Number) as any) : [0, 0, 520, 320]);
        svgRef.current = svg as SVGSVGElement;
        svg.setAttribute('aria-hidden', 'true'); // the wrapper carries the description
        svg.removeAttribute('role');
      } catch (e) { setError(`This structure could not be drawn: ${(e as Error).message}`); }
    });
    return () => { live = false; };
  }, [def.smiles, def.reaction, theme]); // smiles-drawer has its own light and dark palettes; redraw on a switch

  const clickAtom = (i: number) => {
    if (!graded || st.complete || def.answer!.kind === 'text') return;
    if (def.answer!.kind === 'atoms') { setPicked(picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i]); setResult(null); return; }
    atomAnswer.includes(i) ? (setPicked([i]), succeed()) : (setPicked([]), fail());
  };
  const succeed = () => { setResult(true); st.save({ attempts }, true); };
  const fail = () => { setResult(false); setAttempts(attempts + 1); st.save({ attempts: attempts + 1 }); };
  const checkAtoms = () => (picked.length === atomAnswer.length && picked.every((p) => atomAnswer.includes(p)) ? succeed() : fail());
  const checkText = () => {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    (def.answer as any).accept.some((a: string) => norm(a) === norm(text)) ? succeed() : fail();
  };

  clickRef.current = clickAtom;
  // The drawer picks its own viewBox scale, so a radius in viewBox units means nothing. Convert from the
  // target CSS size (16 px radius = a 32 px tap target) using the ratio the SVG is rendered at.
  const RENDER_W = 520;
  const R = (box[2] / RENDER_W) * 16;

  /**
   * Marks and hit targets are appended *into* the drawn SVG rather than layered over it: the drawer picks its
   * own viewBox, so an overlay with a separate coordinate system drifts out of alignment.
   */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !atoms.length) return;
    svg.querySelectorAll('.mol-layer').forEach((n) => n.remove());
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'mol-layer');
    const circle = (a: Atom, cls: string, r: number) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(a.x)); c.setAttribute('cy', String(a.y)); c.setAttribute('r', String(r)); c.setAttribute('class', cls);
      return c;
    };
    for (const i of def.highlight ?? []) if (atoms[i]) g.appendChild(circle(atoms[i], 'mol-mark', R * 0.8));
    if (showSol) for (const i of atomAnswer) if (atoms[i]) g.appendChild(circle(atoms[i], 'mol-sol', R * 0.8));
    if (graded && def.answer!.kind !== 'text') {
      for (const a of atoms) {
        const c = circle(a, `mol-atom ${picked.includes(a.i) ? 'picked' : ''}`, R);
        c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0');
        c.setAttribute('aria-label', `${a.element} atom ${a.i}`);
        c.addEventListener('click', () => clickRef.current(a.i));
        c.addEventListener('keydown', (e) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); clickRef.current(a.i); } });
        g.appendChild(c);
      }
    }
    svg.appendChild(g);
  }, [atoms, picked, showSol, R, graded]);

  const label = `Chemical structure${def.name ? ` of ${def.name}` : ''}${formula ? `, formula ${formula}` : ''}, SMILES ${def.reaction ?? def.smiles}`;

  return (
    <Frame kind={graded ? 'Read the structure' : 'Structure'} complete={st.complete} graded={graded}>
      {def.prompt && <div className="prompt"><Md src={def.prompt} block /></div>}
      {error ? <p className="feedback no">{error}</p> : (
        <figure className="molecule">
          <div ref={host} role="img" aria-label={label} />
          {(def.name || (def.showFormula && formula)) && (
            <figcaption>{def.name && <Md src={def.name} />}{def.showFormula && formula && <span className="dim"> · {formula}</span>}</figcaption>
          )}
        </figure>
      )}
      {graded && def.answer!.kind === 'atoms' && !st.complete && <button className="btn primary" onClick={checkAtoms} disabled={!picked.length}>Check</button>}
      {graded && def.answer!.kind === 'text' && !st.complete && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); checkText(); }}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your answer" />
          <button className="btn primary" type="submit" disabled={!text.trim()}>Check</button>
        </form>
      )}
      {graded && <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: atomAnswer.length > 0 ? def.solutionAfterAttempts : -1, attempts, shown: showSol, show: () => setShowSol(true) }}>
        {result ? 'Correct.' : 'Not that one.'}
      </Feedback>}
    </Frame>
  );
}
