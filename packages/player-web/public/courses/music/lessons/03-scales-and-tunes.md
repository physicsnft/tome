---
title: Scales and Tunes
estimatedMinutes: 20
summary: A scale, a famous melody, and one puzzle about it.
---

# Scales and Tunes

## The major scale

A major scale is seven notes and then the octave, with a particular pattern of steps: **tone, tone, semitone, tone, tone, tone, semitone**. That pattern is what makes it sound *major*, in any key.

:::widget type="score" id="tunes-scale-g"
prompt: The same scale, starting on G. One note has to be sharpened to keep the pattern — look at the key signature.
abc: |
  M:4/4
  L:1/4
  K:G
  GABc|defg|
tempo: 100
highlight:
  - { from: 2, to: 2, label: "F is sharp here" }
:::

:::widget type="score" id="tunes-which-sharp"
prompt: Which note in this G major scale is sharpened?
abc: |
  M:4/4
  L:1/4
  K:G
  GABc|defg|
play: false
answer:
  kind: text
  accept: ["F", "F#", "F sharp", "f#"]
hint: The key signature puts one sharp on the top line.
explanation: F♯. Without it, the step from E to F would be a semitone in the wrong place, and the scale would stop sounding major.
:::

:::widget type="keyboard" id="tunes-g-scale-keys"
prompt: Play the G major scale, in order, from G4 up to G5.
range: [C4, C6]
labels: c-only
answer:
  kind: sequence
  accept: [["G4", "A4", "B4", "C5", "D5", "E5", "F#5", "G5"]]
hint: Seven white keys and one black one — the black key is between F and G.
explanation: 'A major scale follows one pattern of steps: whole, whole, half, whole, whole, whole, half. From C that pattern uses only white keys. From G, the step from E to the seventh note must be a whole step, so F becomes F♯, and the last step from F♯ to G is the half step. Only the starting note moves; the pattern stays the same.'
:::

## Ode to Joy

Beethoven's tune from the Ninth Symphony — public domain, and mostly stepwise, which makes it a good first melody.

:::widget type="score" id="tunes-ode"
prompt: Listen first, then follow the notes. Slow it down if it helps.
abc: |
  T:Ode to Joy
  M:4/4
  L:1/4
  K:D
  FF GA|AG FE|DD EF|F3 E|
  FF GA|AG FE|DD EF|E3 D|
tempo: 92
tempoRange: [40, 132]
:::

:::widget type="score" id="tunes-ode-question"
prompt: The first and second halves are almost identical. Click the note where they **first differ**.
abc: |
  M:4/4
  L:1/4
  K:D
  FF GA|AG FE|DD EF|F3 E|
  FF GA|AG FE|DD EF|E3 D|
answer:
  kind: note
  accept: ["8:1"]
hint: Compare bar 4 with bar 8.
explanation: 'Bars 1–3 and 5–7 are identical. Bar 4 holds F♯ and steps down to E, which sounds unfinished — a question. Bar 8 is one step lower, E down to D, and D is the home note of the key, so the tune comes to rest. Same shape, different landing: that is how a tune ends a phrase.'
:::

:::widget type="keyboard" id="tunes-ode-start"
prompt: Play the first four notes of the melody — F♯, F♯, G, A — starting on F♯4.
range: [C4, C6]
answer:
  kind: sequence
  accept: [["F#4", "F#4", "G4", "A4"]]
hint: The tune is in D major, so every F is sharp.
explanation: 'The tune is in D major, whose key signature sharpens every F — so F♯, F♯, G, A. It moves by step, one key at a time except for the repeated note. That is why Ode to Joy is so often the first tune people learn.'
:::

## The same tune, moved

A melody keeps its shape when you move it to another key — every interval stays the same, only the starting pitch changes. This is *Ode to Joy* written two semitones lower, in C.

:::widget type="score" id="tunes-transposed"
prompt: "The same tune, transposed down a whole tone. Play both and listen — nothing about the melody has changed except its height."
abc: |
  M:4/4
  L:1/4
  K:D
  FF GA|AG FE|DD EF|F3 E|
transpose: -2
tempo: 92
:::

## One more, in three

A traditional English tune, in 3/4 — three beats to the bar instead of four. Count *one*-two-three while it plays.

:::widget type="score" id="tunes-three"
abc: |
  T:Greensleeves (traditional)
  M:3/4
  L:1/8
  K:Am
  A2|c3 d e2|f3 e d2|c3 A A2|^G3 A B2|c3 A A4|
tempo: 108
:::

:::widget type="multiple-choice" id="tunes-three-q"
prompt: How can you tell this tune is in 3/4 rather than 4/4?
options:
  - text: The time signature says 3/4, and each bar holds three quarter-note beats
    correct: true
  - text: It is slower
    explanation: 'Speed changes how fast the beats go by, not how many there are in a bar. A 4/4 tune can be slow and a 3/4 waltz can be fast.'
  - text: It is in a minor key
    explanation: 'It *is* minor, but the key decides which notes are used, not how many beats fill a bar.'
hint: 'Count the beats in one bar. Speed and key do not change that number.'
explanation: 'The time signature gives the beats per bar, and you can check it by counting — each bar of Greensleeves holds three quarter-note beats (six eighths). You also hear it as a lilt, with a strong beat followed by two weak ones, ONE-two-three. A tune in 4/4 would have four beats per bar.'
:::

:::checkpoint
You can read a melody, play it, and hear how it is put together. That is enough to start learning pieces.
:::
