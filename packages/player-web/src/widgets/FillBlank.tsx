import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

import type { MediaDef } from './Media.tsx';
interface Def { id: string; explanation?: string; prompt?: string; audio?: MediaDef; text: string; caseSensitive?: boolean; hint?: string; solutionAfterAttempts?: number }
type Blank = { numeric: false; answers: string[] } | { numeric: true; value: number; tol: number };

function parseBlank(body: string): Blank {
  if (body.startsWith('=')) { const [v, t] = body.slice(1).split('~'); return { numeric: true, value: parseFloat(v), tol: t ? parseFloat(t) : 0 }; }
  return { numeric: false, answers: body.split('|') };
}

export function FillBlank({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const [attempt, setAttempt] = useState(0);
  const st = useWidgetState<{ values: string[] }>(courseId, def.id);
  const parts = def.text.split(/(\{\{[^{}]+\}\})/);
  const blanks = parts.filter((p) => p.startsWith('{{')).map((p) => parseBlank(p.slice(2, -2)));
  const [values, setValues] = useState<string[]>(st.data?.values ?? blanks.map(() => ''));
  const [checked, setChecked] = useState(st.complete);
  const [showSol, setShowSol] = useState(false);

  const judge = (b: Blank, v: string) => {
    const s = v.trim();
    if (b.numeric) { const n = parseFloat(s.replace(',', '.')); return Number.isFinite(n) && Math.abs(n - b.value) <= b.tol + 1e-9; }
    return b.answers.some((a) => (def.caseSensitive ? a === s : a.toLowerCase() === s.toLowerCase()));
  };
  const results = blanks.map((b, i) => judge(b, values[i] ?? ''));
  const allOk = results.every(Boolean);
  const submit = () => { setChecked(true); if (!allOk) setAttempt((a) => a + 1); st.save({ values }, allOk); };

  // Blanks become invisible tokens, the whole text is parsed as inline Markdown, then the tokens are swapped for inputs —
  // so *emphasis {{can}} span* a blank.
  let bi = 0;
  const tokenised = parts.map((p) => (p.startsWith('{{') ? `\u2063${bi++}\u2063` : p)).join('');
  const inputs = blanks.map((_, k) => <input key={k} className={`input blank ${checked ? (results[k] ? 'right' : 'wrong') : ''}`} value={values[k] ?? ''} size={Math.max(3, (values[k] ?? '').length + 1)} disabled={st.complete}
    onChange={(e) => { const v = [...values]; v[k] = e.target.value; setValues(v); setChecked(false); }} aria-label={`Blank ${k + 1}`} />);
  return (
    <Frame kind="Fill in the blanks" complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempt}>
      {def.prompt && <div className="prompt"><Md src={def.prompt} block /></div>}
      <p className="fill-text"><Md src={tokenised} slots={inputs} /></p>
      {!st.complete && <button className="btn primary" onClick={submit}>Check</button>}
      <Feedback ok={checked ? allOk : null} why={def.explanation} hint={def.hint} attempts={attempt}
        solution={{ after: def.solutionAfterAttempts, attempts: attempt, shown: showSol, show: () => setShowSol(true),
          content: <ol className="sol-list">{blanks.map((b, k) => <li key={k}>{b.numeric ? b.value : b.answers[0]}</li>)}</ol> }}>
        {allOk ? 'All correct.' : `${results.filter(Boolean).length} of ${results.length} correct.`}
      </Feedback>
    </Frame>
  );
}
