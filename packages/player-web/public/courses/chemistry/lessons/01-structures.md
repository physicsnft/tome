---
title: Reading Structures
estimatedMinutes: 18
summary: What a skeletal drawing says, and what it leaves out.
---

# Reading Structures

Chemists rarely write every atom. In a **skeletal formula**, each corner and each line-end is a carbon, and the hydrogens on those carbons are left out entirely — you are expected to know that carbon makes four bonds and fill in the rest yourself.

Here is ethanol, the alcohol in every drink.

:::widget type="molecule" id="ethanol"
smiles: "CCO"
name: Ethanol
showFormula: true
:::

Two carbons, one oxygen — and six hydrogens that nobody drew. The formula underneath counts them for you.

:::widget type="multiple-choice" id="skeletal-why"
prompt: Why are hydrogens on carbon usually left out of a structural drawing?
options:
  - text: They are not really part of the molecule
    explanation: 'They are fully part of the molecule — in ethanol they are most of its atoms. They are left out because you can work them out, not because they are absent.'
  - text: Carbon always makes four bonds, so the number of hydrogens follows from the drawing
    correct: true
  - text: They are too small to draw
    explanation: 'Size is not the reason. Hydrogens on oxygen and nitrogen are routinely drawn, and those are just as small. What makes the ones on carbon safe to omit?'
hint: 'How many bonds does a carbon atom always make?'
explanation: 'Carbon makes four bonds. Count the lines already drawn at a carbon, and whatever is missing from four must be hydrogens — so drawing them adds clutter without adding any information.'
:::

## Rings

:::widget type="molecule" id="benzene"
smiles: "c1ccccc1"
name: Benzene
prompt: Six carbons in a ring, with the bonding electrons spread evenly around it. Click any **carbon** in the ring.
answer:
  kind: atom
  accept: [0, 1, 2, 3, 4, 5]
hint: 'Every corner of the hexagon is an atom. Pick any one.'
explanation: 'Each corner of the hexagon is a carbon — skeletal drawings do not label carbons, so an unlabelled corner always means C. Each one bonds to two ring neighbours and one hydrogen, with the ring''s shared electrons making up the rest of its four bonds.'
:::

## The same atoms, arranged differently

Butane and isobutane both have the formula C₄H₁₀. They are **isomers**: same atoms, different skeleton, different boiling point.

:::widget type="molecule" id="butane"
smiles: "CCCC"
name: Butane — a straight chain
showFormula: true
:::

:::widget type="molecule" id="isobutane"
smiles: "CC(C)C"
name: Isobutane — branched
showFormula: true
:::

:::widget type="multiple-choice" id="isomers-q"
prompt: What makes these two molecules different?
options:
  - text: They contain different numbers of atoms
    explanation: Both are C₄H₁₀ — count them in the formulas above.
  - text: The atoms are connected in a different order
    correct: true
  - text: One of them is a ring
    explanation: 'Neither one is a ring — both drawings have open ends. Look instead at which atom each carbon is bonded to.'
hint: 'Compare the formulas under the two drawings first, then look at which carbon each carbon is attached to.'
explanation: 'Same formula, C₄H₁₀, but in butane every carbon is in one chain, while in isobutane three carbons hang off a central one. Molecules with the same atoms in a different arrangement are *isomers*, and the arrangement alone is enough to change their boiling points.'
:::

:::checkpoint
You can read a skeletal drawing and spot an isomer. Next: the parts of a molecule that decide how it behaves.
:::
