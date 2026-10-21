import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

import type { MediaDef } from './Media.tsx';
interface Def { id: string; explanation?: string; audio?: MediaDef; prompt: string; answer: number; tolerance?: number; relativeTolerance?: number; unit?: string; hint?: string; solutionAfterAttempts?: number }

export function NumericInput({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const [attempt, setAttempt] = useState(0);
  const st = useWidgetState<{ value: string; attempts: number }>(courseId, def.id);
  const [value, setValue] = useState(st.data?.value ?? '');
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);

  const check = () => {
    const v = parseFloat(value.replace(',', '.'));
    const tol = Math.max(def.tolerance ?? 0, (def.relativeTolerance ?? 0) * Math.abs(def.answer), 1e-9);
    const ok = Number.isFinite(v) && Math.abs(v - def.answer) <= tol;
    setResult(ok); setAttempts(attempts + 1); if (!ok) setAttempt((a) => a + 1);
    st.save({ value, attempts: attempts + 1 }, ok);
  };
  return (
    <Frame kind="Enter a number" complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempt}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (!st.complete) check(); }}>
        <input className="input num" inputMode="decimal" value={value} onChange={(e) => { setValue(e.target.value); setResult(null); }} disabled={st.complete} aria-label="Your answer" />
        {def.unit && <span className="unit">{def.unit}</span>}
        {!st.complete && <button className="btn primary" type="submit" disabled={!value}>Check</button>}
      </form>
      <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true), content: <>Answer: <strong>{def.answer}</strong>{def.unit ? ` ${def.unit}` : ''}</> }} />
    </Frame>
  );
}
