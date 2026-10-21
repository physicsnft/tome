---
title: Adding and Scaling Vectors
estimatedMinutes: 12
---

# Adding and Scaling Vectors

## Addition: one trip after another

If you first walk $\vec a = (3, 1)$ and then $\vec b = (1, 2)$, where do you end up? Just add the components:

$$\vec a + \vec b = (3+1,\; 1+2) = (4, 3)$$

Geometrically, place the tail of $\vec b$ at the tip of $\vec a$. The sum is the arrow from the start to the final tip — the **tip-to-tail rule**.

Drag the tips of $\vec a$ and $\vec b$ below and watch the sum follow.

:::widget type="geometry" id="explore-add"
params:
  - {name: ax, min: -5, max: 5, step: 0.5, default: 3}
  - {name: ay, min: -5, max: 5, step: 0.5, default: 1}
  - {name: bx, min: -5, max: 5, step: 0.5, default: 1}
  - {name: by, min: -5, max: 5, step: 0.5, default: 2}
view: {x: [-6, 6], y: [-6, 6]}
shapes:
  - {kind: vector, to: [ax, ay], label: $\vec a$, color: blue}
  - {kind: vector, from: [ax, ay], to: [ax + bx, ay + by], label: $\vec b$, color: green}
  - {kind: vector, to: [ax + bx, ay + by], label: $\vec a + \vec b$, color: red}
  - {kind: vector, to: [bx, by], color: green, dashed: true}
  - {kind: vector, from: [bx, by], to: [ax + bx, ay + by], color: blue, dashed: true}
  - {kind: point, at: [ax, ay], bind: [ax, ay], color: blue}
  - {kind: point, at: [bx, by], bind: [bx, by], color: green}
caption: Solid arrows show $\vec a$ then $\vec b$; dashed arrows show $\vec b$ then $\vec a$. Both end at the same point.
:::

Order doesn't matter: $\vec a + \vec b = \vec b + \vec a$. Both paths end at the same corner of the parallelogram.

## Scaling: stretching and flipping

Multiplying a vector by a number (a **scalar**) multiplies every component:

$$2\vec a = (6, 2), \qquad -\tfrac12 \vec a = (-1.5,\; -0.5)$$

- A positive scalar stretches or shrinks the arrow.
- A negative scalar also flips it around.
- Scaling by $k$ multiplies the length by $|k|$.

:::widget type="slider-explore" id="explore-scale"
params:
  - {name: k, min: -3, max: 3, step: 0.25, default: 1, label: $k$}
geometry:
  view: {x: [-10, 10], y: [-4, 4]}
  shapes:
    - {kind: vector, to: [3, 1], label: $\vec a$, color: muted, dashed: true}
    - {kind: vector, to: [3 * k, 1 * k], label: $k\vec a$, color: primary}
outputs:
  - {label: $x$ component, expr: k * 3, precision: 2}
  - {label: $y$ component, expr: k * 1, precision: 2}
  - {label: Length, expr: abs(k) * sqrt(10), precision: 3}
caption: The dashed arrow is the original $\vec a = (3,1)$. Watch what happens as $k$ passes through zero.
:::

## Practice

:::widget type="multiple-choice" id="q-add"
prompt: What is $(2, -1) + (-2, 5)$?
options:
  - text: $(0, 4)$
    correct: true
  - text: $(4, 4)$
    explanation: Careful with the signs on the $x$ components.
  - text: $(0, -6)$
    explanation: $-1 + 5 = 4$, not $-6$.
  - text: $(-4, 6)$
    explanation: 'That is $(-2,5) - (2,-1)$ — one vector minus the other. Adding means adding the matching components: $x$ with $x$, $y$ with $y$.'
shuffle: true
hint: 'Add the $x$ parts together, then the $y$ parts together.'
explanation: 'Add component by component: $2 + (-2) = 0$ and $-1 + 5 = 4$, so $(0, 4)$. Geometrically: walk 2 right and 1 down, then 2 left and 5 up, and you end up 4 straight above where you started.'
:::

:::widget type="ordering" id="q-order-length"
prompt: Order these vectors from shortest to longest.
items:
  - $(1, 0)$
  - $(1, 1)$
  - $-2 \cdot (1, 0)$
  - $(0, 3) + (4, 0)$
hint: 'Work out each length. $-2 \cdot (1,0)$ is $(-2,0)$, and $(0,3) + (4,0)$ is $(4,3)$.'
explanation: 'Lengths: $|(1,0)| = 1$, $|(1,1)| = \sqrt2 \approx 1.41$, $|(-2,0)| = 2$ and $|(4,3)| = 5$. Two traps here. The minus sign does not make $-2 \cdot (1,0)$ shorter, because scaling by $-2$ doubles the length and reverses the direction. And $(1,1)$ is longer than $(1,0)$ but shorter than 2.'
:::

:::widget type="matching" id="q-match-ops"
prompt: Match each expression with its result.
pairs:
  - left: $(1,2) + (3,4)$
    right: $(4,6)$
  - left: $3 \cdot (1,2)$
    right: $(3,6)$
  - left: $(3,4) - (1,2)$
    right: $(2,2)$
  - left: $-1 \cdot (3,4)$
    right: $(-3,-4)$
hint: 'Every operation here works one component at a time.'
explanation: 'Each one works component by component. $(1+3,\ 2+4) = (4,6)$. $(3\cdot1,\ 3\cdot2) = (3,6)$. $(3-1,\ 4-2) = (2,2)$. $(-3, -4)$ is $(3,4)$ reversed. Multiplying by $-1$ keeps the length and flips the direction.'
:::

:::checkpoint
Addition and scaling are the two operations that make vectors a *vector space*. Everything in linear algebra builds on them.
:::
