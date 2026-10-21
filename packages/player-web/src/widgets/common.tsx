import { useEffect, useId, useState, type ReactNode } from 'react';
import { AudioClip, type MediaDef } from './Media.tsx';
import { Md } from '../render/Inline.tsx';

export function Frame({ kind, complete, children, graded = true, audio, assetUrl, attemptKey }: { kind: string; complete?: boolean; graded?: boolean; children: ReactNode; audio?: MediaDef; assetUrl?: (p: string) => string; attemptKey?: number }) {
  return (
    <section className={`widget ${complete ? 'is-complete' : ''} ${graded ? 'graded' : 'explore'}`}>
      <header className="widget-head"><span className="eyebrow">{kind}</span>{graded && <span className="status">{complete ? 'Done' : 'To do'}</span>}</header>
      {audio && assetUrl && <AudioClip media={audio} assetUrl={assetUrl} complete={complete} attemptKey={attemptKey} />}
      {children}
    </section>
  );
}

/** The §7.1 "offer the answer after N failures" control, owned by the widget so it can also mark the answer in place. */
export interface SolutionCtl {
  /** `solutionAfterAttempts`; default 3, -1 never. */
  after?: number;
  attempts: number;
  shown: boolean;
  show: () => void;
  /** Text form of the answer, for widgets that cannot mark it in place. */
  content?: ReactNode;
}

const asNode = (x: ReactNode | string | undefined) => (typeof x === 'string' ? <Md src={x} /> : x);

/**
 * The result line under every graded widget.
 *
 * `children` is the short verdict ("Correct.", "2 of 3 in the right place."). The teaching sits behind
 * a "Why?" disclosure, so a learner who knew the answer is not made to read a paragraph, and one who
 * guessed can find out whether they guessed for the right reason:
 * - `why` — the author's `explanation`, offered on a correct result and printed with a revealed solution;
 * - `whyNot` — feedback specific to the wrong answer given (multiple-choice option explanations).
 * The general explanation is never offered after a wrong answer before the solution is revealed:
 * it would give the answer away while the learner can still try again.
 */
export function Feedback({ ok, children, why, whyNot, hint, attempts = 0, solution }: {
  ok: boolean | null; children?: ReactNode; why?: ReactNode | string; whyNot?: ReactNode | string;
  hint?: string; attempts?: number; solution?: SolutionCtl;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  useEffect(() => setOpen(false), [ok]);
  const detail = ok ? why : ok === false ? whyNot : undefined;
  const after = solution?.after ?? 3;
  // Hint and the solution offer outlive the verdict: they stay while the learner edits the next attempt.
  const offer = ok !== true && solution && !solution.shown && after >= 0 && solution.attempts >= after;
  const solved = solution?.shown && ok !== true && (solution.content || why);
  return (
    <>
      {ok !== null && (
        <div className={`feedback ${ok ? 'ok' : 'no'} ${detail ? 'has-why' : ''} ${open ? 'open' : ''}`}>
          <div className="fb-row" onClick={detail ? () => setOpen(!open) : undefined}>
            <span className="fb-verdict" aria-live="polite">{children ?? (ok ? 'Correct.' : 'Not quite.')}</span>
            {detail && <button type="button" className="why-btn" aria-expanded={open} aria-controls={id}>Why?<span className="chev" aria-hidden /></button>}
          </div>
          {detail && <div id={id} className="why" hidden={!open}>{asNode(detail)}</div>}
        </div>
      )}
      {ok !== true && hint && attempts >= 1 && <p className="hint-line">Hint: <Md src={hint} /></p>}
      {offer && <button type="button" className="btn ghost small" onClick={solution!.show}>Show solution</button>}
      {solved && (
        <div className="solution-panel">
          <span className="eyebrow">Solution</span>
          {solution!.content && <div>{solution!.content}</div>}
          {why && <div className="why-text">{asNode(why)}</div>}
        </div>
      )}
    </>
  );
}
