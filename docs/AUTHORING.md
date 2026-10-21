# Writing a Tome Course

A course is a folder of Markdown files and images. There is no build step, no code, and nothing to configure. If you can write a blog post you can write a course; the rest of this guide is about the parts that are not like a blog post.

This is a tutorial: work through it in order and you will have a real, signed course in about an hour.

**Everything you need to write a course is in this document.** There are two others, and neither is aimed at you:

- **SPEC.md** — the reference. Look things up in §7.3 when you want the full list of options for a widget; you never need to read it end to end. It is written for people building players and tools, so it says MUST and MAY a lot.
- **schemas/** — machine-readable rules that `tome validate` runs for you. You should never need to open them. If a validator message and this guide disagree, that is a bug in one of them; please report it.

Every example below is extracted and validated by `tome check-docs` on each release, so if an example is here, it works.

---

## 1. Make a course

```
npx @tome-courses/cli new my-first-course
cd my-first-course
npx @tome-courses/cli validate .
npx @tome-courses/cli preview .
```

You need [Node](https://nodejs.org) 20 or newer, and nothing else. `npx` downloads the tool on first use and keeps it up to date, so you are always on the version this guide describes.

**The rest of this guide writes `tome` for short.** Either install it once —

```
npm install -g @tome-courses/cli
```

— or read every `tome …` below as `npx @tome-courses/cli …`.

<details>
<summary>Working from a checkout of the repository instead?</summary>

Until the package is published, build it once and the `tome` command exists inside the repo:

```
npm install
npm run build:cli
npx tome validate .          # works anywhere inside the checkout
```

To get `tome` on your PATH everywhere, link it once:

```
npm link -w @tome-courses/cli
tome validate .              # now works from any directory
```

`npm unlink -g @tome-courses/cli` undoes it.
</details>

`tome preview .` opens the player with your course in it at <http://127.0.0.1:4180/#/preview>. Leave it running: every time you save, the page reloads, and any error appears both in your terminal and at the foot of the page. This is the loop you will spend the next hour in — edit, save, glance at the browser.

You now have a course that validates. *Valid* means the files are well-formed and every reference resolves — not that the course teaches well or that every exercise grades as you meant. Those are checked by you, in §7. Open the two lessons and read them — they are short. `01-first-lesson.md` shows the three things every lesson is made of: prose, callouts and widgets. `02-images.md` shows an image, alt text, and a question whose options are images. Change them rather than starting from a blank file.

The important files:

```
manifest.json.in     what the course is: title, description, lesson order
lessons/*.md         one file per lesson
assets/images/       images, referenced as assets/images/…
assets/audio/        audio
```

`manifest.json.in` is your file — the only manifest you ever write or edit. `tome build` reads it and writes `manifest.json` into the bundle, adding a hash of every file. You will never see `manifest.json` in your own directory, and you should never create one: if a tool asks for it, you are pointed at the wrong directory or at a built bundle rather than a course.

**Run `tome validate .` constantly.** It is instant, and it catches far more than typos: broken links, missing assets, duplicate widget ids, an image you forgot to credit, a widget field that does not exist.

---

## 2. Write a lesson

A lesson is Markdown with front matter:

```md
---
title: What a Vector Is
estimatedMinutes: 12
summary: Arrows with a length and a direction.
---

# What a Vector Is

A **vector** is an arrow: it has a length and a direction, and nothing else.
Two arrows of the same length pointing the same way are the same vector,
even if they start in different places.

Maths is written with `$…$` inline, like $\vec v = (v_x, v_y)$, or on its own
lines with `$$`:

$$
|\vec v| = \sqrt{v_x^2 + v_y^2}
$$
```

`title`, `estimatedMinutes` and `summary` all appear in the table of contents. Write the summary as a promise about what the learner will be able to do.

### Callouts

```md
:::tip title="Rule of thumb"
Move your whole arm, not your fingers.
:::
```

Four kinds: `note`, `tip`, `warning`, `important`. Use them for asides. If the main thread of your lesson only makes sense when the callouts are read, they are not asides — put them back in the prose.

### Images

```md
![A red mug seen from slightly above](assets/images/ref-mug.png)
```

The alt text is not optional and the validator will tell you so. Write what a reader who cannot see the image needs to know, not "image of a mug".

For a caption, and for anything you did not make yourself:

```md
:::figure credit="Photograph by A. Photographer · CC BY-SA 4.0"
![Onion root tip cells under a microscope](assets/images/mitosis.jpg)

Cells caught at four stages of division.
:::
```

Either every asset in your course is your own work — say so once with `"assetsByAuthor": true` in the manifest — or each borrowed one needs a credit, inline like this or as a `credits` entry in the manifest. The validator will not let you publish an uncredited image, and a reviewer will check the claim before your course goes on sale.

**Size and format.** There is no limit on a course's total size, but every image is downloaded and kept on the learner's device, so make each one as small as it can be while still showing what it needs to:

| Image | Format | Size |
|---|---|---|
| Photographs | JPEG or WebP, quality about 80 | about 2000 px on the long side — usually 200–600 kB |
| Detail meant to be inspected — tablets, manuscripts, maps | JPEG or WebP | up to about 3000 px; learners can open any lesson image full-screen and zoom in |
| Line art, symbols, signs, diagrams | SVG | sharp at any size, usually a few kB |
| Screenshots | PNG | the size you see on screen |

Any image editor can export at these settings. From the command line, ImageMagick shrinks a photo only if it is larger than needed: `magick tablet.jpg -resize "2000x2000>" -quality 80 tablet-web.jpg`. Each image must stay under 10 MB and 8192 px per side — the validator rejects anything bigger and warns about anything over 2 MB. `tome validate` prints the course's total size and its largest files, so you can see what to shrink first.

**Dark mode needs nothing from you.** Learners can switch Tome to dark, but your images are never recoloured: in dark mode each one sits on a light sheet, so a transparent SVG with black lines reads exactly as you drew it. Draw for a white page, as you would for print.

### Teaching with images

For subjects learned by looking — scripts, specimens, artworks, anatomy, maps — the image is the content, not decoration. A few patterns:

- **Look closely.** Put the image in the lesson text. Learners can tap any lesson image to open it full-screen and zoom in, so a detailed photograph stays usable on a phone. Say in the text what to look *for*.
- **Tell similar things apart.** Put images in `multiple-choice` options — it is the most direct way to train discrimination between near-identical forms:

```md
:::widget type="multiple-choice" id="which-is-an"
prompt: Which of these is the sign AN?
options:
  - text: "![A star-shaped sign](assets/images/sign-an.svg)"
    correct: true
    explanation: AN began as a picture of a star, and keeps a star-like shape.
  - text: "![A single horizontal wedge](assets/images/sign-ash.svg)"
    explanation: A single horizontal wedge is the sign AŠ.
:::
```

- **Practise recognition.** `flashcards` take an image on either face: the sign on the front, its name, readings and meaning on the back.

### Decks that come back: spaced review

Recognising a sign, a word or an ECG pattern is learned by retrieving it again and again over days, not by reading it once. Add `spaced: true` to a deck and the player turns it into a review: the learner turns each card, says how well they knew it — *again*, *hard* or *good* — and the card comes back on a schedule, sooner if they struggled, later if they did not. A **Review** entry appears at the top of the course contents with the number of cards due, and the library shows it too.

```md
:::widget type="flashcards" id="signs-week-1"
spaced: true
cards:
  - front: "![A star-shaped sign](assets/images/sign-an.svg)"
    back: "**AN** — *sky*; also marks the names of gods"
  - front: "![A single horizontal wedge](assets/images/sign-ash.svg)"
    back: "**AŠ** — *one*"
:::
```

Three things to know as the author:

- **Review only brings back cards the learner has already met** in a lesson. You can put decks wherever they belong in the course; review never jumps ahead of your teaching.
- **The front of a card is its identity.** Fix a typo on the back whenever you like. Change the *front* and, for learners who already studied the deck, it becomes a new card and starts again — usually what you want, since it is a different question now.
- **Use it for things worth remembering for weeks** — vocabulary, signs, symbols, patterns. A deck that only supports one lesson is better left as a plain deck, which learners simply flip through.

Without `spaced`, a deck is browsed, as before. Add `shuffle: true` to show the cards in a new order on each visit.
- **Find it in context.** `hotspot` with `kind: click` asks the learner to find one thing in a larger image — a sign on a tablet, a city on a map. `kind: label` asks them to name every part. Both work by keyboard as well as touch.
- **Guide the eye, without testing.** Leave out `answer` and a `hotspot` becomes an annotated image: the marked areas are outlined, and tapping one shows its name on the image and your explanation below. Nothing is graded and nothing blocks the checkpoint. Use it before the questions — a guided tour of a tablet, a manuscript page or a map:

```md
:::widget type="hotspot" id="tablet-tour"
image: assets/images/tablet.svg
alt: 'A clay tablet with rows of wedge-shaped signs between ruled lines. The lower right corner is broken off.'
prompt: Tap each marked area to find out what it is. There is nothing to get wrong here.
regions:
  - id: first-line
    label: First line
    description: Text runs left to right, starting at the top.
    shape: rect
    at: [8, 12, 84, 15]
  - id: damage
    label: Damage
    description: A broken corner. Editors mark lost text with square brackets.
    shape: polygon
    at: [78, 93, 95, 68, 95, 92]
:::
```

  `tome regions <image>` lets you draw the areas instead of typing the coordinates.

**Alt text that does not give the answer away.** If the exercise is to recognise something, alt text that names it hands over the answer to anyone who can read it. Describe what is visible instead — *"a star-shaped sign"*, not *"the sign AN"*. Be honest with yourself that a pure recognition exercise is visual by nature: a learner who cannot see it gets the most from the questions about meaning, reading or context, so make sure the course has those too.

---

### Technical diagrams

Circuits, free-body diagrams, flowcharts, molecular sketches: a diagram can be a perfectly valid SVG and still be *wrong* — a resistor drawn a few pixels short of its wire, two lines that cross where they should join, a label attached to the wrong component. Nothing in `tome validate` can see this, because to a validator it is just a picture.

Before you publish one:

1. **Write down what it is meant to show**, in one sentence, before you look at it — *"a 9 V battery in series with a switch and two resistors."* Then check the drawing against the sentence, component by component and connection by connection.
2. **Zoom in.** Open the SVG on its own at 300–400 % and look at every point where a line meets a component. Gaps and overlaps that are invisible at lesson size are obvious up close.
3. **Make joins unambiguous.** Where wires connect, draw a dot; where they only cross, do not. This is the convention learners will meet everywhere else, and the one that fails silently when forgotten.
4. **Check it at learner size and on a narrow window** in `tome preview`. Labels that fit on a laptop collide on a phone.
5. **Use the sentence from step 1 as the alt text.** It is exactly what someone who cannot see the diagram needs, and writing it first means you checked the drawing against it rather than describing whatever you drew.

Draw on a grid and snap to it — every vector editor has the option, and most misaligned connections come from free-hand placement. Where a diagram can be *generated* from a description rather than drawn by hand (a plot from an expression, a molecule from SMILES), prefer the widget that generates it: it cannot be misaligned.

### Drawing diagrams in LaTeX

If you already write LaTeX, you can draw almost any technical diagram with it, convert it to SVG once, and use the SVG as an ordinary image. Code-drawn diagrams are precise in a way hand-drawn ones rarely are: a component sits exactly *on* its wire, an arrow starts exactly where you said, and changing a label is a one-word edit rather than redrawing.

| For | Use | Package |
|---|---|---|
| Circuits | components placed along wires, explicit junctions | `circuitikz` |
| Force and free-body diagrams, geometry, mechanisms | general drawing with arrows, angles, labels | `tikz` |
| Flowcharts, state machines, trees, graphs | positioned nodes and connectors | `tikz` (libraries `positioning`, `automata`), `forest` |
| Chemical structures | skeletal formulas | `chemfig` |

A circuit, as an example — every component is placed *between* two points, so it cannot end short of its wire:

```latex
\documentclass[border=4pt]{standalone}
\usepackage[american]{circuitikz}
\begin{document}
\begin{circuitikz}
  \draw (0,0) to[battery1, l=$5\,\mathrm{V}$] (0,3)
              to[switch, l=$S_1$]  (3,3)
              to[R, l=$300\,\Omega$] (6,3)
              to[led, l=$D_1$]     (6,0) -- (0,0);
\end{circuitikz}
\end{document}
```

Use the `standalone` document class, as above: it crops the output tightly to the drawing, with no page around it.

**Converting to SVG.** From a local TeX installation (TeX Live, MacTeX or MiKTeX all include what you need):

```
latex -interaction=nonstopmode diagram.tex
dvisvgm --no-fonts --exact-bbox diagram.dvi -o diagram.svg
```

If you write LaTeX in Overleaf, download the PDF and convert it instead — with `pdf2svg diagram.pdf diagram.svg`, or by opening the PDF in Inkscape and saving as *Plain SVG*.

Put the SVG in `assets/images/` and keep the `.tex` next to it (for example in `assets/src/`), so you or a reviewer can change it later without starting over. The player never runs LaTeX — it only ever sees the finished SVG.

**Three things to check every time:**

1. **Look at the rendered picture, not the code.** Precise is not the same as correct. In CircuiTikZ, polarity follows the direction you draw a path, so a voltage source drawn the "wrong" way round has its + at the wrong end — and still looks like a perfectly good schematic. A free-body diagram can have every arrow crisp and one of them starting from the wrong point. Check signs, arrow directions and where things attach, in the image.
2. **Follow your subject's conventions.** Code will draw whatever you describe. A free-body diagram shows the isolated body with every force starting at the centre of mass, and no floor; a circuit marks joins with a dot and leaves crossings bare. The tool will not know these rules for you.
3. **Write the alt text.** `--no-fonts` turns the letters in your diagram into shapes, so a screen reader cannot read a single label in it. The alt text is the only description a learner who cannot see the picture will get — use the one-sentence summary you wrote first (step 1 of *Technical diagrams*, above).

Prefer a Tome widget when one fits. A chart drawn from data is better as a `plot`, a molecule as a `molecule`, a draggable construction as `geometry` — they are interactive, adapt to the screen, and describe themselves to screen readers. LaTeX is for the static, technical drawing that no widget covers.

## 3. Add a widget

A widget is a `:::widget` block containing YAML:

```md
:::widget type="multiple-choice" id="dot-perpendicular"
prompt: What is $\vec a \cdot \vec b$ when the vectors are perpendicular?
options:
  - text: "0"
    correct: true
    explanation: Perpendicular vectors have no projection onto each other.
  - text: $|\vec a||\vec b|$
    explanation: That is the maximum, reached when they point the same way.
  - text: "1"
:::
```

Two rules to internalise now, because they cause most first-day errors:

**Every widget needs an `id`, unique in the whole course.** Learner progress is stored against `(course, widget id)`, so renaming an id in a published course loses that learner's answer. Choose ids you can live with: `dot-perpendicular`, not `q7`.

**Quote any YAML value containing a colon.** This is the single most common authoring mistake:

<!-- check-docs: skip -->
```md
:::widget type="numeric-input" id="broken"
prompt: Remember: the answer is a number
answer: 42
:::
```

That fails, because YAML reads `Remember:` as a key. Quote it:

```md
:::widget type="numeric-input" id="fixed"
prompt: "Remember: the answer is a number"
answer: 42
:::
```

The validator recognises this specific mistake and prints the corrected line ready to paste.

**Maths works everywhere in a widget** — prompts, options, hints and explanations — written exactly as in prose, between `$…$`. Without the dollars it is just text: `R_eq` shows as *R_eq*, while `$R_\mathrm{eq}$` shows as a proper subscript.

**If a value contains LaTeX, quote it with single quotes, never double.** Inside double quotes YAML treats every backslash as an escape: `\theta` silently becomes a tab followed by "heta", `\frac` a form feed followed by "rac", and `\mathrm` is rejected outright. Single quotes take everything literally:

```md
:::widget type="numeric-input" id="parallel-r"
prompt: 'A $6\,\Omega$ and a $3\,\Omega$ resistor in parallel: what is $R_\mathrm{eq}$, in ohms?'
answer: 2
explanation: '$\frac{1}{R_\mathrm{eq}} = \frac{1}{6} + \frac{1}{3} = \frac{1}{2}$, so $R_\mathrm{eq} = 2\,\Omega$.'
:::
```

The one thing to remember inside single quotes: a literal apostrophe is written twice — `'the circuit''s resistance'`. The validator catches LaTeX in double quotes and prints the single-quoted version for you.

### Choosing a widget

Start from what the learner should be able to *do*, not from the widget list. There are twenty-one types (SPEC.md §7.3); this table covers the learning goals they serve:

| The learner should be able to… | Use | Notes |
|---|---|---|
| Recognise the right answer among a few | `multiple-choice` | Options can be images — see *Teaching with images* |
| Recall a fact, term or sign from memory | `flashcards`, `fill-blank` | Flashcards for practice — with `spaced: true` they come back over days; `fill-blank` to test |
| Calculate a value | `numeric-input` | Set `tolerance` whenever rounding is involved |
| Complete a statement or formula | `fill-blank` | Numeric blanks are `{{=…}}` — see *How answers are matched* |
| Put steps, events or parts in order | `ordering` | Works by keyboard and touch, no dragging needed |
| Connect related items | `matching` | Term ↔ meaning, sign ↔ reading, cause ↔ effect |
| Find or name something on an image | `hotspot` | A tablet photo, a map, an anatomy plate; also labelling exercises |
| Fill in a grid | `table-input` | Conversions, Punnett squares, comparison tables |
| Explain, interpret or argue | `free-text` with `grading: self` | Learner compares their answer with your `modelAnswer` — right when more than one wording is defensible |
| Explore how something changes | `slider-explore`, `simulation`, `geometry`, `plot` | Not graded unless you add a question |
| Write and run code | `code-exercise` | |
| Subject-specific | `score`, `keyboard`, `molecule`, `sketch`, `board`, `dictation`, `record` | Music, chemistry, drawing, chess and go, languages |

**When not to use a widget.** A widget that tests something the lesson just stated in the previous sentence is a pause, not practice. If you cannot write a wrong answer that a real learner might pick, the question is probably too easy to be worth the space — say it in prose instead. And use `free-text` with self-grading rather than forcing an interpretation into `fill-blank`: exact matching punishes learners for good wording that you did not anticipate.

### How answers are matched

Passing `tome validate` proves a course is well-formed. It does not prove a widget grades the way you intend — a widget can be perfectly valid and still reject an answer a learner reasonably considers correct. This has a name in testing: **validation checks the shape, not the behaviour.** The two are different questions, and only you can answer the second one, because only you know what a learner is likely to type.

The five widgets above, in the form authors reach for most:

| Widget | Answer syntax | Alternatives | Matching |
|---|---|---|---|
| `multiple-choice` | `correct: true` on the right option(s) | as many options as you like | exact: the learner picks an option, not text |
| `numeric-input` | `answer: 42` | `tolerance` (absolute) or `relativeTolerance` | exact unless a tolerance is given — default tolerance is **0** |
| `fill-blank` | `{{answer}}` in `text` | `{{answer|alt1|alt2}}` | trimmed, case-insensitive by default; see below |
| `matching`, `ordering` | the `pairs`/`items` array, in the correct arrangement | — | **positional**: correct means matching your array order, not matching text content |

**`fill-blank` has two blank syntaxes**, and mixing them up is the single most common grading surprise:

```md
text: "A right angle measures {{90}} degrees. The Pythagorean triple starts {{=3}}, {{=4}}, {{=5}}."
```

- `{{90}}` is a **text** blank: compared as a trimmed, case-insensitive string against `90` and nothing else. A learner who types `90.0` is marked wrong.
- `{{=3}}` (leading `=`) is a **numeric** blank: parsed as a number, so `3`, `3.0` and `03` are all accepted. Add a tolerance with `{{=3~0.1}}`.

Pick the numeric form for anything measured or counted, even a single digit — it is one character of syntax and it removes a whole class of false negatives. Use the text form for words, and give alternatives explicitly rather than hoping for normalisation: `{{cat|cats}}` accepts both; `{{cat}}` alone does not become `{{cats}}` just because they mean the same thing to you.

**`matching` and `ordering` grade by position, not content.** A `matching` pair is correct when the learner connects the left item to the right item you paired it with in `pairs` — the widget never compares the two strings, so two visually identical right-hand items are not interchangeable answers, and rewording one side without checking the other silently changes nothing about grading. `ordering` is the same idea: the correct order is the order you wrote `items` in, full stop.

**Numeric answers are exact by default.** `numeric-input` and `table-input` cells both default to `tolerance: 0`. If the learner's calculation involves rounding, division, or a physical measurement, decide the tolerance deliberately — do not assume the player is lenient by default, because it is not.

### A worked example: `table-input`

Grids come up more often than you would expect — conversions, Punnett squares, payoff matrices, small data tables. A cell is either a **given** (a plain string, shown and not editable) or a **blank** the learner fills:

```md
:::widget type="table-input" id="unit-conversions"
prompt: Convert each speed. Round to one decimal place.
caption: Speeds in three units
columns: ["km/h", "m/s", "mph"]
rows: ["Walking", "Cycling"]
cells:
  - - "5"
    - { answer: 1.4, tolerance: 0.1 }
    - { answer: 3.1, tolerance: 0.1 }
  - - "20"
    - { answer: 5.6, tolerance: 0.1 }
    - { answer: 12.4, tolerance: 0.1 }
explanation: Divide by 3.6 for m/s; multiply by 0.621 for mph.
:::
```

`tolerance` matters whenever the learner rounds. A text cell instead of a number accepts `alternatives`, and `mode: choose` with `options` turns every blank into a dropdown — useful when the point is classification rather than recall. Grading is all-or-nothing, but each cell is marked individually and correct cells are never cleared, so a learner fixes one cell rather than retyping the grid.

### Checkpoints

```md
:::checkpoint
You can add and subtract vectors. Next: what multiplying one by a number does.
:::
```

A checkpoint blocks progress until every exercise above it is complete. Use one per section. A lesson with no checkpoint can be scrolled past without doing anything, which is sometimes what you want for a purely explanatory lesson.

---

## 4. Structure the course

`manifest.json.in` decides what exists and in what order:

```jsonc
{
  "formatVersion": "1.0.0-rc.9",           // the version tome new writes; see SPEC.md
  "id": "dev.example.vectors",
  "version": "0.1.0",
  "title": "Vectors, Visually",
  "subtitle": "Arrows, lengths and the dot product",
  "description": "You will be able to add vectors, find a length, and say what the dot product means geometrically.",
  "language": "en",
  "authors": [{ "name": "Your Name" }],
  "cover": "assets/images/cover.svg",
  "assetsByAuthor": true,
  "estimatedMinutes": 50,
  "structure": [
    { "id": "basics", "title": "The basics", "lessons": ["lessons/01-what-is-a-vector.md", "lessons/02-adding.md"] },
    { "id": "products", "title": "Products", "lessons": ["lessons/03-dot-product.md"] }
  ],
  "contentHashes": {}
}
```

A few fields deserve thought rather than filling in:

- **`id`** is permanent. It identifies the course for every learner who has it, across every version you ever publish. Reverse-DNS, lowercase, no dates.
- **`description`** is what someone reads before getting the course, and what the store's search looks through. Say what they will be able to *do*, not which topics are covered.
- **`tags`** — the **first tag is the course's subject**: the store shows it above the title and offers it as a filter, next to every other course's subject. Use a plain, common word (`chemistry`, not `chem` or `organic-chemistry-i`). Further tags are found by search. Leave out what other fields already say, such as `beginner`, which is `level`.
- **`version`** is semver for your content. Bump the patch for typos, the minor for new material. Keep lesson and widget ids stable and learners keep their progress across updates.
- **`changelog`** is one sentence for learners who already have the course: when the store has a newer version, their library shows *Update available* with this sentence.

---

## 5. Build, sign, open

```
tome build . --out dist
tome keygen ~/tome-key.json          # once — keep the private half offline
tome sign dist/*.course ~/tome-key.json
tome verify dist/*.course trusted-keys.json
```

`build` validates, hashes every file, and writes a `.course` bundle — a zip you can email. **Always use `tome build` rather than zipping the folder yourself**: a bundle needs `manifest.json` at its root, and zipping the folder puts everything one level down inside a wrapper directory. `sign` adds an Ed25519 signature over the manifest, which (because the manifest contains every file's hash) signs the whole bundle. A player will refuse a bundle whose contents no longer match its signature.

<!-- not-on-site -->
**Do you need to sign?** Not for the store: send an **unsigned bundle** — `tome build` output, no `sign` step — and the platform signs it after review.
<!-- /not-on-site -->

<!-- not-on-site -->
**Sharing a course yourself.** You do not need the store to give a course away — to a class, a club, a friend. Send the `.course` file however you like. Whoever opens it in Tome is told it comes from outside the store and asked whether to open it; it then sits in their library like any other course, marked *From an author · not reviewed by Tome*, with a reminder at the top of each lesson. Sign it first and that mark carries your key's fingerprint (`tome keygen` prints it, as in `d6e4 37ab 9817 ffb3`), which proves the file is unchanged since you signed it and lets people recognise courses from you. Tell them your fingerprint some other way — in person, on your website — because anyone can make a key; the fingerprint is what they compare. An unsigned file opens too, as an *unsigned draft*. Two things a shared course cannot do: use the `id` of a course that is in the store, and carry a store's signature. `tome verify` reports *an author's own course* for a bundle signed with your key, and *hash mismatch* means the file was altered after signing.
<!-- /not-on-site -->
<!-- site-only
**Sharing a course.** Send the `.course` file however you like — to a class, a club, a friend. Whoever opens it in Tome is asked whether to open a course from another author; it then sits in their library like any other course, marked *From an author*, with a reminder at the top of each lesson. Sign it first and that mark carries your key's fingerprint (`tome keygen` prints it, as in `d6e4 37ab 9817 ffb3`), which proves the file is unchanged since you signed it and lets people recognise courses from you. Tell them your fingerprint some other way — in person, on your website — because anyone can make a key; the fingerprint is what they compare. An unsigned file opens too, as an *unsigned draft*. A shared course cannot use the `id` of one of Tome's own courses, or carry Tome's signature. `tome verify` reports *an author's own course* for a bundle signed with your key, and *hash mismatch* means the file was altered after signing.
-->

`tome preview .` is how you read your course while writing it — see §1. It serves the player with your course loaded and reloads on save; nothing needs copying anywhere.

---

## 6. Things worth knowing before you write ten lessons

**Write the exercises first.** It is much easier to write prose that leads to a question than to bolt a question onto finished prose. Courses written the other way round tend to have three explanatory pages followed by one token quiz.

**Ask before you explain.** A question the learner cannot answer yet is not a test, it is a reason to read the next paragraph. `multiple-choice` with a wrong-but-tempting option and a good `explanation` teaches more than the paragraph would alone.

**Test the answer, not just the exercise.** A widget can validate successfully while rejecting the right answer or accepting the wrong one — see *How answers are matched* above. In `tome preview`, answer every graded widget exactly as a learner would before you move on: the intended answer, an obvious wrong one, and at least one plausible alternative phrasing or format. This catches more real problems than validation does, because validation cannot know what you meant.

**Keep lessons under about fifteen minutes.** `estimatedMinutes` is a promise. If a lesson runs long, it usually contains two lessons.

**Every graded widget can carry `explanation` and `hint`.** The explanation is where the actual teaching goes — most authors leave it empty and waste the moment the learner is most receptive. The hint shows after the first wrong attempt.

The learner sees a short verdict first — *Correct.* — with a **Why?** button beside it; the explanation opens beneath. So write it for the learner who *guessed*: say why this answer is right, not what the topic is. The same text appears again under a revealed solution (`solutionAfterAttempts`), so it must also make sense to someone who got it wrong three times.

In `multiple-choice`, give the tempting wrong options an `explanation` too. After a wrong answer, **Why?** shows the explanation of the option the learner picked — why *that* choice fails — without giving away the right one. Do not write "the answer is B" there; they can still try again.

**Describe your charts and models.** `plot`, `geometry` and `simulation` accept a `description`: one or two sentences saying what a learner should see. Without it a screen reader gets only axis ranges. Write the sentence you would say to someone who glanced away — *"velocity rises in a straight line from 2 to 12 m/s over five seconds"* — not a restatement of the axes. `tome validate` warns when a graded visual has none.

**Test on a narrow window.** Roughly half of reading happens on a phone. Wide tables, long code lines and side-by-side layouts are where it breaks.

**Nothing loads from the internet.** No embedded videos, no web fonts, no CDN scripts, no external images. Everything the learner sees ships in the bundle. This is what makes a course still work in ten years, and it is enforced, not encouraged.

**Accessibility is checked in places and trusted in others.** Alt text is required by the validator; a *useful* alt text is your judgement. Audio should carry a transcript. Anything that needs a mouse, a microphone or a steady hand must have a way past it — the widgets that need it have a Skip built in.

---

## 7. Test every exercise as a learner

`tome validate` and a clean `tome preview` prove a course is well-formed. Neither proves it grades the way you intend, or that it tests what you meant it to test. The only way to find out is to sit down and answer every graded widget as a learner would — and it is worth doing as its own pass, after the course otherwise works, not folded into writing.

For every graded widget:

1. **Check it is not the worked example in disguise.** If a lesson demonstrates a calculation and the exercise right after it asks for the same quantities, the learner can copy the demonstration instead of applying it. Change the numbers — and, where it makes sense, change which quantity is unknown — so the exercise asks for transfer, not recall. This is easy to miss because the exercise still looks correct: it validates, it renders, and the given answer is right; it just is not testing anything.
2. **Enter the answer you intend.** Confirm it is accepted — obvious, but the first thing to break when you edit a prompt without re-checking the answer underneath it.
3. **Enter an obviously wrong answer.** Confirm it is rejected, and that the feedback does not accidentally read as correct.
4. **Enter at least one plausible alternative.** A different capitalisation, a synonym, a different number format, an extra space. If it is something a real learner would reasonably type, decide on purpose whether to accept it — see *How answers are matched* in §3.
5. **Read the hint and the explanation as if you had just gotten it wrong.** A hint that gives away the answer outright is not a hint. An explanation that describes the topic in general but never says why *this* answer is the right one has not done its job.
6. **Do the numeric ones twice**, once with the exact value and once with a value a calculator would actually produce (more decimal places, a rounding difference) — this is where a missing `tolerance` shows up.

This matters more for Tome than for most course formats: a course is opened offline, by someone who owns it outright, with no teacher and no service on the other end to notice that a correct answer was marked wrong. Whatever you ship is what the learner is stuck with.


### Before you send it

A course is ready when every line of this is true — not just the first:

- [ ] `tome validate` shows no errors, and you have read every warning.
- [ ] You have read every lesson in `tome preview`, start to finish.
- [ ] Every graded widget has been answered as a learner: right, wrong, and a plausible alternative (the list above).
- [ ] You have read the course in a narrow window, the width of a phone.
- [ ] Every image has alt text that says what matters — and for recognition exercises, does not name the answer.
- [ ] Every image is your own work, or credited.
- [ ] `tome build` has produced the `.course` file.

<!-- not-on-site -->
Signing is not on the list: send the unsigned `.course`, and it is signed after review.
<!-- /not-on-site -->
<!-- site-only
Then sign it (§5) and send it.
-->

---

## 8. When something is wrong

`tome validate .` reports errors and warnings with a file and a line. The errors that confuse people most often:

| Message | What it usually means |
|---|---|
| `Nested mappings are not allowed…` | An unquoted YAML value containing a colon. The validator prints the fixed line. |
| `must NOT have unevaluated properties ('foo')` | A field name that does not exist for that widget type — check SPEC.md §7.3, or look for an unquoted comma in a flow value. |
| `Duplicate widget id` | Two widgets share an id. Ids must be unique across the whole course, not per lesson. |
| `LaTeX inside double quotes` | A value with `$\frac…$` or similar in `"…"`. Switch to single quotes — the validator prints the fixed line. |
| Maths shows as plain text, e.g. `R_eq` | The `$…$` delimiters are missing. |
| `Directive ':::note' has …` | A directive attribute that does not parse — usually a double quote inside a quoted title. Use ‘curly quotes’ inside: `title="Why ‘block’ is misleading"`. |
| `Asset … has no credit` | See §3.3: set `assetsByAuthor: true` or add a `credits` entry. |
| `missing asset` | A path typo, or an image you have not copied into `assets/` yet. |
| `… is not a course directory` | You are one level up (or down) from the folder holding `manifest.json.in`. The message lists what to try. |

A widget showing *"This exercise could not be displayed"* in the preview has a body the player could not render — usually one that is half-typed. The rest of the lesson keeps working, so you can carry on and fix it when you get there.

Warnings do not block a build, but they are worth reading: audio without a transcript, a lesson with no widgets, a missing `estimatedMinutes`.

None of the above is what to do when a course *validates* but a widget still grades wrong — that is not a technical error, so nothing above will catch it. §7 is the check for that; a few concrete symptoms:

| Symptom | Likely cause |
|---|---|
| A correct-looking answer is marked wrong | Check the exact syntax in *How answers are matched* (§3) — a `fill-blank` typed as `{{2}}` instead of `{{=2}}` is the most common case, and a numeric answer typed with different precision than `tolerance` allows is the second. |
| A `matching`/`ordering` widget seems to grade the wrong pair as correct | Remember matching is positional (§3): check the order of `pairs`/`items` in the source, not the text. |
| `tome validate` warns *"the answer and its given values also appear in the text just above"* | The exercise reuses the numbers of the worked example before it, so it can be answered by copying. Change the numbers — and ideally the unknown. If the repetition is deliberate, ignore the warning. |
| The hint gives the answer away | Reread it after writing the explanation — hints are drafted first and often say more than intended. |
| The explanation does not actually justify the answer | A common pattern is an explanation that restates the topic instead of saying why *this* option is right and the others are not; the wrong-option `explanation` fields (multiple-choice) are the more useful place to put the reasoning. |

---

## 9. Receiving a course from someone else

A `.course` file that arrives from an author is a signed bundle, not a folder. Three things to do with it, in order:

```
tome verify knots.course trusted-keys.json   # is it intact, and who signed it?
tome preview knots.course                    # read it, exactly as a learner would
tome unpack knots.course review-knots        # get an editable directory to review or fix
```

`verify` will say **unknown key** for an author whose public key you have not added to `trusted-keys.json` — that is expected, and it is the point: the signature proves the bundle has not changed since *they* built it, and trusting the key is a separate, deliberate decision. A **hash mismatch** is different and means the bundle was altered after signing; do not open it.

`unpack` writes `manifest.json.in` with the content hashes stripped, which is the form an author edits, so `tome validate` and `tome build` work on the result immediately.

<!-- not-on-site -->
A course **bought in the store** is different: it is a personal copy, and its manifest carries the order it was sold under (`issuedTo` — an order number and an opaque account id, never an email address). `tome verify` prints it. You can preview one, but `tome validate` refuses to treat an unpacked bought copy as a course source — the copy belongs to its buyer, and republishing it is exactly what that check is there to catch. Authors never write `issuedTo` themselves; the store adds it to each copy it sells.
<!-- /not-on-site -->

## 10. Reference and examples

- **SPEC.md** — every field of every widget, the manifest schema, and the rules a player must follow.
- **sample-courses.zip** — eight complete courses across maths, programming, Spanish, drawing, chess, music, biology and chemistry. They are the best documentation of what a finished course looks like; every widget type appears in at least one of them.
- `tome preview <dir|bundle.course>` — the player, with a course in it, reloading as you save.
- **Editor completion, optional.** Adding one line to the top of `manifest.json.in` makes VS Code and most other editors offer field completion and flag mistakes as you type:
  ```json
  "$schema": "https://…/schemas/manifest.schema.json",
  ```
  It is ignored by every tool that reads the file. This is a convenience, not a requirement, and it is the only reason an author would ever touch the schemas.
- `tome unpack <bundle.course> <dir>` — a received bundle, back into an editable directory.
- `tome atoms <smiles>` and `tome regions <image>` — helpers for the chemistry and diagram widgets, which are painful to write by hand.

The CLI's version tracks the format: `@tome-courses/cli@1.0.x` speaks format `1.0`. If a course must target a particular format version, install the matching CLI.

If something in this guide is unclear or wrong, that is a bug in the guide. Please say so — the guide is revised from where authors actually get stuck, not from where we expect them to.
