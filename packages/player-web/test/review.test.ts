import { schedule, preview, cardKey, buildQueue, nextDue, BOX_DAYS } from '../src/lib/review.ts';
const DAY = 864e5, t0 = Date.UTC(2026, 0, 1);
let ok = 0, bad = 0;
const eq = (name: string, a: unknown, b: unknown) => { const pass = JSON.stringify(a) === JSON.stringify(b); pass ? ok++ : bad++; if (!pass) console.log('FAIL', name, a, '!==', b); };

// a new card answered Good three times climbs 1 → 3 → 7 days
let s = schedule(undefined, 'good', t0); eq('first good -> box1', [s.box, (s.due - t0) / DAY], [1, 1]);
s = schedule(s, 'good', s.due);           eq('second good -> box2', [s.box], [2]);
s = schedule(s, 'good', s.due);           eq('third good -> box3, 7d', [s.box, BOX_DAYS[s.box]], [3, 7]);
// Again drops to box 0, due immediately, and counts a lapse
const lapsed = schedule(s, 'again', t0);  eq('again resets', [lapsed.box, lapsed.due, lapsed.lapses], [0, t0, 1]);
eq('again on a new card is not a lapse', schedule(undefined, 'again', t0).lapses, 0);
// Hard keeps the box but halves the wait; never stays in box 0
eq('hard from box 3', [schedule(s, 'hard', t0).box, (schedule(s, 'hard', t0).due - t0) / DAY], [3, 3.5]);
eq('hard on a new card goes to box 1', schedule(undefined, 'hard', t0).box, 1);
// The top box is a ceiling
let top = { box: 5, due: t0, reps: 9, lapses: 0 }; eq('ceiling', schedule(top, 'good', t0).box, 5);
// Button labels
eq('preview again', preview(undefined, 'again', t0), 'this session');
eq('preview hard new', preview(undefined, 'hard', t0), '12 h');
eq('preview good box2', preview({ box: 2, due: t0, reps: 2, lapses: 0 }, 'good', t0), '7 days');
// Keys follow content, not position
eq('key stable', cardKey('**AN**'), cardKey('**AN**'));
eq('key differs', cardKey('AN') === cardKey('AŠ'), false);
eq('item object key', cardKey({ text: 'hola', audio: 'a.mp3' }) === cardKey({ text: 'hola', audio: 'a.mp3' }), true);
// Queue: overdue first, then due, then new in author order; future cards excluded
const cards = ['a', 'b', 'c', 'd', 'e'];
const st = { a: { box: 1, due: t0 + DAY, reps: 1, lapses: 0 }, b: { box: 2, due: t0 - 2 * DAY, reps: 2, lapses: 0 }, c: { box: 1, due: t0 - DAY, reps: 1, lapses: 0 } };
const q = buildQueue(cards, (c) => c, st, t0);
eq('due order', q.due, ['b', 'c']); eq('fresh order', q.fresh, ['d', 'e']);
eq('maxNew', buildQueue(cards, (c) => c, {}, t0, 2).fresh, ['a', 'b']);
eq('nextDue', nextDue(st, cards, t0), t0 + DAY);
// A learner who comes back after a month: everything simply due, in overdue order, nothing lost
const late = buildQueue(cards, (c) => c, st, t0 + 30 * DAY); eq('month away', late.due, ['b', 'c', 'a']);
console.log(`${ok} passed, ${bad} failed`); if (bad) process.exit(1);
