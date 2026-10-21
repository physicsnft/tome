/** Every flashcard in a course, for the course-wide review and the "N due" counts. */
import type { LoadedCourse } from './course.ts';
import type { ReviewCard } from '../components/ReviewSession.tsx';
import { cardKey } from './review.ts';
import { readDeck } from './deck.ts';
import type { WidgetState } from './progress.ts';

export function courseCards(course: LoadedCourse): ReviewCard[] {
  const out: ReviewCard[] = [];
  for (const lesson of course.lessons)
    for (const w of lesson.widgets as any[])
      if (w.type === 'flashcards' && w.spaced) for (const c of w.cards ?? []) out.push({ courseId: course.manifest.id, widgetId: w.id, key: cardKey(c.front), front: c.front, back: c.back });
  return out;
}

/** Cards already learned and due now. Never counts unseen cards: review follows teaching, not the reverse. */
export function dueCount(cards: ReviewCard[], store: Record<string, WidgetState>, now = Date.now()): number {
  const decks = new Map<string, ReturnType<typeof readDeck>>();
  let n = 0;
  for (const c of cards) {
    const k = `${c.courseId}:${c.widgetId}`;
    if (!decks.has(k)) decks.set(k, readDeck(c.courseId, c.widgetId, store));
    const s = decks.get(k)![c.key];
    if (s && s.due <= now) n++;
  }
  return n;
}
