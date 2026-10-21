/**
 * Where review schedules live. One progress row per *card*, not per deck: progress sync is
 * last-write-wins per row, so a whole deck in one row would let a phone and a laptop that both reviewed
 * offline silently erase each other's work. Per card, they only collide on the same card — and then the
 * later review is the right one to keep.
 */
import { progress } from './progress.ts';
import type { CardState, DeckState } from './review.ts';

const rowId = (widgetId: string, key: string) => `${widgetId}#${key}`;

export function readDeck(courseId: string, widgetId: string, store = progress.snapshot()): DeckState {
  const prefix = `${courseId}:${widgetId}#`;
  const out: DeckState = {};
  for (const [k, v] of Object.entries(store)) if (k.startsWith(prefix) && v.data) out[k.slice(prefix.length)] = v.data as CardState;
  return out;
}

export function writeCard(courseId: string, widgetId: string, key: string, state: CardState) {
  progress.set(courseId, rowId(widgetId, key), { complete: false, data: state });
}
