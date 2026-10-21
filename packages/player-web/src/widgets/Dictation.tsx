import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { MediaDef } from './Media.tsx';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; explanation?: string; audio: MediaDef; answer: string; alternatives?: string[]; prompt?: string; ignoreCase?: boolean; ignorePunctuation?: boolean; ignoreAccents?: boolean; hint?: string; solutionAfterAttempts?: number }

export function normalise(s: string, d: Def) {
  let t = s.normalize('NFC');
  if (d.ignoreCase ?? true) t = t.toLowerCase();
  if (d.ignorePunctuation ?? true) t = t.replace(/[.,;:!?¿¡"'()\-—…]/g, ' ');
  if (d.ignoreAccents) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return t.trim().split(/\s+/).filter(Boolean);
}

/** Word-level diff: LCS alignment, so the learner sees which words are missing or extra. */
function diff(got: string[], want: string[]) {
  const m = got.length, n = want.length;
  const L = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = got[i] === want[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: { w: string; k: 'ok' | 'extra' | 'missing' }[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (got[i] === want[j]) { out.push({ w: got[i], k: 'ok' }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ w: got[i], k: 'extra' }); i++; }
    else { out.push({ w: '•'.repeat(Math.min(want[j].length, 6)), k: 'missing' }); j++; }
  }
  while (i < m) out.push({ w: got[i++], k: 'extra' });
  while (j < n) out.push({ w: '•'.repeat(Math.min(want[j++].length, 6)), k: 'missing' });
  return out;
}

export function Dictation({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ text: string; attempts: number }>(courseId, def.id);
  const [text, setText] = useState(st.data?.text ?? '');
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [result, setResult] = useState<ReturnType<typeof diff> | null>(null);
  const [ok, setOk] = useState<boolean | null>(st.complete ? true : null);
  const [showSol, setShowSol] = useState(false);
  const targets = [def.answer, ...(def.alternatives ?? [])].map((a) => normalise(a, def));

  const check = () => {
    const got = normalise(text, def);
    const hit = targets.some((t) => t.length === got.length && t.every((w, i) => w === got[i]));
    // Diff against the closest target (fewest differences).
    const best = targets.map((t) => diff(got, t)).sort((a, b) => a.filter((x) => x.k !== 'ok').length - b.filter((x) => x.k !== 'ok').length)[0];
    setOk(hit); setResult(hit ? null : best); setAttempts(attempts + 1); st.save({ text, attempts: attempts + 1 }, hit);
  };
  return (
    <Frame kind="Dictation" complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempts}>
      {def.prompt && <div className="prompt"><Md src={def.prompt} block /></div>}
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (!st.complete) check(); }}>
        <input className="input wide" value={text} onChange={(e) => { setText(e.target.value); setOk(null); }} disabled={st.complete} aria-label="What you heard" placeholder="Type what you hear…" autoCapitalize="sentences" spellCheck={false} />
        {!st.complete && <button className="btn primary" type="submit" disabled={!text.trim()}>Check</button>}
      </form>
      {result && (
        <div className="diff" aria-label="Word by word comparison">
          {result.map((d, i) => <span key={i} className={`w ${d.k}`}>{d.w}</span>)}
          <span className="dim small legend">green = right · red = not in the clip · dots = a word you missed</span>
        </div>
      )}
      <Feedback ok={ok} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true), content: <em>{def.answer}</em> }}>
        {ok ? <>Exactly right: <em>{def.answer}</em></> : 'Not yet.'}
      </Feedback>
    </Frame>
  );
}
