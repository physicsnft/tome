import { useEffect, useMemo, useRef, useState } from 'react';
import { Item, type ItemDef } from '../widgets/Media.tsx';
import { buildQueue, describeWait, nextDue, preview, schedule, type Grade } from '../lib/review.ts';
import { readDeck, writeCard } from '../lib/deck.ts';
import { useProgress } from '../lib/progress.ts';

export interface ReviewCard { courseId: string; widgetId: string; key: string; front: ItemDef; back: ItemDef }

/**
 * One review session over any set of cards — a single deck in a lesson, or every deck in a course.
 * `allowNew` is false for the course-wide session: review must never put unseen material in front of a
 * learner before the lesson that teaches it. Practice mode runs through every card without touching the
 * schedule.
 */
export function ReviewSession({ cards, assetUrl, allowNew, onBrowse, emptyHint }: {
  cards: ReviewCard[]; assetUrl: (p: string) => string; allowNew: boolean; onBrowse?: () => void; emptyHint?: string;
}) {
  const store = useProgress();
  const now = () => Date.now();
  const stateOf = (c: ReviewCard) => readDeck(c.courseId, c.widgetId, store)[c.key];
  const id = (c: ReviewCard) => `${c.courseId}:${c.widgetId}#${c.key}`;

  // The queue is fixed when the session starts: grading a card must not reshuffle what is in front of you.
  const [session, setSession] = useState<{ queue: ReviewCard[]; cram: boolean } | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const snapshotStates = () => Object.fromEntries(cards.map((c) => [id(c), stateOf(c)]).filter(([, s]) => s));
  const start = (cram = false) => {
    const q = cram ? { due: cards, fresh: [] as ReviewCard[] } : buildQueue(cards, id, snapshotStates(), now(), allowNew ? 20 : 0);
    setSession({ queue: [...q.due, ...q.fresh], cram });
    setPos(0); setFlipped(false); setDone(0);
  };
  useEffect(() => { start(); }, [cards.map(id).join('|')]);

  const nextAt = useMemo(() => nextDue(snapshotStates(), cards.map(id), now()), [store, cards]);

  if (!session) return null;
  const card = session.queue[pos];

  const grade = (g: Grade) => {
    if (!card || !flipped) return;
    if (!session.cram) writeCard(card.courseId, card.widgetId, card.key, schedule(stateOf(card), g, now()));
    // "Again" means not yet: the card comes back a few cards later in this session, not tomorrow.
    if (g === 'again') { const queue = [...session.queue]; queue.splice(Math.min(queue.length, pos + 4), 0, card); setSession({ ...session, queue }); }
    else setDone(done + 1);
    setPos(pos + 1); setFlipped(false);
    requestAnimationFrame(() => cardRef.current?.focus());
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(!flipped); return; }
    if (!flipped) return;
    const g = ({ '1': 'again', '2': 'hard', '3': 'good' } as Record<string, Grade>)[e.key];
    if (g) { e.preventDefault(); grade(g); }
  };

  if (!card) {
    const wait = nextAt ? describeWait(nextAt - now()) : null;
    return (
      <div className="review-done" role="status">
        {done > 0
          ? <p><strong>Done for now.</strong> You reviewed {done} card{done === 1 ? '' : 's'}{session.cram ? ' — as practice, without changing when they come back' : ''}.</p>
          : <p><strong>{emptyHint ?? 'Nothing to review right now.'}</strong></p>}
        {wait && !session.cram && <p className="dim">The next card comes back {wait}.</p>}
        <div className="row">
          {cards.length > 0 && <button className="btn" onClick={() => start(true)}>Practise all {cards.length} anyway</button>}
          {onBrowse && <button className="btn ghost" onClick={onBrowse}>Browse the cards</button>}
        </div>
      </div>
    );
  }

  const st = stateOf(card);
  return (
    <div className="review">
      <div className="review-meta dim small" aria-live="polite">
        Card {pos + 1} of {session.queue.length}
        {session.cram ? ' · practice' : !st ? ' · new' : st.box === 0 ? ' · still learning' : ` · seen ${st.reps} time${st.reps === 1 ? '' : 's'}`}
      </div>
      <div ref={cardRef} role="button" tabIndex={0} className={`card ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(!flipped)} onKeyDown={onKey}
        aria-label={flipped ? 'Card back. Press 1 for again, 2 for hard, 3 for good.' : 'Card front. Press Space to turn it over.'}>
        <div className="card-face"><Item item={flipped ? card.back : card.front} assetUrl={assetUrl} /></div>
        <span className="card-hint">{flipped ? 'How well did you know it?' : 'Think of the answer, then turn the card'}</span>
      </div>
      {flipped ? (
        <div className="grades" role="group" aria-label="How well did you know it?">
          {(['again', 'hard', 'good'] as Grade[]).map((g, i) => (
            <button key={g} className={`btn grade grade-${g}`} onClick={() => grade(g)}>
              <span className="grade-name">{g === 'again' ? 'Again' : g === 'hard' ? 'Hard' : 'Good'}</span>
              <span className="grade-when">{session.cram ? 'practice' : preview(st, g, now())}</span>
              <kbd aria-hidden="true">{i + 1}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <div className="row"><button className="btn primary" onClick={() => { setFlipped(true); requestAnimationFrame(() => cardRef.current?.focus()); }}>Show answer</button></div>
      )}
    </div>
  );
}
