---
title: The Pin
estimatedMinutes: 20
summary: A piece that cannot move without exposing something worse.
---

# The Pin

A **pin** is a line attack: a bishop, rook or queen attacks a piece that is shielding a more valuable piece behind it. If the shield moves, the piece behind is taken. If the piece behind is the king, the shield *cannot legally move* at all — an **absolute pin**.

:::widget type="board" id="pin-demo"
prompt: |
  The bishop on b5 pins the knight on c6 against the king on e8. The knight cannot move.

  Click the pinned piece.
rows: 8
cols: 8
pieces:
  - { at: b5, glyph: "♗" }
  - { at: c6, glyph: "♞" }
  - { at: e8, glyph: "♚" }
  - { at: e1, glyph: "♔" }
marks:
  - { at: b5, to: e8, kind: arrow, color: red }
answer:
  kind: square
  accept: [c6]
hint: 'Follow the red arrow from the bishop. Which piece stands between it and the king?'
explanation: 'The knight on c6 sits on the bishop''s diagonal with the king behind it. Moving it would expose the king to check, which is illegal, so the knight is frozen. It still counts as a defender, though, and it still blocks the line.'
:::

## Pin it

:::widget type="board" id="pin-puzzle-1"
prompt: White to move. Pin the knight to the queen.
rows: 8
cols: 8
pieces:
  - { at: c1, glyph: "♗" }
  - { at: g1, glyph: "♔" }
  - { at: f6, glyph: "♞" }
  - { at: h8, glyph: "♚" }
  - { at: d8, glyph: "♛" }
  - { at: h7, glyph: "♟" }
answer:
  kind: move
  accept: [c1g5, c1-g5]
hint: Which diagonal runs through the knight to the queen?
explanation: 'Bg5 puts the bishop on the diagonal g5–f6–e7–d8, with the knight in front of the queen. This pin is *relative*: the knight is allowed to move, but if it does, Bxd8 wins the queen. Black now has to spend moves defending against it.'
:::

## Exploit the pin

A pinned piece is a *target*: it cannot run, so pile up on it.

:::widget type="board" id="pin-puzzle-2"
prompt: White to move. The knight on c6 is pinned against the king. Win material by attacking it a second time.
rows: 8
cols: 8
pieces:
  - { at: b5, glyph: "♗" }
  - { at: d1, glyph: "♕" }
  - { at: g1, glyph: "♔" }
  - { at: c6, glyph: "♞" }
  - { at: e8, glyph: "♚" }
  - { at: b7, glyph: "♟" }
answer:
  kind: move
  accept: [d1d5, d1-d5, d1f3, d1-f3]
hint: 'The queen needs a square from which it attacks c6 — along a file, a rank or a diagonal — where it cannot be taken.'
explanation: 'The pinned knight cannot run. After Qd5 or Qf3 it has two attackers against one defender, the b7 pawn. So White plays Bxc6+ bxc6 Qxc6+: bishop for knight, plus a pawn, with check. Piling up on a pinned piece is the standard way to cash in a pin.'
:::

:::widget type="multiple-choice" id="pin-absolute"
prompt: What makes a pin *absolute*?
options:
  - text: The pinned piece is a queen
    explanation: 'A queen can be pinned too, but which piece is pinned does not decide whether it may move. What matters is the piece standing *behind* it.'
  - text: The piece behind the pinned piece is the king, so moving the pinned piece would be illegal
    correct: true
  - text: The pinning piece is defended
    explanation: 'Protecting the pinning piece changes how dangerous the pin is, not whether the pinned piece may legally move.'
hint: '*Absolute* means the rules, not just good sense, forbid the move.'
explanation: 'When the king is behind the pinned piece, moving it would expose the king to check, which is illegal. Against any other piece the pin is *relative*. The move is allowed, just costly — like the knight pinned to the queen in the puzzle above.'
:::

:::checkpoint
Forks and pins account for most of the material that changes hands in club games. Look for them on every move — yours and your opponent's.
:::
