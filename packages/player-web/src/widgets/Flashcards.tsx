import { useMemo, useState } from 'react';
import { Item, type ItemDef } from './Media.tsx';
import { Frame } from './common.tsx';
import { ReviewSession, type ReviewCard } from '../components/ReviewSession.tsx';
import { cardKey } from '../lib/review.ts';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; cards: { front: ItemDef; back: ItemDef }[]; spaced?: boolean; shuffle?: boolean }

/**
 * With `spaced: true` (SPEC §7.3) a deck reviews: new cards are introduced and known ones come back on a
 * schedule (lib/review.ts), and the course-wide review gathers them. Without it, a deck is browsed, as it
 * always was — the field is opt-in in the frozen format, so existing decks keep their behaviour.
 */
export function Flashcards({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const [mode, setMode] = useState<'review' | 'browse'>(def.spaced ? 'review' : 'browse');
  // `shuffle` is honoured once per visit, so a learner does not memorise the order instead of the cards.
  const ordered = useMemo(() => {
    const cs = [...def.cards];
    if (def.shuffle) for (let i = cs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cs[i], cs[j]] = [cs[j], cs[i]]; }
    return cs;
  }, [def]);
  const cards: ReviewCard[] = useMemo(
    () => ordered.map((c) => ({ courseId, widgetId: def.id, key: cardKey(c.front), front: c.front, back: c.back })),
    [ordered, courseId, def.id]);

  return (
    <Frame kind={mode === 'review' ? `Flashcards · ${def.cards.length} cards` : def.spaced ? 'Flashcards · browsing' : `Flashcards · ${def.cards.length} cards`} graded={false}>
      {mode === 'review'
        ? <ReviewSession cards={cards} assetUrl={assetUrl} allowNew onBrowse={() => setMode('browse')} emptyHint="You have seen every card in this deck." />
        : <Browse cards={ordered} assetUrl={assetUrl} onReview={def.spaced ? () => setMode('review') : undefined} />}
    </Frame>
  );
}

function Browse({ cards, assetUrl, onReview }: { cards: Def['cards']; assetUrl: (p: string) => string; onReview?: () => void }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];
  const go = (d: number) => { setI((i + d + cards.length) % cards.length); setFlipped(false); };
  return (
    <>
      <div className="review-meta dim small">Card {i + 1} of {cards.length}{onReview ? ' · browsing does not change your review schedule' : ''}</div>
      <div role="button" tabIndex={0} className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(!flipped); } if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}
        aria-label={`Card ${i + 1} of ${cards.length}, ${flipped ? 'back' : 'front'}. Space turns it over, arrow keys move.`}>
        <div className="card-face"><Item item={flipped ? card.back : card.front} assetUrl={assetUrl} /></div>
        <span className="card-hint">{flipped ? 'Back' : 'Front — tap to turn over'}</span>
      </div>
      <div className="row">
        <button className="btn" onClick={() => go(-1)}>Previous</button>
        <button className="btn" onClick={() => go(1)}>Next</button>
        {onReview && <button className="btn ghost" onClick={onReview}>Back to review</button>}
      </div>
    </>
  );
}
