import { useMemo, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { AudioClip, type MediaDef } from './Media.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; prompt: string; audio?: MediaDef; options: { text: string; audio?: MediaDef; correct?: boolean; explanation?: string }[]; multiple?: boolean; shuffle?: boolean; explanation?: string; hint?: string; solutionAfterAttempts?: number }

export function MultipleChoice({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const [attempt, setAttempt] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const st = useWidgetState<{ picked: number[]; checked: boolean }>(courseId, def.id);
  const [picked, setPicked] = useState<number[]>(st.data?.picked ?? []);
  const [checked, setChecked] = useState(st.data?.checked ?? false);
  const order = useMemo(() => {
    const idx = def.options.map((_, i) => i);
    if (def.shuffle) for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }, [def]);
  const correctSet = def.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  const isCorrect = picked.length === correctSet.length && picked.every((i) => def.options[i].correct);

  // The "Why?" panel: on success the explanations of the correct options plus the widget's own; after a
  // wrong answer only the explanations of the wrong options chosen, which say why *that* choice fails
  // without naming the right one. With several options each explanation is labelled with its option.
  const explained = (idx: number[]) => idx.filter((i) => def.options[i].explanation);
  const optionWhy = (idx: number[]) => idx.length === 0 ? null
    : idx.length === 1 && !def.multiple ? <p><Md src={def.options[idx[0]].explanation} /></p>
    : <ul className="why-list">{idx.map((i) => <li key={i}><strong><Md src={def.options[i].text} /></strong> — <Md src={def.options[i].explanation} /></li>)}</ul>;
  // On success the picked options are exactly the correct ones; with a revealed solution these explain it.
  const rightPicked = explained(correctSet);
  const why = rightPicked.length || def.explanation
    ? <>{optionWhy(rightPicked)}{def.explanation && <p><Md src={def.explanation} /></p>}</> : undefined;
  const wrongPicked = explained(picked.filter((i) => !def.options[i].correct));
  const whyNot = wrongPicked.length ? optionWhy(wrongPicked) : undefined;

  const toggle = (i: number) => { if (st.complete) return; setChecked(false); setPicked(def.multiple ? (picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i]) : [i]); };
  const submit = () => { setChecked(true); if (!isCorrect) setAttempt((a) => a + 1); st.save({ picked, checked: true }, isCorrect); };

  return (
    <Frame kind={def.multiple ? 'Choose all that apply' : 'Choose one'} complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempt}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <div className="options">
        {order.map((i) => {
          const o = def.options[i]; const on = picked.includes(i);
          const cls = ['option', on ? 'on' : '', checked && on ? (o.correct ? 'right' : 'wrong') : '', (checked && st.complete) || showSol ? (o.correct ? 'right' : '') : ''].join(' ');
          return (
            <div key={i} className={`option-row ${o.audio ? 'has-audio' : ''}`}>
              <button type="button" className={cls} onClick={() => toggle(i)} aria-pressed={on} disabled={st.complete}>
                <span className="mark" aria-hidden />
                <span><Md src={o.text} /></span>
              </button>
              {o.audio && <AudioClip media={o.audio} assetUrl={assetUrl} compact />}
            </div>
          );
        })}
      </div>
      {!st.complete && <button className="btn primary" onClick={submit} disabled={!picked.length}>Check</button>}
      <Feedback ok={checked ? isCorrect : null} why={why} whyNot={whyNot} hint={def.hint} attempts={attempt}
        solution={{ after: def.solutionAfterAttempts, attempts: attempt, shown: showSol, show: () => setShowSol(true) }}>
        {isCorrect ? 'Correct.' : 'Not quite — try again.'}
      </Feedback>
    </Frame>
  );
}
