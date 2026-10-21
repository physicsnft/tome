---
title: Punnett Squares
estimatedMinutes: 17
summary: Predicting offspring, one grid at a time.
---

# Punnett Squares

Each parent gives one copy of a gene. A **Punnett square** is just a grid of every combination those copies can make — nothing more clever than that.

In pea plants, purple flowers (**P**) are dominant over white (**p**). A plant needs two copies of **p** to be white.

## One parent's alleles across the top, the other's down the side

:::widget type="table-input" id="punnett-heterozygous"
prompt: |
  Both parents are **Pp**. Fill in the four offspring combinations. Write the dominant allele first, like `Pp`.
caption: Pp × Pp
columns: ["P", "p"]
rows: ["P", "p"]
cells:
  - - { answer: "PP" }
    - { answer: "Pp" }
  - - { answer: "Pp", alternatives: ["pP"] }
    - { answer: "pp" }
hint: Each cell combines the letter above it with the letter to its left.
explanation: "Three of the four are purple (PP, Pp, Pp) and one is white (pp) — the classic 3 : 1 ratio."
:::

:::widget type="numeric-input" id="punnett-ratio"
prompt: Out of those four squares, how many give a **white** flower?
answer: 1
explanation: Only pp. Every square with at least one P is purple, because P is dominant.
hint: 'A flower is white only if it has no P at all.'
:::

## A cross with a known parent

:::widget type="table-input" id="punnett-test-cross"
prompt: |
  A purple plant of unknown type is crossed with a white one (**pp**). Suppose the purple parent is **Pp**. Fill in the grid.
caption: Pp × pp
columns: ["P", "p"]
rows: ["p", "p"]
cells:
  - - { answer: "Pp" }
    - { answer: "pp" }
  - - { answer: "Pp" }
    - { answer: "pp" }
explanation: "Half purple, half white. That 1 : 1 result is how breeders discover a purple plant is carrying a hidden p — it is called a test cross."
hint: 'The white parent can only give p, so every cell gets a p from the left. What differs is the letter from above.'
:::

:::widget type="multiple-choice" id="punnett-testcross-q"
prompt: If the unknown purple parent had been **PP** instead, what would the offspring have looked like?
options:
  - text: All purple
    correct: true
    explanation: Every offspring gets a P from that parent, so every one is purple.
  - text: Half purple, half white
    explanation: 'Half and half is what a **Pp** parent produces, as in the grid you just filled in. A PP parent has no p to pass on.'
  - text: All white
    explanation: 'For a white child, both alleles must be p. A PP parent cannot give a p at all, so no child can be white.'
hint: 'A PP parent has no p to give. What does every child receive from it?'
explanation: 'This is why the test cross works. A PP parent can only pass on P, so no child can be white — if even one white offspring appears, the purple parent must have been Pp.'
:::

## Blood groups: three alleles, four groups

Not every trait is two alleles. Human ABO blood group has three — **A** and **B** are co-dominant, **O** is recessive.

:::widget type="table-input" id="blood-groups"
prompt: One parent is **AO**, the other **BO**. Fill in each child's *genotype*, then choose the blood group it produces.
caption: AO × BO
columns: ["A", "O"]
rows: ["B", "O"]
cells:
  - - { answer: "AB" }
    - { answer: "BO", alternatives: ["OB"] }
  - - { answer: "AO", alternatives: ["OA"] }
    - { answer: "OO" }
hint: Combine the letters as before; order does not matter here.
explanation: Four children, four different blood groups — AB, B, A and O. Two parents can produce children whose blood groups match neither of them.
:::

:::widget type="table-input" id="blood-phenotypes"
prompt: Now the blood group each of those genotypes gives. Choose from the options.
mode: choose
options: ["A", "B", "AB", "O"]
columns: ["Genotype AB", "Genotype BO", "Genotype AO", "Genotype OO"]
cells:
  - - { answer: "AB" }
    - { answer: "B" }
    - { answer: "A" }
    - { answer: "O" }
explanation: O is recessive, so it only shows when both copies are O. A and B are co-dominant, so together they give AB rather than one masking the other.
hint: 'O only shows when it is the only allele present. A and B both show when both are present.'
:::

:::checkpoint
You can predict offspring from a cross, and read a ratio back from a grid. That is the working core of basic genetics.
:::
