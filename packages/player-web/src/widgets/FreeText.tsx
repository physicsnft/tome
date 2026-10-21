import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

import type { MediaDef } from './Media.tsx';
interface Def { id: string; minLength?: number; maxLength?: number; audio?: MediaDef; prompt: string; grading: 'self' | 'keywords' | 'pattern'; keywords?: string[]; pattern?: string; modelAnswer?: string; hint?: string; explanation?: string }

export function FreeText({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const [attempt, setAttempt] = useState(0);
  const st = useWidgetState<{ text: string }>(courseId, def.id);
  const [text, setText] = useState(st.data?.text ?? '');
  const [revealed, setRevealed] = useState(st.complete);
  const [result, setResult] = useState<boolean | null>(st.complete ? true : null);

  const submit = () => {
    let ok = true;
    if (def.grading === 'keywords') ok = (def.keywords ?? []).every((k) => text.toLowerCase().includes(k.toLowerCase()));
    if (def.grading === 'pattern') { try { ok = new RegExp(def.pattern!).test(text); } catch { ok = false; } }
    setResult(ok); setRevealed(true); if (!ok) setAttempt((a) => a + 1); st.save({ text }, ok);
  };
  return (
    <Frame kind="Write an answer" complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempt}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <textarea className="input area" rows={3} value={text} onChange={(e) => setText(e.target.value)} disabled={st.complete} aria-label="Your answer"
        maxLength={def.maxLength} aria-describedby={def.minLength || def.maxLength ? `${def.id}-len` : undefined} />
      {(def.minLength || def.maxLength) && !st.complete && (
        <p id={`${def.id}-len`} className="dim small">
          {text.trim().length} characters{def.minLength ? ` · at least ${def.minLength}` : ''}{def.maxLength ? ` · at most ${def.maxLength}` : ''}
        </p>
      )}
      {!st.complete && <button className="btn primary" onClick={submit} disabled={!text.trim() || text.trim().length < (def.minLength ?? 0)}>{def.grading === 'self' ? 'Compare with model answer' : 'Check'}</button>}
      {def.grading !== 'self' && <Feedback ok={result} why={def.explanation} hint={def.hint} attempts={attempt}>{result ? 'Looks good.' : 'Not quite what we were looking for.'}</Feedback>}
      {revealed && def.modelAnswer && <div className="model-answer"><span className="eyebrow">Model answer</span><Md src={def.modelAnswer} />{def.grading === 'self' && def.explanation && <p className="why-text"><Md src={def.explanation} /></p>}</div>}
    </Frame>
  );
}
