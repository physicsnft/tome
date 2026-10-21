import { useMemo, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { Frame, Feedback } from './common.tsx';
import { Item, itemText, type ItemDef, type MediaDef } from './Media.tsx';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; explanation?: string; prompt: string; audio?: MediaDef; items: ItemDef[]; hint?: string; solutionAfterAttempts?: number }

export function Ordering({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<{ order: number[] }>(courseId, def.id);
  const shuffled = useMemo(() => { const o = def.items.map((_, i) => i); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o.every((v, i) => v === i) ? o.reverse() : o; }, [def]);
  const [order, setOrder] = useState<number[]>(st.data?.order ?? shuffled);
  const [checked, setChecked] = useState(st.complete);
  const [attempt, setAttempt] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const ok = order.every((v, i) => v === i);
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= order.length) return; const o = [...order]; [o[i], o[j]] = [o[j], o[i]]; setOrder(o); setChecked(false); };
  const submit = () => { setChecked(true); if (!ok) setAttempt((a) => a + 1); st.save({ order }, ok); };
  return (
    <Frame kind="Put in order" complete={st.complete} audio={def.audio} assetUrl={assetUrl} attemptKey={attempt}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      <ol className="order-list">
        {order.map((idx, i) => (
          <li key={idx} className={checked ? (idx === i ? 'right' : 'wrong') : ''}>
            <span className="order-text"><Item item={def.items[idx]} assetUrl={assetUrl} /></span>
            {!st.complete && <span className="order-btns"><button type="button" className="btn small" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${itemText(def.items[idx])} up`}>↑</button><button type="button" className="btn small" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${itemText(def.items[idx])} down`}>↓</button></span>}
          </li>
        ))}
      </ol>
      {!st.complete && <button className="btn primary" onClick={submit}>Check</button>}
      <Feedback ok={checked ? ok : null} why={def.explanation} hint={def.hint} attempts={attempt}
        solution={{ after: def.solutionAfterAttempts, attempts: attempt, shown: showSol, show: () => setShowSol(true),
          content: <ol className="sol-list">{def.items.map((it, i) => <li key={i}>{itemText(it)}</li>)}</ol> }}>
        {ok ? 'Correct order.' : `${order.filter((v, i) => v === i).length} of ${order.length} in the right place.`}
      </Feedback>
    </Frame>
  );
}
