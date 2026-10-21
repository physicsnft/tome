---
title: Functional Groups
estimatedMinutes: 17
summary: The handful of arrangements that do most of the chemistry.
---

# Functional Groups

Most of a large molecule is inert scaffolding. The reactions happen at a **functional group** — a small, recognisable arrangement of atoms that behaves the same way wherever it appears.

## The hydroxyl group, —OH

:::widget type="molecule" id="propanol-oh"
smiles: "CCCO"
name: Propan-1-ol
prompt: Click the **oxygen** — the hydroxyl group is the reason this is an alcohol rather than a gas.
answer:
  kind: atom
  accept: [3]
hint: It is the atom at one end that is not carbon.
explanation: 'The oxygen, together with its hydrogen, is the hydroxyl group (–OH). Oxygen pulls electrons towards itself, so the –OH can form hydrogen bonds with water and with other alcohol molecules. That is why propanol is a liquid that mixes with water, while propane, the same chain without it, is a gas.'
:::

## The carboxyl group, —COOH

Acetic acid is what makes vinegar sour. The group on the right — a carbon with a double-bonded oxygen *and* a hydroxyl — is a carboxyl, and it is what makes the molecule an acid.

:::widget type="molecule" id="acetic-acid"
smiles: "CC(=O)O"
name: Acetic acid
highlight: [1, 2, 3]
showFormula: true
:::

:::widget type="molecule" id="acetic-acid-q"
smiles: "CC(=O)O"
prompt: Select **both oxygens** in acetic acid, then press Check.
answer:
  kind: atoms
  accept: [2, 3]
hint: 'There are two atoms that are not carbon. Select both of them before pressing Check.'
explanation: 'One oxygen is double-bonded to the carbon (C=O); the other carries the hydrogen (–OH). Together they are the carboxyl group, –COOH. The C=O pulls electrons away from the –OH, which makes that hydrogen easy to lose as H⁺ — and that is what makes the molecule an acid.'
:::

:::widget type="molecule" id="name-the-group"
smiles: "CCC(=O)O"
name: Propanoic acid
prompt: What is the name of the group at the right-hand end of this molecule?
answer:
  kind: text
  accept: ["carboxyl", "carboxyl group", "carboxylic acid", "cooh"]
hint: It is what every organic acid has in common.
explanation: 'A carbon with a double-bonded oxygen and an –OH on the same atom is a **carboxyl** group, –COOH. It is the same group you selected in acetic acid; propanoic acid just has one more carbon in its chain. The group, not the chain length, decides how the molecule behaves.'
:::

## A molecule you have met

:::widget type="molecule" id="aspirin"
smiles: "CC(=O)Oc1ccccc1C(=O)O"
name: Aspirin
showFormula: true
prompt: A benzene ring, an ester on one side, a carboxylic acid on the other. Click any atom to explore; there is nothing to get wrong here.
:::

:::widget type="matching" id="groups-match"
prompt: Match each group to what it makes the molecule.
pairs:
  - left: "—OH"
    right: An alcohol
  - left: "—COOH"
    right: A carboxylic acid
  - left: "—NH₂"
    right: An amine
  - left: "C=C"
    right: An alkene
hint: 'Two of these were in this lesson already. For the others, -amine and -ene are in the names.'
explanation: 'The group decides the family, whatever the chain is attached to. –OH makes an alcohol (ethanol, propanol); –COOH makes a carboxylic acid (acetic, propanoic); –NH₂, built on nitrogen, makes an amine; and a C=C double bond makes an alkene, the -ene ending.'
:::

## Reactions, written as equations

:::widget type="molecule" id="esterification"
reaction: "CC(=O)O.CCO>>CC(=O)OCC.O"
name: Acetic acid + ethanol → ethyl acetate + water
prompt: An acid and an alcohol join, losing a molecule of water between them. This is esterification, and it is how many fruit smells are made.
:::

:::checkpoint
You can pick out the reactive part of a molecule. Now: how fast does any of this actually happen?
:::
