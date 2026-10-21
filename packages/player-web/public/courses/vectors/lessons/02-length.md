---
title: How Long Is a Vector?
estimatedMinutes: 12
---

# How Long Is a Vector?

Back to the directions: 3 blocks east, 4 blocks north. If you could walk straight through the buildings, how far would you travel?

The arrow, the eastward leg and the northward leg form a right triangle, so Pythagoras answers the question:

$$|\vec v| = \sqrt{v_x^2 + v_y^2} = \sqrt{3^2 + 4^2} = \sqrt{25} = 5$$

The length of a vector is called its **magnitude** or **norm**, written $|\vec v|$ or $\|\vec v\|$.

:::tip title="Why the square root?"
Squaring makes both components positive, so a vector pointing south-west is exactly as long as one pointing north-east. The square root undoes the squaring so the units come out right: blocks, not blocks².
:::

:::widget type="slider-explore" id="explore-length"
params:
  - {name: vx, min: -6, max: 6, step: 0.5, default: 3, label: $v_x$}
  - {name: vy, min: -6, max: 6, step: 0.5, default: 4, label: $v_y$}
geometry:
  view: {x: [-6, 6], y: [-6, 6]}
  shapes:
    - {kind: polygon, points: [[0, 0], [vx, 0], [vx, vy]], color: muted, fill: 0.15}
    - {kind: vector, to: [vx, vy], label: $\vec v$, color: primary}
    - {kind: segment, from: [0, 0], to: [vx, 0], label: $v_x$, color: orange}
    - {kind: segment, from: [vx, 0], to: [vx, vy], label: $v_y$, color: orange}
outputs:
  - {label: $v_x^2 + v_y^2$, expr: vx^2 + vy^2, precision: 2}
  - {label: $|\vec v|$, expr: sqrt(vx^2 + vy^2), precision: 3}
caption: The arrow is the hypotenuse of a right triangle. Try to find a vector with integer coordinates and integer length other than $(3,4)$.
:::

## Your turn

:::widget type="numeric-input" id="q-length-5-12"
prompt: What is the length of $\vec u = (5, 12)$?
answer: 13
tolerance: 0.001
hint: Compute $5^2 + 12^2$ first, then take the square root.
explanation: '$|\vec u| = \sqrt{5^2 + 12^2} = \sqrt{25 + 144} = \sqrt{169} = 13$. The vector is the hypotenuse of a right triangle with sides 5 and 12, and $(5, 12, 13)$ is one of the integer triples the explorer above asked you to look for.'
:::

:::widget type="numeric-input" id="q-length-neg"
prompt: What is the length of $\vec w = (-1, 1)$? Give at least two decimals.
answer: 1.41421356
tolerance: 0.01
hint: $(-1)^2 + 1^2 = 2$.
explanation: '$|\vec w| = \sqrt{(-1)^2 + 1^2} = \sqrt{2} \approx 1.414$. The minus sign disappears when you square it: a length can never be negative, because it is the same whichever way the arrow points.'
:::

## Unit vectors

A vector of length exactly 1 is a **unit vector**. You can turn any non-zero vector into a unit vector by dividing each component by its length:

$$\hat v = \frac{\vec v}{|\vec v|}$$

For $\vec v = (3,4)$ this gives $\hat v = (0.6,\; 0.8)$. Check: $0.6^2 + 0.8^2 = 0.36 + 0.64 = 1$. ✓

:::widget type="fill-blank" id="q-unit"
text: >-
  The unit vector in the direction of $(0, 7)$ is $({{=0}}, {{=1}})$.
  The unit vector in the direction of $(-2, 0)$ is $({{=-1}}, {{=0}})$.
  The unit vector in the direction of $(6, 8)$ is $({{=0.6~0.01}}, {{=0.8~0.01}})$.
hint: 'Divide each vector by its length. $(0,7)$ has length 7; $(6,8)$ has length 10.'
explanation: 'A unit vector is the vector divided by its length, so it keeps the direction and has length 1. $(0,7)/7 = (0,1)$, and $(-2,0)/2 = (-1,0)$ — the minus sign stays, because the direction does. $(6,8)$ has length $\sqrt{36 + 64} = 10$, so it becomes $(0.6, 0.8)$. Check: $0.6^2 + 0.8^2 = 1$.'
:::

:::checkpoint
:::
