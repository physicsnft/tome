---
title: What Is a Vector?
estimatedMinutes: 10
summary: Vectors as arrows, written as coordinates, and why direction matters.
---

# What Is a Vector?

Imagine you're giving a friend directions: *"Walk 3 blocks east and 4 blocks north."* That instruction has two parts — **how far** and **which way**. Anything that carries both a size and a direction is a **vector**.

![An arrow from the origin to the point (3, 4)](assets/images/vector-3-4.svg)

We write a vector as a list of coordinates. The instruction above becomes

$$\vec v = (3,\; 4)$$

The first number says how far to go along the $x$-axis, the second along the $y$-axis.

:::note title="Notation"
You'll see vectors written as $\vec v$, $\mathbf{v}$, or just $v$. They all mean the same thing. We'll use the arrow.
:::

## Same arrow, different place

A vector only cares about length and direction, not where it starts. The arrow from $(0,0)$ to $(3,4)$ and the arrow from $(10,10)$ to $(13,14)$ are the **same vector**: both say "3 east, 4 north".

:::widget type="multiple-choice" id="q-same-vector"
prompt: Which of these arrows represents the same vector as the one from $(0,0)$ to $(2,1)$?
options:
  - text: From $(5,5)$ to $(7,6)$
    correct: true
    explanation: It moves 2 right and 1 up — same displacement.
  - text: From $(0,0)$ to $(1,2)$
    explanation: That's 1 right and 2 up — the coordinates are swapped.
  - text: From $(2,1)$ to $(0,0)$
    explanation: Same length, but it points the opposite way. That's $-\vec v$.
shuffle: true
hint: 'A vector is a displacement — how far right and how far up — not a position. Work out the displacement of each arrow.'
explanation: 'A vector is defined by how far it moves, not where it starts. From $(0,0)$ to $(2,1)$ is 2 right and 1 up. So is $(5,5)$ to $(7,6)$: $7-5 = 2$ and $6-5 = 1$. Same displacement, so same vector, just drawn somewhere else.'
:::

## Exploring coordinates

Drag the sliders and watch how the arrow changes. Notice how negative coordinates flip its direction.

:::widget type="slider-explore" id="explore-coords"
params:
  - {name: vx, min: -5, max: 5, step: 0.5, default: 3, label: $v_x$}
  - {name: vy, min: -5, max: 5, step: 0.5, default: 4, label: $v_y$}
geometry:
  view: {x: [-5, 5], y: [-5, 5]}
  shapes:
    - {kind: vector, to: [vx, vy], label: $\vec v$, color: primary}
    - {kind: segment, from: [0, 0], to: [vx, 0], dashed: true, color: orange}
    - {kind: segment, from: [vx, 0], to: [vx, vy], dashed: true, color: orange}
    - {kind: point, at: [vx, vy], label: "$(v_x, v_y)$", bind: [vx, vy]}
outputs:
  - {label: Angle from the $x$-axis, expr: "atan2(vy, vx) * 180 / pi", precision: 0, suffix: "°"}
caption: Drag the sliders — or the tip of the arrow — and watch how the arrow changes. Negative coordinates flip its direction.
:::

:::checkpoint
You know what a vector is. Next: how long is it?
:::
