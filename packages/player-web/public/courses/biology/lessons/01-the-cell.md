---
title: Inside an Animal Cell
estimatedMinutes: 18
summary: Six parts worth knowing, and what each one does.
---

# Inside an Animal Cell

A cell is not a bag of soup. It has structures — **organelles** — each doing a particular job, in the same way the rooms of a house are not interchangeable.

:::figure credit="Diagram drawn for this course by Tome · CC BY-SA 4.0"
![A schematic animal cell with its organelles labelled](assets/images/animal-cell.svg)

The cell we will be working with throughout this lesson.
:::

Here is the diagram we will work with. Hover or tab through the regions to explore before you answer anything.

:::widget type="hotspot" id="cell-explore"
image: assets/images/animal-cell.svg
alt: A cross-section of an animal cell showing the nucleus with nucleolus, two mitochondria, the Golgi apparatus, endoplasmic reticulum studded with ribosomes, a vacuole and two lysosomes.
prompt: Click the **nucleus** — the large round structure that holds the cell's DNA.
outline: hover
showLabels: after
regions:
  - id: nucleus
    label: Nucleus
    description: Holds the DNA. The dark circle inside it is the nucleolus, where ribosomes are assembled.
    shape: circle
    at: [41, 47, 15]
  - id: mitochondrion
    label: Mitochondrion
    description: Releases energy from sugar. The folds inside increase the surface area where that happens.
    shape: circle
    at: [74, 33, 11]
  - id: golgi
    label: Golgi apparatus
    description: Packages proteins and ships them where they are needed.
    shape: rect
    at: [66, 67, 19, 12]
  - id: er
    label: Endoplasmic reticulum
    description: A folded network of membranes. The dots on it are ribosomes, where proteins are built.
    shape: polygon
    at: [36, 64, 50, 74, 62, 72, 70, 56, 66, 54, 56, 66, 44, 68, 37, 62]
  - id: vacuole
    label: Vacuole
    description: Stores water and waste. Small in animal cells; huge in plant cells.
    shape: circle
    at: [22, 33, 8]
  - id: lysosome
    label: Lysosome
    description: Contains enzymes that break down worn-out parts of the cell.
    shape: circle
    at: [59, 23, 5]
answer:
  kind: click
  accept: [nucleus]
hint: 'It is the biggest round shape, and it has a darker dot inside it.'
explanation: 'The nucleus is the large round body near the centre, wrapped in its own membrane. The dark dot inside it is the nucleolus — no other organelle has one, so that dot is the quickest way to confirm you have the right structure.'
:::

:::note title="Why the folds matter"
Several organelles are folded, stacked or branched. That is not decoration: folding packs a large surface into a small volume, and surface area is where chemistry happens.
:::

## Which one does the job?

:::widget type="hotspot" id="cell-energy"
image: assets/images/animal-cell.svg
alt: The same animal cell diagram.
prompt: Which organelle releases energy from sugar? Click it.
outline: hover
regions:
  - id: nucleus
    label: Nucleus
    shape: circle
    at: [41, 47, 15]
  - id: mitochondrion-right
    label: Mitochondrion
    shape: circle
    at: [74, 33, 11]
  - id: mitochondrion-left
    label: Mitochondrion
    shape: circle
    at: [31, 78, 9]
  - id: golgi
    label: Golgi apparatus
    shape: rect
    at: [66, 67, 19, 12]
answer:
  kind: click
  accept: [mitochondrion-right, mitochondrion-left]
hint: There are two of them in this cell, and either one is a correct answer.
explanation: 'Mitochondria break sugar down in a process called respiration, and the folds you can see inside them are where it happens — more folds, more surface, more energy. That is why a muscle cell can hold thousands of them while a skin cell has far fewer.'
:::

## Label the whole thing

:::widget type="hotspot" id="cell-label"
image: assets/images/animal-cell.svg
alt: The same animal cell diagram, to be labelled.
prompt: Put every label where it belongs. Tap a label, then tap the structure it names.
outline: always
showLabels: always
regions:
  - id: nucleus
    label: Nucleus
    shape: circle
    at: [41, 47, 15]
  - id: mitochondrion
    label: Mitochondrion
    shape: circle
    at: [74, 33, 11]
  - id: golgi
    label: Golgi apparatus
    shape: rect
    at: [66, 67, 19, 12]
  - id: vacuole
    label: Vacuole
    shape: circle
    at: [22, 33, 8]
answer:
  kind: label
explanation: 'Each of the four has a shape you can recognise without a label — the nucleus by its nucleolus, the mitochondrion by its folds, the Golgi as a stack of flattened sacs, the vacuole as a plain fluid-filled sac. Those shapes, not their positions, are what carry over to the next cell diagram you meet.'
hint: 'Start with the two you already know, the nucleus and the mitochondrion. The Golgi is the one that looks like a stack of flattened sacs.'
:::

:::widget type="matching" id="cell-jobs"
prompt: Match each organelle to its job.
pairs:
  - left: Nucleus
    right: Stores the DNA
  - left: Mitochondrion
    right: Releases energy from sugar
  - left: Ribosome
    right: Builds proteins
  - left: Lysosome
    right: Breaks down worn-out parts
hint: 'The ribosome is the one not on the earlier diagram — but you saw ribosomes as the dots on the endoplasmic reticulum.'
explanation: 'Each job follows from the structure. The nucleus holds the DNA, the instructions; ribosomes read a copy of those instructions and build the protein; mitochondria supply the energy all of that costs; lysosomes are bags of enzymes that digest what is worn out.'
:::

:::checkpoint
You can find your way around a cell. Next: a plant organ, in cross-section.
:::
