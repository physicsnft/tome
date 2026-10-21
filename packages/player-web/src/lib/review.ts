/**
 * Spaced review for flashcards: Leitner boxes.
 *
 * Chosen over SM-2 and its descendants on purpose. A box is something a learner can understand ("seen
 * three times, back in a week"), an author can predict, and a learner who disappears for a fortnight
 * recovers from gracefully — overdue cards are simply due, not penalised. The goal is a course that
 * keeps working for years without a server tuning anyone's parameters.
 *
 * Pure functions with an injectable clock, so the schedule can be tested without waiting days.
 */
export type Grade = 'again' | 'hard' | 'good';

/** Days until a card in each box is due again. Box 0 is "still learning": it comes back this session. */
export const BOX_DAYS = [0, 1, 3, 7, 16, 35] as const;
export const MAX_BOX = BOX_DAYS.length - 1;
const DAY = 24 * 60 * 60 * 1000;

export interface CardState { box: number; due: number; reps: number; lapses: number }
export type DeckState = Record<string, CardState>;

/** The next state of a card after the learner grades it. */
export function schedule(prev: CardState | undefined, grade: Grade, now: number): CardState {
  const box = prev?.box ?? 0;
  const reps = (prev?.reps ?? 0) + 1;
  if (grade === 'again') return { box: 0, due: now, reps, lapses: (prev?.lapses ?? 0) + (prev ? 1 : 0) };
  if (grade === 'hard') {
    const b = Math.max(1, box);
    return { box: b, due: now + (BOX_DAYS[b] * DAY) / 2, reps, lapses: prev?.lapses ?? 0 };
  }
  const b = Math.min(MAX_BOX, box + 1);
  return { box: b, due: now + BOX_DAYS[b] * DAY, reps, lapses: prev?.lapses ?? 0 };
}

/** What each button would do, for showing on the button: "again · this session", "good · 3 days". */
export function preview(prev: CardState | undefined, grade: Grade, now: number): string {
  const next = schedule(prev, grade, now);
  const ms = next.due - now;
  if (ms <= 0) return 'this session';
  const hours = ms / (60 * 60 * 1000);
  if (hours < 23) return `${Math.round(hours)} h`;
  const days = Math.round(ms / DAY);
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * A card's identity is its front, not its position: an author who reorders a deck, or inserts a card in
 * the middle, must not scramble every learner's schedule. Editing a card's front does reset that card,
 * which is correct — it is a different card now.
 */
export function cardKey(front: unknown): string {
  const s = typeof front === 'string' ? front : JSON.stringify(front);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

export interface Queue<T> { due: T[]; fresh: T[] }

/** Due cards first, most overdue first; then cards never seen, in the author's order. */
export function buildQueue<T>(cards: T[], keyOf: (c: T) => string, state: DeckState, now: number, maxNew = 20): Queue<T> {
  const due = cards.filter((c) => state[keyOf(c)] && state[keyOf(c)].due <= now)
    .sort((a, b) => state[keyOf(a)].due - state[keyOf(b)].due);
  const fresh = cards.filter((c) => !state[keyOf(c)]).slice(0, maxNew);
  return { due, fresh };
}

/** When the next card in a deck comes due, if nothing is due now. */
export function nextDue(state: DeckState, keys: string[], now: number): number | null {
  const times = keys.map((k) => state[k]?.due).filter((d): d is number => d !== undefined && d > now);
  return times.length ? Math.min(...times) : null;
}

export function describeWait(ms: number): string {
  const hours = ms / (60 * 60 * 1000);
  if (hours < 1) return 'within the hour';
  if (hours < 23) return `in ${Math.round(hours)} hours`;
  const days = Math.round(ms / DAY);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}
