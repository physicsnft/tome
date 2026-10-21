---
title: How Fast, and How Far
estimatedMinutes: 20
summary: Run a reaction, change the conditions, watch the numbers move.
---

# How Fast, and How Far

A balanced equation says *what* happens. It says nothing about **how fast**, or about how much is left when things stop changing. For that you need to watch a reaction run.

## A first-order reaction

Here is the simplest case: **A → B**, where the rate depends only on how much A is left. The more A there is, the faster it disappears — so the curve is steep at the start and flattens out.

Press Run, then move the rate constant while it plays.

:::widget type="simulation" id="first-order"
description: "Two curves over 24 seconds. The concentration of A falls steeply at first and then flattens towards zero; B rises as a mirror image, steeply then levelling off near 100."
prompt: |
  Concentration of A over time, for the reaction **A → B**.
state:
  A: 100
  B: 0
step:
  A: A - k * A * dt
  B: B + k * A * dt
dt: 0.05
params:
  - name: k
    label: Rate constant *k*
    min: 0.05
    max: 1
    step: 0.01
    value: 0.25
    unit: " /s"
stopWhen: "t > 24"
readouts:
  - { label: "[A]", expr: A, precision: 1 }
  - { label: "[B]", expr: B, precision: 1 }
  - { label: "Rate", expr: "k * A", precision: 2 }
trace:
  x: t
  y: [0, 100]
  series:
    - { expr: A, label: "[A]" }
    - { expr: B, label: "[B]" }
:::

:::widget type="multiple-choice" id="rate-shape"
prompt: Why does the curve for A flatten out rather than falling in a straight line?
options:
  - text: The reaction runs out of energy
    explanation: 'Reactions do not draw on a store of energy that empties. Watch the **Rate** readout instead, and compare it with [A].'
  - text: The rate depends on how much A is left, and less A means a slower rate
    correct: true
  - text: B starts turning back into A
    explanation: Not in this model — it only runs one way. We will add the reverse reaction below.
hint: 'Look at the **Rate** readout while it runs. Is it constant?'
explanation: 'The rate is *k* × [A]. Half as much A left means half the rate, so the curve gets shallower the lower it goes. A straight line would need a constant rate, and this rate falls every moment that A falls.'
:::

:::widget type="simulation" id="half-life"
description: "One falling curve. The concentration of A drops from 100, halving roughly every three seconds, and is close to zero by 20 seconds."
prompt: |
  Set *k* to **0.25** and run it. Watch **[A]** and note the time when it first drops below **50**. That time is the reaction's *half-life*.
state:
  A: 100
step:
  A: A - k * A * dt
dt: 0.05
params:
  - name: k
    label: Rate constant *k*
    min: 0.1
    max: 0.5
    step: 0.05
    value: 0.25
stopWhen: "t > 20"
readouts:
  - { label: "[A]", expr: A, precision: 1 }
  - { label: "Time", expr: t, precision: 1, unit: " s" }
trace:
  x: t
  y: [0, 100]
  series: [{ expr: A, label: "[A]" }]
answer:
  kind: numeric
  answer: 2.8
  tolerance: 0.6
hint: Run it and watch the readout — you are looking for the moment [A] passes 50.
explanation: 'About 2.8 s. For a first-order reaction the half-life is ln 2 / *k* = 0.693 / 0.25 ≈ 2.8 s. It contains no starting amount, so it takes 2.8 s to go from 100 to 50, and again from 50 to 25. Halve *k* and the half-life doubles.'
:::

## Temperature

Raising the temperature does not change what reacts — it changes how many collisions are hard enough to matter. That relationship is the Arrhenius equation, and it is steep: a rise of ten degrees often doubles the rate.

:::widget type="simulation" id="arrhenius"
description: "One falling curve whose steepness depends on the temperature slider. At 280 K it takes most of the 24 seconds to approach zero; at 340 K it is at zero within about a second."
prompt: |
  The same reaction, with *k* now set by temperature. Move the slider and run it again.
state:
  A: 100
step:
  A: A - (4340000 * exp(-40 / (0.008314 * T)) ) * A * dt
dt: 0.05
params:
  - name: T
    label: Temperature
    min: 280
    max: 360
    step: 5
    value: 300
    unit: " K"
stopWhen: "t > 24"
readouts:
  - { label: "[A]", expr: A, precision: 1 }
  - { label: "k at this T", expr: "4340000 * exp(-40 / (0.008314 * T))", precision: 3 }
trace:
  x: t
  y: [0, 100]
  series: [{ expr: A, label: "[A]" }]
:::

:::widget type="multiple-choice" id="arrhenius-q"
prompt: Run the model at 280 K and again at 340 K. What happens?
options:
  - text: The reaction ends at a different final concentration
    explanation: 'It still goes to completion — both runs end at zero. Only the time it takes to get there changes.'
  - text: The reaction reaches the same end point, but much sooner
    correct: true
  - text: Nothing changes
    explanation: 'Watch the **k at this T** readout as you move the slider. It changes a lot, and so does the curve.'
hint: 'Run both and compare where the curve ends, not just how fast it falls.'
explanation: 'Temperature changes the rate constant *k*, not where the reaction ends. At 340 K, many more collisions have enough energy to react, so *k* is about twenty times larger and A is used up in about a second instead of most of the run. Either way, A falls all the way to zero.'
:::

## Equilibrium

Now let the reaction run both ways: A becomes B at rate *k*₁, and B becomes A at rate *k*₂. Neither ever wins outright — the concentrations settle where the two rates cancel.

:::widget type="simulation" id="equilibrium"
description: "Sixty dots change colour from blue to orange as A becomes B, settling at about twenty blue and forty orange. The two curves cross and then run flat once the mixture stops changing."
prompt: |
  A ⇌ B. The dots below are 60 molecules: blue for A, orange for B. Watch the mixture settle, then move the sliders and see the balance shift.
state:
  A: 60
  B: 0
step:
  A: A - k1 * A * dt + k2 * B * dt
  B: B + k1 * A * dt - k2 * B * dt
dt: 0.05
params:
  - name: k1
    label: Forward rate *k*₁
    min: 0.05
    max: 1
    step: 0.05
    value: 0.4
  - name: k2
    label: Reverse rate *k*₂
    min: 0.05
    max: 1
    step: 0.05
    value: 0.2
stopWhen: "t > 40"
scene:
  viewBox: [0, 0, 120, 46]
  shapes:
    - kind: rect
      x: 2
      y: 2
      w: 116
      h: 42
      color: muted
      opacity: 0.08
    - kind: circle
      repeat: 60
      when: "i < round(A)"
      cx: "8 + (i % 15) * 7.4"
      cy: "8 + floor(i / 15) * 9.5"
      r: 2.6
      color: blue
    - kind: circle
      repeat: 60
      when: "i >= round(A)"
      cx: "8 + (i % 15) * 7.4"
      cy: "8 + floor(i / 15) * 9.5"
      r: 2.6
      color: orange
readouts:
  - { label: "A", expr: A, precision: 1 }
  - { label: "B", expr: B, precision: 1 }
  - { label: "B / A", expr: "B / max(A, 0.001)", precision: 2 }
trace:
  x: t
  y: [0, 60]
  series:
    - { expr: A, label: A }
    - { expr: B, label: B }
:::

:::widget type="simulation" id="equilibrium-ratio"
description: "A single readout, B divided by A, which climbs quickly and then settles at 2.0 and stops changing well before the run ends."
prompt: |
  With *k*₁ = 0.4 and *k*₂ = 0.2, run this to the end and read **B / A** once it stops changing.
state:
  A: 60
  B: 0
step:
  A: A - 0.4 * A * dt + 0.2 * B * dt
  B: B + 0.4 * A * dt - 0.2 * B * dt
dt: 0.05
stopWhen: "t > 40"
readouts:
  - { label: "B / A", expr: "B / max(A, 0.001)", precision: 2 }
answer:
  kind: numeric
  answer: 2
  tolerance: 0.15
hint: Let it run to the end — the ratio stops moving well before it stops.
explanation: "2.0 — exactly *k*₁ / *k*₂. At equilibrium the two rates are equal, so k₁·A = k₂·B, and the ratio B/A must be k₁/k₂. The individual molecules never stop swapping; the totals just stop changing."
:::

:::checkpoint
You can read a structure, find the reactive part, and predict how conditions change a reaction's speed and its end point.
:::
