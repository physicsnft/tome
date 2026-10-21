---
title: Reading a Leaf
estimatedMinutes: 15
summary: A cross-section, layer by layer, and why each layer is shaped the way it is.
---

# Reading a Leaf

Slice a leaf and look at the cut face. Every layer you see is a solution to a problem: catch light, let carbon dioxide in, keep water from escaping.

All of it serves one reaction:

$$
\ce{6CO2 + 6H2O ->[light] C6H12O6 + 6O2}
$$

Carbon dioxide comes in through the underside, water arrives through the veins, and light drives the whole thing.

:::widget type="hotspot" id="leaf-palisade"
image: assets/images/leaf-cross-section.png
alt: A leaf in cross-section showing, from top to bottom, the upper epidermis, a layer of tall column-shaped palisade cells, a loosely packed spongy layer with air gaps, a vascular bundle, and the lower epidermis containing a stoma between two guard cells.
prompt: |
  Most photosynthesis happens in the tall, tightly packed cells near the top. Click that layer.
outline: hover
regions:
  - id: upper-epidermis
    label: Upper epidermis
    description: A transparent skin. It lets light through and holds water in.
    shape: rect
    at: [7, 11, 86, 12]
  - id: palisade
    label: Palisade layer
    description: Column-shaped cells packed with chloroplasts, standing on end so light passes through several of them.
    shape: rect
    at: [7, 23, 86, 25]
  - id: spongy
    label: Spongy layer
    description: Loosely packed cells with air spaces between them, so gases can move to every cell.
    shape: rect
    at: [7, 48, 86, 29]
  - id: vein
    label: Vascular bundle
    description: Xylem brings water up; phloem carries sugar away.
    shape: circle
    at: [78, 63, 9]
  - id: stoma
    label: Stoma and guard cells
    description: A pore that opens to let carbon dioxide in — and closes when the plant is losing too much water.
    shape: rect
    at: [40, 76, 16, 13]
answer:
  kind: click
  accept: [palisade]
explanation: The palisade layer. Standing the cells on end means light passes through several chloroplast-packed cells before it escapes.
hint: 'The cells you want stand upright like columns, just under the top surface.'
:::

:::widget type="hotspot" id="leaf-gas"
image: assets/images/leaf-cross-section.png
alt: The same leaf cross-section.
prompt: Carbon dioxide enters the leaf through a pore on the underside. Click that pore.
outline: never
regions:
  - id: stoma
    label: Stoma
    shape: rect
    at: [40, 76, 16, 13]
  - id: vein
    label: Vascular bundle
    shape: circle
    at: [78, 63, 9]
  - id: palisade
    label: Palisade layer
    shape: rect
    at: [7, 23, 86, 25]
answer:
  kind: click
  accept: [stoma]
hint: Look along the bottom edge, between two bean-shaped cells.
explanation: The stoma. The two guard cells beside it change shape to open and close the gap — the plant's compromise between feeding and drying out.
:::

:::widget type="ordering" id="leaf-light-path"
prompt: Put these in the order light meets them as it enters a leaf from above.
items:
  - Upper epidermis
  - Palisade layer
  - Spongy layer
  - Lower epidermis
hint: 'The epidermis is a skin, so there is one on each face. Which layer is just beneath the top skin?'
explanation: 'Light enters through the transparent upper epidermis and meets the palisade layer first. That is exactly why the chloroplast-packed cells are there — they get the light before anything else. Whatever is left passes through the spongy layer and out through the lower epidermis.'
:::

:::widget type="multiple-choice" id="leaf-why-gaps"
prompt: Why is the spongy layer full of air spaces?
options:
  - text: To make the leaf lighter so it does not fall off
    explanation: 'Weight is not the problem the air spaces solve. Ask what the cells around them need from the air.'
  - text: So carbon dioxide can reach every cell, and oxygen can leave
    correct: true
  - text: To store water for dry weather
    explanation: 'Water travels through the leaf in the xylem of the vascular bundle, not in the air spaces — and a leaf with stored water in its gaps could not exchange gas through them.'
hint: 'Think about what photosynthesis takes in from the air, and what it gives off.'
explanation: 'Photosynthesis needs carbon dioxide and gives off oxygen. The air spaces are a network that connects the stomata on the underside to every cell, so each one can take in gas directly instead of waiting for it to diffuse through its neighbours.'
:::

:::widget type="fill-blank" id="leaf-equation"
prompt: Complete the balancing coefficients for photosynthesis.
text: "{{6}} CO₂ + {{6}} H₂O → C₆H₁₂O₆ + {{6}} O₂"
hint: 'Count the carbon atoms in glucose, C₆H₁₂O₆. Every one of them came from a CO₂.'
explanation: 'Glucose has six carbons, and each CO₂ brings one, so six CO₂. Glucose has twelve hydrogens and each H₂O brings two, so six H₂O. Then count oxygen: 6 × 2 + 6 × 1 = 18 atoms go in, glucose keeps 6, and the remaining 12 leave as six O₂.'
:::

:::checkpoint
You can read a cross-section and say why each layer looks the way it does.
:::
