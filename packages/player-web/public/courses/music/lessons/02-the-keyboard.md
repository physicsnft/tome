---
title: The Keyboard
estimatedMinutes: 18
summary: Where the letters live under your fingers.
---

# The Keyboard

The keyboard makes the pattern visible: the black keys come in groups of **two** and **three**, and that grouping is how you find any note without counting from the end.

**C is always the white key immediately left of a group of two blacks.**

:::widget type="keyboard" id="kb-find-c"
prompt: Find **C5** — the C in the middle of this keyboard. Press it.
range: [C4, C6]
labels: none
answer:
  kind: keys
  accept: [["C5"]]
hint: Look for a pair of black keys, then take the white key just to their left.
explanation: 'Black keys come in groups of two and three, and C is always the white key just left of a group of two. That pattern repeats every octave, so C4, C5 and C6 all look alike — C5 is the one in the middle of this range. Once you can find C, every other letter follows from it.'
:::

:::tip title="Every key sounds"
Press any key to hear it, right or wrong. Wandering around is the point — the connection you want is between the name, the position, and the sound.
:::

## From the staff to the key

:::widget type="score" id="kb-what-note"
prompt: What note is this?
abc: |
  M:4/4
  L:1/1
  K:C
  G|
play: true
answer:
  kind: text
  accept: ["G", "G4", "g"]
hint: 'In the treble clef, the curl of the clef wraps around one line. That line is named after the note.'
explanation: 'The treble clef is also called the *G clef* — its curl wraps around the second line from the bottom, and a note on that line is G. Count up or down from it by line and space to name any other note.'
:::

:::widget type="keyboard" id="kb-play-g"
prompt: Now play that same G on the keyboard — the one just above middle C.
range: [C4, C6]
answer:
  kind: keys
  accept: [["G4"]]
hint: 'Find middle C (C4) by the black-key pattern, then count up the white keys — C, D, E, F, G.'
explanation: 'G4 is five white keys above middle C — C, D, E, F, G. It is also the white key between the first and second black keys of the group of three. That is the same G as the note on the second line of the staff.'
:::

## Building a chord

Three notes, every other letter: C, E, G. That is a **C major triad**, the first chord most people learn.

:::widget type="keyboard" id="kb-c-major"
prompt: Press **C4, E4 and G4** together, then Check.
range: [C4, C6]
given: [C4]
answer:
  kind: keys
  accept: [["C4", "E4", "G4"]]
hint: "Skip a white key each time — C, then E, then G."
explanation: 'Root, third, fifth — C, E and G, skipping one white key each time. Counted in semitones, C to E is four (a *major third*), and E to G is three. That 4 + 3 shape, built from any key, makes a major triad.'
:::

:::widget type="score" id="kb-c-major-score"
prompt: Here is that same chord written down. The three notes stack on the staff exactly as they sit under your hand.
abc: |
  M:4/4
  L:1/1
  K:C
  [CEG]|
:::

## Minor, by one small change

:::widget type="keyboard" id="kb-c-minor"
prompt: Move the middle note down one key — including black keys — to make **C minor**. Press all three notes.
range: [C4, C6]
answer:
  kind: keys
  accept: [["C4", "D#4", "G4"], ["C4", "Eb4", "G4"]]
hint: The note between D and E is a black key.
explanation: 'C–E♭–G. Lowering the middle note by one semitone turns the major third (four semitones) into a minor third (three). The outer notes stay where they are, and that single semitone is the whole difference between the bright sound and the dark one.'
:::

:::checkpoint
You can find notes on the staff and on the keys. Time to play a tune.
:::
