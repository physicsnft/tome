---
title: The Staff
estimatedMinutes: 18
summary: Five lines, and everything that sits on them.
---

# The Staff

Music is written on five lines. A note's **vertical position** says which pitch; its **shape** says how long. Nothing else on the page matters until you can read those two things.

Here is a C major scale, going up and coming back down. Press play and watch the notes light up as they sound.

:::widget type="score" id="staff-scale"
abc: |
  M:4/4
  L:1/4
  K:C
  CDEF|GABc|cBAG|FEDC|
tempo: 96
tempoRange: [50, 140]
:::

The first note is **middle C**, sitting on its own little line below the staff — a *ledger line*. Everything else in this scale climbs, line, space, line, space, all the way up to the C an octave higher.

:::widget type="score" id="staff-find-c"
prompt: Click the **highest note** in this scale.
abc: |
  M:4/4
  L:1/4
  K:C
  CDEF|GABc|
answer:
  kind: note
  accept: ["2:4"]
hint: The last note of the second bar.
explanation: 'The higher a note sits on the staff, the higher it sounds, so the highest note is the last one in bar 2. Its letter is lower-case *c* in the notation — C again, an octave (eight steps) above the C the scale started on. The scale ends where it began, one octave up.'
:::

## Line, space, line, space

Going up the staff, notes alternate between sitting **on** a line and sitting **in** the space between two lines. Neighbouring notes are always one letter apart.

:::widget type="score" id="staff-steps"
prompt: This melody moves by step except in one place, where it jumps. Click the note the jump lands on.
abc: |
  M:4/4
  L:1/4
  K:C
  CDEF|GcBA|
answer:
  kind: note
  accept: ["2:2"]
hint: Everything moves one step at a time until one place in bar 2 where it does not.
explanation: 'Every other move goes from a line to the next space or a space to the next line — one step. From G to c the melody skips the A and B between them, a leap of a fourth (G–A–B–C, counting both ends). After that it walks back down by step.'
:::

:::note title="Why letters stop at G"
Music uses only seven letters, A to G, and then starts again. Two notes with the same letter sound so alike that we treat them as the same note in a different register — an *octave* apart.
:::

## How long is a note?

:::widget type="score" id="staff-durations"
prompt: The same pitch, four different lengths — a whole note, two halves, four quarters, eight eighths. Listen to the beat stay steady while the notes divide.
abc: |
  M:4/4
  L:1/4
  K:C
  G4|G2G2|GGGG|G/2G/2G/2G/2G/2G/2G/2G/2|
tempo: 80
:::

:::widget type="multiple-choice" id="staff-durations-q"
prompt: In 4/4 time, how many quarter notes fit in one bar?
options:
  - text: Two
    explanation: 'Two *half* notes fill a bar of 4/4, because each half lasts two beats. A quarter note lasts one beat.'
  - text: Four
    correct: true
  - text: Eight
    explanation: 'Eight *eighth* notes fill a bar of 4/4 — each lasts half a beat. A quarter note lasts a whole beat.'
hint: 'The top number of the time signature counts the beats; the bottom 4 says each beat is a quarter note.'
explanation: 'In 4/4 the top 4 means four beats per bar, and the bottom 4 means each beat is a quarter note — so four quarter notes fill a bar. You heard it in the example above. One whole note, two halves, four quarters or eight eighths all take the same four beats.'
:::

:::checkpoint
You can read pitch and length off the page. Next: finding those notes on a keyboard.
:::
