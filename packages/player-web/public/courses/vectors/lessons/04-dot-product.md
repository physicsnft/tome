---
title: The Dot Product
estimatedMinutes: 15
---

# The Dot Product

So far we've added vectors and scaled them. Can we multiply two vectors? There are several answers; the most useful one gives back a *number*, not a vector. It's called the **dot product**:

$$\vec a \cdot \vec b = a_x b_x + a_y b_y$$

For $\vec a = (3, 1)$ and $\vec b = (1, 2)$: $\;3\cdot1 + 1\cdot2 = 5$.

## What does the number mean?

The dot product measures **how much two vectors point in the same direction**. The geometric form makes this visible:

$$\vec a \cdot \vec b = |\vec a|\,|\vec b|\cos\theta$$

where $\theta$ is the angle between them.

| Angle $\theta$ | $\cos\theta$ | Dot product |
|---|---|---|
| $0°$ (same direction) | $1$ | maximum, $\lvert\vec a\rvert\,\lvert\vec b\rvert$ |
| $90°$ (perpendicular) | $0$ | **zero** |
| $180°$ (opposite) | $-1$ | minimum, $-\lvert\vec a\rvert\,\lvert\vec b\rvert$ |

:::important
Two non-zero vectors are perpendicular **if and only if** their dot product is zero. This is the single most used fact about the dot product.
:::

:::widget type="slider-explore" id="explore-dot"
params:
  - {name: theta, min: 0, max: 180, step: 5, default: 60, label: Angle $\theta$}
geometry:
  view: {x: [-1.5, 1.5], y: [-0.5, 1.5]}
  shapes:
    - {kind: circle, center: [0, 0], radius: 1, color: muted}
    - {kind: vector, to: [1, 0], label: $\hat a$, color: blue}
    - {kind: vector, to: [cos(theta * pi / 180), sin(theta * pi / 180)], label: $\hat b$, color: green}
    - {kind: arc, center: [0, 0], radius: 0.3, from: 0, to: theta, label: $\theta$, color: orange}
    - {kind: segment, from: [cos(theta * pi / 180), sin(theta * pi / 180)], to: [cos(theta * pi / 180), 0], dashed: true, color: red}
    - {kind: segment, from: [0, 0], to: [cos(theta * pi / 180), 0], color: red}
outputs:
  - {label: $\theta$, expr: theta, precision: 0, suffix: "°"}
  - {label: $\hat a \cdot \hat b = \cos\theta$, expr: cos(theta * pi / 180), precision: 3}
caption: The red segment on the $x$-axis is the *projection* of $\hat b$ onto $\hat a$ — that length **is** the dot product of two unit vectors.
:::

:::details summary="Why are the two formulas equal?"
Apply the law of cosines to the triangle with sides $\vec a$, $\vec b$ and $\vec a - \vec b$:

$$|\vec a - \vec b|^2 = |\vec a|^2 + |\vec b|^2 - 2|\vec a||\vec b|\cos\theta$$

Expand the left side with components, and most terms cancel, leaving $a_x b_x + a_y b_y = |\vec a||\vec b|\cos\theta$.
:::

## Practice

:::widget type="numeric-input" id="q-dot-1"
prompt: Compute $(2, 3) \cdot (4, -1)$.
answer: 5
hint: $2 \cdot 4 + 3 \cdot (-1)$.
explanation: '$2 \cdot 4 + 3 \cdot (-1) = 8 - 3 = 5$. Multiply matching components and add. The result is a single number, not a vector. It is positive, so the angle between the two vectors is less than 90°.'
:::

:::widget type="multiple-choice" id="q-perp"
prompt: Which vector is perpendicular to $(2, 6)$?
options:
  - text: $(3, -1)$
    correct: true
    explanation: $2\cdot3 + 6\cdot(-1) = 0$.
  - text: $(6, 2)$
    explanation: $12 + 12 = 24 \ne 0$.
  - text: $(-2, -6)$
    explanation: That's the opposite direction, not perpendicular.
  - text: $(1, 3)$
    explanation: Same direction as $(2,6)$.
shuffle: true
hint: 'Perpendicular means the dot product is zero. Try each option.'
explanation: 'Two vectors are perpendicular exactly when their dot product is zero. $(2,6) \cdot (3,-1) = 6 - 6 = 0$. A quick way to find one: swap the components and negate one of them. $(2,6)$ gives $(6,-2)$, and $(3,-1)$ is that same direction, halved.'
:::

:::widget type="free-text" id="q-explain-zero"
prompt: 'In one or two sentences: why is the dot product of perpendicular vectors zero?'
grading: self
modelAnswer: 'Because $\cos 90° = 0$, and the dot product equals the product of the lengths times the cosine of the angle between the vectors. Equivalently: neither vector has any component in the direction of the other.'
explanation: 'Both answers in the model answer are the same idea. The geometric formula says it through the cosine; the projection picture says it through shadows. If one makes sense to you and the other does not yet, look at the explorer again at 90°, where the red projection shrinks to nothing.'
:::

## Review

:::widget type="flashcards" id="review-cards"
cards:
  - front: Length of $(v_x, v_y)$
    back: $\sqrt{v_x^2 + v_y^2}$
  - front: Unit vector of $\vec v$
    back: $\vec v / |\vec v|$
  - front: $\vec a \cdot \vec b$ (components)
    back: $a_x b_x + a_y b_y$
  - front: $\vec a \cdot \vec b$ (geometric)
    back: $|\vec a||\vec b|\cos\theta$
  - front: $\vec a \cdot \vec b = 0$ means…
    back: $\vec a \perp \vec b$ (or one of them is the zero vector)
spaced: true
:::

:::checkpoint
That's the core toolkit: coordinates, length, addition, scaling, and the dot product. With these you can describe forces, velocities, colours, and much more.
:::
