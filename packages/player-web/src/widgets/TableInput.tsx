import { useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import type { WidgetProps } from './index.tsx';

type Blank = { answer: string | number; tolerance?: number; alternatives?: (string | number)[]; unit?: string };
type Cell = string | null | Blank;
interface Def {
  id: string; prompt: string; columns: string[]; rows?: string[]; cells: Cell[][]; caption?: string;
  mode?: 'type' | 'choose'; options?: string[]; hint?: string; explanation?: string; solutionAfterAttempts?: number;
}

const isBlank = (c: Cell): c is Blank => !!c && typeof c === 'object';
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

function cellOk(c: Blank, given: string): boolean {
  const targets = [c.answer, ...(c.alternatives ?? [])];
  return targets.some((t) => {
    if (typeof t === 'number') { const v = Number(given.replace(',', '.')); return Number.isFinite(v) && Math.abs(v - t) <= (c.tolerance ?? 0); }
    return norm(String(t)) === norm(given);
  });
}

/** A grid the learner fills in: Punnett squares, data tables, payoff matrices (§7.3 table-input). */
export function TableInput({ def, courseId }: WidgetProps<Def>) {
  const st = useWidgetState<{ values: Record<string, string>; attempts: number }>(courseId, def.id);
  const [values, setValues] = useState<Record<string, string>>(st.data?.values ?? {});
  const [checked, setChecked] = useState(st.complete);
  const [attempts, setAttempts] = useState(st.data?.attempts ?? 0);
  const [showSol, setShowSol] = useState(false);
  const key = (r: number, c: number) => `${r}:${c}`;

  const blanks = def.cells.flatMap((row, r) => row.map((c, i) => ({ c, r, i })).filter((x) => isBlank(x.c)));
  const allOk = blanks.every(({ c, r, i }) => cellOk(c as Blank, values[key(r, i)] ?? ''));
  const filled = blanks.every(({ r, i }) => (values[key(r, i)] ?? '').trim());

  const submit = () => {
    setChecked(true);
    if (allOk) st.save({ values, attempts }, true);
    else { setAttempts(attempts + 1); st.save({ values, attempts: attempts + 1 }); }
  };
  const set = (r: number, c: number, v: string) => { setValues({ ...values, [key(r, c)]: v }); setChecked(false); };

  const cellClass = (c: Cell, r: number, i: number) => {
    if (!isBlank(c)) return c === null ? 'spacer' : 'given';
    // Correct cells stay marked correct across attempts: the learner should see what to change, not start over.
    if (!checked) return 'blank';
    return cellOk(c, values[key(r, i)] ?? '') ? 'blank right' : 'blank wrong';
  };

  return (
    <Frame kind="Fill in the table" complete={st.complete}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <div className="table-wrap">
        <table className="grid-table">
          {def.caption && <caption><Md src={def.caption} /></caption>}
          <thead>
            <tr>{def.rows && <th scope="col" className="corner" />}{def.columns.map((c, i) => <th key={i} scope="col"><Md src={c} /></th>)}</tr>
          </thead>
          <tbody>
            {def.cells.map((row, r) => (
              <tr key={r}>
                {def.rows && <th scope="row"><Md src={def.rows[r] ?? ''} /></th>}
                {row.map((c, i) => (
                  <td key={i} className={cellClass(c, r, i)}>
                    {!isBlank(c) ? (c === null ? '' : <Md src={c} />)
                      : def.mode === 'choose' ? (
                        <select value={values[key(r, i)] ?? ''} disabled={st.complete} onChange={(e) => set(r, i, e.target.value)} aria-label={`Row ${r + 1}, column ${i + 1}`}>
                          <option value="">—</option>
                          {(def.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={values[key(r, i)] ?? ''} disabled={st.complete} onChange={(e) => set(r, i, e.target.value)}
                          aria-label={`Row ${def.rows?.[r] ?? r + 1}, column ${def.columns[i]}`} size={Math.max(3, String(c.answer).length + 1)} />
                      )}
                    {isBlank(c) && c.unit && <span className="unit">{c.unit}</span>}
                    {showSol && isBlank(c) && <span className="sol-note">{String(c.answer)}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!st.complete && <button className="btn primary" onClick={submit} disabled={!filled}>Check</button>}
      <Feedback ok={checked ? allOk : null} why={def.explanation} hint={def.hint} attempts={attempts}
        solution={{ after: def.solutionAfterAttempts, attempts, shown: showSol, show: () => setShowSol(true) }}>
        {allOk ? 'All correct.'
          : `${blanks.filter(({ c, r, i }) => cellOk(c as Blank, values[key(r, i)] ?? '')).length} of ${blanks.length} cells correct — the wrong ones are marked.`}
      </Feedback>
    </Frame>
  );
}
