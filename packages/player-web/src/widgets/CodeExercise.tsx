import { useEffect, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { runPython, warmup, type RunResult } from '../lib/sandbox.ts';
import { Frame, Feedback } from './common.tsx';
import { Editor } from './Editor.tsx';
import { Code } from '../render/highlight.tsx';
import type { WidgetProps } from './index.tsx';

interface Test { name: string; code: string; hidden?: boolean; stdin?: string; timeoutMs?: number }
interface Case { name?: string; stdin?: string; expectedOutput: string; hidden?: boolean }
interface Def { id: string; language: 'python' | 'javascript'; prompt: string; starterCode?: string; stdin?: string; grading?: 'tests' | 'output'; tests?: Test[]; cases?: Case[]; outputMatch?: 'exact' | 'trimmed' | 'lines'; solution?: string; solutionAfterAttempts?: number; hints?: string[]; hint?: string; explanation?: string; limits?: { timeoutMs?: number } }
type Outcome = { name: string; ok: boolean; hidden: boolean; detail?: string };
type Saved = { code: string; attempts: number; hints: number };

const norm = (s: string, mode: Def['outputMatch']) => {
  if (mode === 'exact') return s;
  let t = s.replace(/\r\n/g, '\n').trim();
  if (mode === 'lines') t = t.split('\n').map((l) => l.trim().replace(/\s+/g, ' ')).join('\n');
  return t;
};

export function CodeExercise({ def, courseId }: WidgetProps<Def>) {
  const st = useWidgetState<Saved>(courseId, def.id);
  const [code, setCode] = useState(st.data?.code ?? def.starterCode ?? '');
  const [stdin, setStdin] = useState(def.stdin ?? '');
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [hints, setHints] = useState(st.data?.hints ?? 0);
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const timeout = Math.min(def.limits?.timeoutMs ?? 5000, 10000);
  const grading = def.grading ?? (def.cases ? 'output' : 'tests');
  const solutionAfter = def.solutionAfterAttempts ?? (grading === 'output' ? 2 : 3);
  const canReveal = !!def.solution && (solutionAfter === 0 || (solutionAfter > 0 && attempts >= solutionAfter));

  useEffect(() => { if (def.language === 'python') warmup(); }, [def.language]);
  const persist = (extra: Partial<Saved> = {}, complete?: boolean) => st.save({ code, attempts, hints, ...extra }, complete);

  if (def.language !== 'python') return <Frame kind="Code"><div className="placeholder">Only Python is available in this prototype.</div></Frame>;

  const doRun = async () => { setBusy('run'); setOutcomes(null); const r = await runPython(code, stdin, undefined, timeout); setRun(r); setBusy(null); persist(); };

  const doSubmit = async () => {
    setBusy('submit'); setRun(null);
    const res: Outcome[] = [];
    if (grading === 'output') {
      for (const [i, c] of (def.cases ?? []).entries()) {
        const r = await runPython(code, c.stdin ?? '', undefined, timeout);
        const ok = !r.error && norm(r.stdout, def.outputMatch ?? 'trimmed') === norm(c.expectedOutput, def.outputMatch ?? 'trimmed');
        res.push({ name: c.name ?? `Case ${i + 1}`, ok, hidden: !!c.hidden, detail: ok ? undefined : r.error ?? `Expected:\n${c.expectedOutput}\n\nGot:\n${r.stdout.trimEnd() || '(nothing)'}` });
        if (r.timedOut) break;
      }
    } else {
      for (const t of def.tests ?? []) {
        const r = await runPython(code, t.stdin ?? '', t.code, Math.min(t.timeoutMs ?? timeout, timeout));
        res.push({ name: t.name, ok: !r.error, hidden: !!t.hidden, detail: r.error ?? undefined });
        if (r.timedOut) break;
      }
    }
    const all = res.every((o) => o.ok);
    const a = all ? attempts : attempts + 1;
    setAttempts(a); setOutcomes(res); setBusy(null); persist({ attempts: a }, all || st.complete);
  };

  return (
    <Frame kind="Code exercise · Python" complete={st.complete}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <div className="ide">
        <Editor value={code} onChange={setCode} language="python" readOnly={st.complete} />
        <div className="console">
          <div className="console-bar"><span className="eyebrow">Console</span><label className="stdin">stdin <input value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="input for Run" /></label></div>
          <pre className="console-out">{busy === 'run' ? 'Running…' : run ? <>{run.stdout}{run.stderr && <span className="err">{run.stderr}</span>}{run.error && <span className="err">{run.error}</span>}{!run.stdout && !run.error && !run.stderr && <span className="dim">(no output)</span>}</> : <span className="dim">Press Run to see output.</span>}</pre>
        </div>
      </div>
      <div className="row toolbar">
        <button className="btn" onClick={doRun} disabled={!!busy}>Run</button>
        <button className="btn primary" onClick={doSubmit} disabled={!!busy || st.complete}>{busy === 'submit' ? 'Checking…' : 'Submit'}</button>
        <span className="spacer" />
        {def.hints && hints < def.hints.length && <button className="btn ghost" onClick={() => { setHints(hints + 1); persist({ hints: hints + 1 }); }}>Hint ({hints}/{def.hints.length})</button>}
        {canReveal && !showSolution && <button className="btn ghost" onClick={() => setShowSolution(true)}>Show solution</button>}
        {(def as any).resetable !== false && <button className="btn ghost" onClick={() => { setCode(def.starterCode ?? ''); setRun(null); setOutcomes(null); }}>Reset</button>}
      </div>
      {hints > 0 && <ul className="hints">{def.hints!.slice(0, hints).map((h, i) => <li key={i}><Md src={h} /></li>)}</ul>}
      {outcomes && (
        <ul className="results">
          {outcomes.map((o, i) => <li key={i} className={o.ok ? 'ok' : 'no'}><span className="tick">{o.ok ? '✔' : '✘'}</span><div><div className="result-name">{o.name}{o.hidden && <span className="dim"> · hidden</span>}</div>{!o.ok && <pre className="result-detail">{o.hidden ? 'Hidden test failed.' : o.detail}</pre>}</div></li>)}
        </ul>
      )}
      <Feedback ok={outcomes ? outcomes.every((o) => o.ok) : st.complete ? true : null} why={def.explanation} hint={def.hint} attempts={attempts}>
        {outcomes ? (outcomes.every((o) => o.ok) ? 'All checks passed.' : `${outcomes.filter((o) => o.ok).length} of ${outcomes.length} passed.`) : 'Passed.'}
      </Feedback>
      {showSolution && def.solution && <div className="solution"><span className="eyebrow">Solution</span><Code code={def.solution} lang="python" />{def.explanation && <p className="why-text"><Md src={def.explanation} /></p>}</div>}
    </Frame>
  );
}
