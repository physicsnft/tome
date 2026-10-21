import { useMemo, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import { Item, itemText, type ItemDef, type MediaDef } from './Media.tsx';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; explanation?: string; prompt: string; audio?: MediaDef; pairs: { left: ItemDef; right: ItemDef }[]; hint?: string; solutionAfterAttempts?: number }

/** Tap a left item, then a right item, to pair them. Pairs can be re-made until Check. */
export function Matching({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ match: Record<number, number> }>(courseId, def.id);
  const rightOrder = useMemo(() => { const o = def.pairs.map((_, i) => i); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }, [def]);
  const [match, setMatch] = useState<Record<number, number>>(st.data?.match ?? {});
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(st.complete);
  const [attempt, setAttempt] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const n = def.pairs.length;
  const ok = def.pairs.every((_, i) => match[i] === i);
  const pickRight = (r: number) => {
    if (sel === null) return;
    const m = { ...match }; for (const k of Object.keys(m)) if (m[+k] === r) delete m[+k]; m[sel] = r; setMatch(m); setSel(null); setChecked(false);
  };
  const submit = () => { setChecked(true); if (!ok) setAttempt((a) => a + 1); st.save({ match }, ok); };
  const letter = (r: number) => String.fromCharCode(65 + rightOrder.indexOf(r));
  return (
    <Frame kind="Match the pairs" complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempt}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <div className="match">
        <div className="match-col">
          {def.pairs.map((p, i) => <button type="button" key={i} className={`match-item ${sel === i ? 'sel' : ''} ${checked ? (match[i] === i ? 'right' : 'wrong') : ''}`} onClick={() => !st.complete && setSel(i)}><Item item={p.left} assetUrl={assetUrl} />{match[i] !== undefined && <span className="tag">{letter(match[i])}</span>}</button>)}
        </div>
        <div className="match-col">
          {rightOrder.map((r) => <button type="button" key={r} className={`match-item ${sel !== null ? 'target' : ''}`} onClick={() => pickRight(r)} disabled={st.complete}><span className="tag">{letter(r)}</span><Item item={def.pairs[r].right} assetUrl={assetUrl} /></button>)}
        </div>
      </div>
      {!st.complete && <button className="btn primary" onClick={submit} disabled={Object.keys(match).length < n}>Check</button>}
      <Feedback ok={checked ? ok : null} why={def.explanation} hint={def.hint} attempts={attempt}
        solution={{ after: def.solutionAfterAttempts, attempts: attempt, shown: showSol, show: () => setShowSol(true),
          content: <ul className="sol-list">{def.pairs.map((p, i) => <li key={i}>{itemText(p.left)} → {itemText(p.right)}</li>)}</ul> }}>
        {ok ? 'All matched.' : `${def.pairs.filter((_, i) => match[i] === i).length} of ${n} correct.`}
      </Feedback>
    </Frame>
  );
}
