---
title: The Fork
estimatedMinutes: 20
summary: One piece, two targets.
---

# The Fork

A **fork** attacks two things at once. Your opponent can save one; you take the other. Knights are the classic forking piece because they attack squares nothing else covers.

:::widget type="board" id="fork-demo"
prompt: |
  Look at the knight on e5. It attacks **both** the king on g6 and the queen on c6 — a *royal fork*. Black must move the king, and White takes the queen.

  Click the square of the piece White will capture next move.
rows: 8
cols: 8
pieces:
  - { at: e5, glyph: "♘" }
  - { at: g6, glyph: "♚" }
  - { at: c6, glyph: "♛" }
  - { at: e1, glyph: "♔" }
marks:
  - { at: e5, to: g6, kind: arrow, color: red }
  - { at: e5, to: c6, kind: arrow, color: red }
answer:
  kind: square
  accept: [c6]
hint: 'The knight is giving check. What does Black have to deal with first?'
explanation: 'Check comes first. Black must move the king, and no king move also protects the queen — so next move the knight takes on c6. A fork works because the opponent gets only one move to answer two threats.'
:::

## The knight's reach

A knight on a light square always lands on a dark square, and it attacks eight squares in an L-shape. Internalise the pattern — forks hide in it.

:::widget type="board" id="fork-reach"
prompt: Select **all** the squares this knight attacks, then press Check.
rows: 8
cols: 8
pieces:
  - { at: d4, glyph: "♘" }
answer:
  kind: squares
  accept: [b3, b5, c2, c6, e2, e6, f3, f5]
hint: Two up and one across, or one up and two across — in every direction. Eight squares.
explanation: 'Two squares in one direction and one to the side, in all eight combinations. Notice that d4 is a dark square and all eight targets are light — a knight always changes colour when it moves. From the centre it reaches eight squares; from a corner only two, which is why knights are strongest in the middle.'
:::

## Find the fork

:::widget type="board" id="fork-puzzle-1"
prompt: White to move. Find the knight fork that wins material.
rows: 8
cols: 8
pieces:
  - { at: b5, glyph: "♘" }
  - { at: g1, glyph: "♔" }
  - { at: a2, glyph: "♙" }
  - { at: b2, glyph: "♙" }
  - { at: e8, glyph: "♚" }
  - { at: a8, glyph: "♜" }
  - { at: b7, glyph: "♟" }
answer:
  kind: move
  accept: [b5c7, b5-c7]
hint: 'Look for a square from which the knight gives check *and* attacks something else at the same time.'
explanation: 'Nc7+ checks the king on e8 and attacks the rook on a8 in one move. Nothing can capture on c7, so the king must step away and Nxa8 wins the rook. Nd6+ is also a check, but the only other thing it hits is the pawn on b7.'
:::

:::widget type="multiple-choice" id="fork-which-pieces"
prompt: Which pieces can deliver a fork?
multiple: true
options:
  - text: Knight
    correct: true
  - text: Pawn
    correct: true
    explanation: A pawn attacking two pieces diagonally is one of the cheapest forks there is.
  - text: Queen
    correct: true
  - text: King
    correct: true
    explanation: Rare, but a king attacking two undefended pieces in the endgame is a real fork.
hint: 'A fork is one piece attacking two at once. Which of these can attack two squares at the same time?'
explanation: 'All four. A fork is not a special move; it is any single piece attacking two targets, so every piece can do it. Knights are famous for it because their L-shaped jump is hard to see coming. Pawns make the cheapest forks, and queens the most common. A king can fork two undefended pieces, mostly in the endgame.'
:::

:::widget type="board" id="fork-pawn"
prompt: Black to move. Play the pawn fork.
rows: 8
cols: 8
orientation: flipped
pieces:
  - { at: e5, glyph: "♟" }
  - { at: g8, glyph: "♚" }
  - { at: d3, glyph: "♘" }
  - { at: f3, glyph: "♖" }
  - { at: g1, glyph: "♔" }
answer:
  kind: move
  accept: [e5e4, e5-e4]
hint: 'A pawn captures diagonally forward. Where could this pawn step to so that it attacks two pieces at once?'
explanation: '…e4 attacks the knight on d3 and the rook on f3 at once, and neither can capture it — the knight does not reach e4, and the rook moves only in straight lines. White can save one piece; the other is lost to a pawn, which is the best trade a fork can offer.'
:::

:::checkpoint
You can see forks. Next: the pin, which is the same idea standing still.
:::
