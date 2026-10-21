---
title: One Complex, Five Parts
estimatedMinutes: 18
summary: What each bump is, and what the paper underneath it means.
---

# One Complex, Five Parts

:::important title="What this course is, and is not"
This is educational material for learning to read a trace. It is not a clinical decision aid, and no course can substitute for supervised practice or local protocol. Every strip here is **computer-generated for teaching** — none is a recording of a patient.
:::

One heartbeat draws the same five-part shape every time. Learn the shape once and the rest of ECG reading is comparing what you see against it.

- **P wave** — the atria depolarising. Small, rounded, before every QRS.
- **PR interval** — from the start of P to the start of QRS: the delay at the AV node.
- **QRS complex** — the ventricles depolarising. Tall and narrow.
- **ST segment** — the flat stretch after QRS, normally level with the baseline.
- **T wave** — the ventricles repolarising. Broader and lower than the QRS.

:::widget type="hotspot" id="complex-p"
image: assets/images/complex-normal.svg
alt: A single normal PQRST complex on ECG paper. A small rounded P wave, then a tall narrow QRS complex, then a broader T wave, drawn on a grid of 1 mm squares.
prompt: Click the **P wave**.
outline: hover
regions:
  - id: p-wave
    label: P wave
    description: Atrial depolarisation. Small, rounded, and before every QRS in a sinus rhythm.
    shape: circle
    at: [20.7, 58.9, 7]
  - id: qrs
    label: QRS complex
    description: Ventricular depolarisation. Normally under 0.12 s wide — three small squares.
    shape: circle
    at: [31.4, 21.4, 7]
  - id: t-wave
    label: T wave
    description: Ventricular repolarisation. Broader and lower than the QRS, and normally the same way up.
    shape: circle
    at: [46.1, 51.8, 7]
answer:
  kind: click
  accept: [p-wave]
hint: It comes first, and it is the smallest of the three.
explanation: 'The P wave is the small rounded bump just before the tall spike. It is small because the atria have little muscle compared with the ventricles. It comes first because the beat starts in the sinus node, in the right atrium. A P before every QRS, with a constant PR interval, is what makes a rhythm *sinus*.'
:::

:::widget type="hotspot" id="complex-label"
image: assets/images/complex-normal.svg
alt: The same single complex, to be labelled.
prompt: Now label all three waves. Tap a label, then tap the wave it names.
outline: always
showLabels: always
regions:
  - id: p-wave
    label: P
    shape: circle
    at: [20.7, 58.9, 7]
  - id: qrs
    label: QRS
    shape: circle
    at: [31.4, 21.4, 7]
  - id: t-wave
    label: T
    shape: circle
    at: [46.1, 51.8, 7]
answer:
  kind: label
hint: 'The order follows the beat. The atria contract first, then the ventricles, then the ventricles recover.'
explanation: 'P, QRS, T — in that order, on every beat. Each wave is a step of the same event: the atria depolarise (P), the ventricles depolarise (QRS), the ventricles repolarise (T). Atrial repolarisation also happens, but it is hidden inside the QRS.'
:::

## The paper is a ruler

ECG paper runs at **25 mm per second**, so distance across the page is time:

- one **small square** (1 mm) = **0.04 s**
- one **large square** (5 mm) = **0.20 s**

Vertically, **10 mm = 1 mV**, so height is voltage. Every measurement you will ever make on an ECG comes from counting squares.

:::widget type="numeric-input" id="paper-large-square"
prompt: How many seconds does one large square represent?
answer: 0.2
tolerance: 0.001
unit: " s"
hint: 'At the standard paper speed of 25 mm/s, one small square (1 mm) is 0.04 s, and a large square is five small ones.'
explanation: '0.20 s. At 25 mm/s each 1 mm small square is 1 ÷ 25 = 0.04 s, and a large square is five of them, 5 × 0.04 = 0.20 s. So five large squares make one second — the basis of every rate calculation that follows.'
:::

:::widget type="numeric-input" id="paper-small-squares"
prompt: A QRS complex is three small squares wide. How many seconds is that?
answer: 0.12
tolerance: 0.001
unit: " s"
hint: One small square is 0.04 s.
explanation: '3 × 0.04 = 0.12 s — exactly the upper limit of normal. A QRS wider than three small squares means the ventricles are not being activated through the fast normal conducting system, so the impulse is spreading slowly through muscle instead.'
:::

:::checkpoint
You can name the waves and read the paper. Next: measuring the intervals between them.
:::
