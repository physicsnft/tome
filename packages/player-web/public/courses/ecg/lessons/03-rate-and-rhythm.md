---
title: Rate and Rhythm
estimatedMinutes: 19
summary: Two questions to ask of every strip, and five answers worth recognising.
---

# Rate and Rhythm

## Rate: divide 300 by the large squares

Count the large squares between two R waves and divide 300 by that number. It works because there are 300 large squares in a minute at 25 mm/s.

:::widget type="table-input" id="rate-table"
prompt: Fill in the rate for each R–R gap.
columns: ["Large squares between R waves", "Rate (per minute)"]
cells:
  - - "3"
    - { answer: 100 }
  - - "4"
    - { answer: 75 }
  - - "5"
    - { answer: 60 }
  - - "6"
    - { answer: 50 }
hint: 'There are 300 large squares in one minute (5 per second × 60). Divide 300 by the number of squares.'
explanation: 'There are 300 large squares in a minute, so the rate is 300 divided by the number of squares between R waves — 300 ÷ 3 = 100, 300 ÷ 4 = 75, and so on. The sequence for one to six squares is 300, 150, 100, 75, 60, 50, and most people simply learn it.'
:::

![A regular rhythm strip with a P wave before every QRS complex](assets/images/rhythm-normal.svg)

:::widget type="numeric-input" id="rate-normal"
prompt: The R waves in this strip are four large squares apart. What is the rate?
answer: 75
tolerance: 3
unit: " /min"
explanation: 300 ÷ 4 = 75/min. With a P before every QRS and a constant PR interval, this is normal sinus rhythm.
hint: 'Divide 300 by the number of large squares between R waves.'
:::

![A regular but slow rhythm strip](assets/images/rhythm-brady.svg)

:::widget type="numeric-input" id="rate-brady"
prompt: Here the R waves are about six and a half large squares apart. Rate, to the nearest five?
answer: 46
tolerance: 6
unit: " /min"
hint: 300 divided by six and a half.
explanation: '300 ÷ 6.5 ≈ 46/min (45 to the nearest five). Under 60 with a P before every QRS is sinus bradycardia. In an athlete asleep that is normal; in someone who has just fainted it is not.'
:::

## Rhythm: four questions

1. Is it **regular**?
2. Is there a **P wave before every QRS**?
3. Is the **PR interval constant**?
4. Is the **QRS narrow**?

Four yeses and a rate between 60 and 100 is normal sinus rhythm. Each *no* points somewhere specific.

![A strip with no visible P waves and R waves at visibly uneven intervals](assets/images/rhythm-af.svg)

:::widget type="multiple-choice" id="af-features"
prompt: Which two features of this strip stand out? Choose both.
multiple: true
options:
  - text: There are no P waves
    correct: true
  - text: The R–R intervals are uneven
    correct: true
  - text: The QRS complexes are wide
    explanation: They are narrow here — the ventricles are still being activated normally.
hint: 'Look for the small bump before each spike, and measure the gaps between spikes.'
explanation: 'The baseline before each QRS is a ragged line with no P waves. And no two R–R gaps are the same. Those two findings together are the signature of atrial fibrillation — the atria quiver instead of contracting, and the AV node lets impulses through at random.'
:::

:::widget type="multiple-choice" id="af-name"
prompt: No P waves, irregularly irregular R–R intervals, narrow QRS. What is it?
options:
  - text: Sinus tachycardia
    explanation: Sinus rhythm has a P wave before every QRS and is regular.
  - text: Atrial fibrillation
    correct: true
  - text: First-degree AV block
    explanation: 'In first-degree AV block every QRS still has a P wave in front of it and the rhythm is regular. Here there are no P waves.'
hint: 'Which rhythm has no organised atrial activity at all?'
explanation: 'The atria are quivering chaotically instead of contracting, so there are no P waves. The AV node passes impulses through at random, so the R–R intervals are *irregularly irregular*. The QRS is narrow because, once through the AV node, conduction to the ventricles is normal.'
:::

![A regular fast rhythm strip with a P wave before every QRS](assets/images/rhythm-tachy.svg)

:::widget type="multiple-choice" id="tachy-q"
prompt: This strip is regular, with a P before every QRS, at about 136/min. What is it?
options:
  - text: Sinus tachycardia
    correct: true
    explanation: A sinus rhythm above 100/min. It is usually a response to something else — pain, fever, blood loss, anxiety — so the question it raises is *why*.
  - text: Atrial fibrillation
    explanation: 'Atrial fibrillation is irregular and has no P waves. This strip is regular, with a P before every QRS.'
  - text: Normal sinus rhythm
    explanation: Normal is 60–100/min.
hint: 'Count the features — regular, P before every QRS — then check the rate against 60–100.'
:::

## Putting it together

:::widget type="table-input" id="summary-table"
prompt: Complete the summary. Write *yes* or *no* in the P wave column.
mode: choose
options: ["yes", "no"]
columns: ["Regular?", "P before every QRS?"]
rows: ["Normal sinus", "Sinus bradycardia", "Atrial fibrillation"]
cells:
  - - { answer: "yes" }
    - { answer: "yes" }
  - - { answer: "yes" }
    - { answer: "yes" }
  - - { answer: "no" }
    - { answer: "no" }
explanation: Bradycardia differs from normal sinus only in rate; atrial fibrillation differs in both regularity and P waves.
hint: 'Bradycardia changes only the rate. Atrial fibrillation changes the rhythm and the P waves.'
:::

:::widget type="free-text" id="systematic-approach"
prompt: |
  In your own words, write the order you will read a strip in from now on.
grading: self
modelAnswer: |
  Rate first, then rhythm — regular? P before every QRS? constant PR? narrow QRS? — then the intervals
  (PR, QRS, QT), then the ST segments. Same order every time, so nothing is skipped.
explanation: 'The order matters more than which order you choose. A fixed sequence means you never stop at the first abnormality you see, and a second, quieter finding — a long PR interval behind a dramatic rate — is not missed.'
:::

:::checkpoint
Rate, rhythm, intervals, ST segments — in that order, every time. That habit matters more than any single pattern you have learned here.
:::
