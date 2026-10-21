---
title: Measuring the Intervals
estimatedMinutes: 18
summary: PR, QRS and QT — what to count and what the numbers mean.
---

# Measuring the Intervals

Three measurements carry most of the diagnostic weight. All three are made the same way: find the start, find the end, count small squares, multiply by 0.04.

| Interval | From → to | Normal |
|---|---|---|
| PR | start of P → start of QRS | 0.12–0.20 s (3–5 small squares) |
| QRS | start → end of QRS | under 0.12 s |
| QT | start of QRS → end of T | under about 0.44 s, and it shortens as the heart speeds up |

:::widget type="table-input" id="intervals-convert"
prompt: Convert each count of small squares into seconds.
columns: ["Small squares", "Seconds"]
rows: ["PR", "QRS", "QT"]
cells:
  - - "4"
    - { answer: 0.16, tolerance: 0.001 }
  - - "2"
    - { answer: 0.08, tolerance: 0.001 }
  - - "10"
    - { answer: 0.4, tolerance: 0.001 }
hint: Each small square is 0.04 s.
explanation: '4 × 0.04 = 0.16 s, 2 × 0.04 = 0.08 s and 10 × 0.04 = 0.40 s. All three are normal (PR 0.12–0.20 s, QRS under 0.12 s, and a QT around 0.40 s at a normal rate). Multiplying by 0.04 is the whole arithmetic of ECG measurement.'
:::

## A long PR interval

Here the P waves are present and regular, and every one is followed by a QRS — but the gap between them is stretched.

![A rhythm strip in which each P wave is followed by a QRS complex after an unusually long pause](assets/images/block-first-degree.svg)

:::widget type="multiple-choice" id="first-degree"
prompt: The PR interval here measures about 0.30 s and is the same on every beat. What is this?
options:
  - text: Normal sinus rhythm
    explanation: The rhythm *is* sinus — a P before every QRS — but the PR interval is beyond 0.20 s.
  - text: First-degree AV block
    correct: true
  - text: Atrial fibrillation
    explanation: 'In atrial fibrillation there are no P waves at all, and this strip has a P before every QRS.'
hint: 'Every P is followed by a QRS, so the rhythm itself is sinus. What is the upper limit of a normal PR interval?'
explanation: 'The normal PR interval is 0.12–0.20 s. Here it is 0.30 s but the same on every beat, and every P is still followed by a QRS. The impulse is delayed at the AV node, but nothing is blocked outright — that is first-degree AV block. It is usually harmless, but worth noting.'
:::

:::note title="Why ‘block’ is a misleading word"
In first-degree block nothing is actually blocked: every impulse gets through, just slowly. It is often a normal finding in a fit young person, and on its own it is rarely the interesting part of an ECG.
:::

## The ST segment

The ST segment should sit level with the baseline — specifically, level with the flat stretch between the T wave and the next P.

![A rhythm strip in which the flat segment after each QRS complex sits clearly above the baseline](assets/images/st-elevation.svg)

:::widget type="multiple-choice" id="st-elevation-q"
prompt: The ST segments in this strip are raised about 3 mm above the baseline. What does that height represent?
options:
  - text: 0.3 mV
    correct: true
    explanation: 10 mm = 1 mV, so 3 mm = 0.3 mV. In the right clinical context this is the finding that activates a cath lab.
  - text: 0.3 s
    explanation: Height is voltage; width is time.
  - text: 3 mV
    explanation: '3 mV would be thirty small squares — taller than most QRS complexes. Check how many millimetres make one millivolt.'
hint: 'On the vertical axis, ten small squares are one millivolt.'
:::

:::widget type="numeric-input" id="st-mv"
prompt: If a different strip showed 2 mm of ST elevation, how many millivolts is that?
answer: 0.2
tolerance: 0.001
unit: " mV"
hint: '10 mm = 1 mV, so one small square is 0.1 mV.'
explanation: '2 × 0.1 = 0.2 mV. Thresholds for calling ST elevation differ by lead, by sex and by age — which is exactly the kind of detail a course like this should send you to a protocol for, not memorise from one page.'
:::

:::checkpoint
You can measure the three intervals and read a height in millivolts. Next: rate and rhythm.
:::
