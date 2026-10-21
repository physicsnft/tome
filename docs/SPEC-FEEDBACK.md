# Spec feedback from the first two sample courses

Findings while authoring *Vectors, Visually* (math) and *Python: First Steps* (coding). Round 1 was against spec 0.1.1 and drove the 0.2.0 changes; round 2 lists what came up while re-authoring the courses against 0.2.0.

## Round 1 — resolved in 0.2.0

| # | Finding | Resolution |
|---|---|---|
| 1 | No 2-D vector/geometry widget; the math course's central visual had to be faked | New `geometry` widget (standalone, or nested in `slider-explore`) with points, vectors, segments, lines, circles, polygons, arcs, text; expression-driven coordinates; draggable points via `bind` |
| 2 | Whole-program coding exercises couldn't be tested; tests had no access to stdout | Output grading now takes multiple `cases` (stdin + expected output, hidden allowed); tests can read `__stdout__` |
| 3 | `prompt` was inline Markdown; assignments couldn't hold code blocks or lists | `prompt` is block Markdown for every widget |
| 4 | TeX and code inside JSON needed heavy escaping | Widget bodies are YAML (JSON still valid); block scalars for code and multi-line text |
| 5 | `\|` inside math broke tables | Spec fixes parser order (math/code before table cells); `\lvert…\rvert` documented |
| 6 | `outputMatch` loosely defined | Exact definitions of `exact`, `trimmed`, `lines` |
| 7 | `fill-blank` was text-only | Numeric blanks `{{=1.414~0.01}}` with tolerance |
| 8 | Output formatting on slider outputs | `precision` default 2, plus `suffix` |
| 9 | Lesson-level hints | Documented idiom: `:::details summary="Hint"` |
| 10 | Bare `assert` gives poor failure messages | Players must pre-define `assert_equal` / `assertEqual` |
| 11 | Solution appears late for trivial output exercises | Default `solutionAfterAttempts` is 2 for output grading |

## Round 2 — found while re-authoring against 0.2.0

1. **YAML flow-style commas.** `label: $(v_x, v_y)$` inside `{…}` silently splits into two keys. Caught by the validator as "unexpected key", but the message was confusing until understood. Resolved in the spec text (quoting rule + note that the validator symptom is "unexpected keys"); the validator should special-case this and say "did you forget to quote a value containing a comma?".
2. **Schema reuse pitfall.** A shared `scene` definition with `additionalProperties: false` can't be both embedded (in `slider-explore`) and extended (in `geometry`). Fixed by splitting into `sceneProperties` + strict wrapper; worth remembering for future nested widgets.
3. **Geometry draggable semantics.** The first draft had a separate `draggable` list naming points, but points have no names. Simplified: any `point` with `bind` is draggable. Less to validate, nothing lost.
4. **`arc` reuses `from`/`to` for angles** while other shapes use them for coordinates. It validates fine but is slightly confusing; consider `startDeg`/`endDeg` in 0.3.
5. **Static SVG vs. geometry.** After adding `geometry`, the hand-drawn tip-to-tail SVG became redundant and was removed. Expect authors to prefer `geometry` for anything mathematical; static images remain for photos and illustrations.
6. **Two `__stdout__` runs.** Because every test re-runs the entry point, an exercise whose starter code prints a lot will print once per test. Fine for now; a future `runOnce: true` could reuse the captured stdout across tests.

## Still good

- Same grading/progress model holds for both subjects.
- Lessons read as plain Markdown; YAML bodies are noticeably easier to write than JSON ones.
- Schema + small validator caught every authoring mistake before the player existed.

## Round 3 — building the web prototype (0.2.0, parser + player)

1. **Schema change (applied): `shape` now declares `discriminator: {propertyName: kind}`.** Without it,
   a single typo in a geometry shape produced 15 "must have required property" errors from every other
   shape branch. With it, Ajv reports only the matching branch. Draft 2020-12 validators that don't
   support `discriminator` (e.g. Python `jsonschema`) simply ignore it; the schema stays valid.
2. **Validator must validate each widget against its own `$defs` branch**, not the top-level `oneOf`,
   for the same reason. Worth stating in §12 as guidance for implementers.
3. **Widget placeholder convention.** Because widget bodies are YAML, every Markdown implementation has
   to lift `:::widget` blocks out before parsing. The spec should say so explicitly (§5.4) rather than
   leaving each implementation to discover it.
4. **Directive attribute syntax** (`key="value"` after the name) differs from the remark-directive
   convention (`{key="value"}`). Fine — but note in §5.4 that off-the-shelf parsers need a one-line
   rewrite, so nobody "fixes" the spec by changing the syntax later.
5. **Dragging a bound point updates two params at once.** Implementations must apply both updates
   atomically (one state change), or sliders built on "last write wins" will jitter. One sentence in §7.6.
6. **Nothing else blocked the prototype**: both sample courses parsed, validated and rendered with the
   shared `@tome/core` parser without any course edits.

---

## Round 4 — from authoring three 0.3 courses (Spanish café, Sketching, Chess tactics)

Three courses were written against SPEC-0.3-DRAFT, validated with the CLI, and played through in the prototype (audio play limits, dictation diff, recording, canvas, board click flows all exercised). What the authoring exposed:

### Should change in the draft — all seven resolved in 0.3.0 (listening groups §6.2, option audio, self-transcribed clips, transcript always-open, board selection/move display, sketch side-by-side, fill-blank inline parsing)

1. **Listening groups are needed (Open question 1: yes).** The café dialogue is used by three consecutive widgets; each carries a copy of the same 5-line transcript and its own `playLimit: 2`, so the learner actually gets six plays and the lesson source is 30 lines of duplication. Proposal: a `:::listening` directive with one Media object wrapping several widgets; one player, one play limit, one transcript revealed when the *last* widget in the group is complete. Widgets inside may not have their own `audio`.

2. **`multiple-choice` option audio is a sibling, not an Item.** The draft said options become Items; in practice the option object already has `text`, `correct`, `explanation`, so the natural form is `audio:` beside `text:`. The first attempt (`text: { text, audio }`) failed validation. Schema and draft now agree: option gains an `audio` field; `text` stays a string.

3. **Transcript rule for self-describing clips.** A clip attached to an Item (flashcard face, option, matching item) *is* its own transcript; warning about it produced 30 false positives. Rule added to the validator and should go in §7.7: audio on an Item or option needs no transcript; audio on a widget (`audio:`), `dictation.audio` and `record.model` does.

4. **`transcriptAfter: always` should mean visible, not available.** For the `record` model clip the transcript is the script the learner is about to speak; hiding it behind a button makes no sense. Prototype now shows it open by default for `always`.

5. **`board`: keep the selection on a failed `squares` check.** Wiping eight selected squares after one wrong one is punishing; now only `square`/`move` reset. Also: after a correct `move`, the player should draw the piece on its destination — the draft is silent and the static board looked wrong.

6. **`sketch` model comparison must be side-by-side with the learner's drawing.** The draft says "revealed side-by-side"; the prototype put it below the toolbar and the comparison was useless on a laptop. Make it a requirement: learner canvas left, model right, same size, on screens ≥ 860 px; stacked with the learner's on top otherwise.

7. **`fill-blank` cannot italicise across a blank.** Not new to 0.3, but surfaced here: `*¿Algo {{más}}?*` renders the asterisks literally because the text is split at blanks before inline parsing. Either document that emphasis may not span a blank (cheap) or parse inline Markdown first and substitute blanks into the resulting tree (right). Recommend the latter for 0.3.

### Worked as specified, keep

- `playLimit` per attempt: resets on a wrong answer, remaining count is visible, button disables at zero.
- Dictation normalisation flags + word-level diff (verified: missing word shown as dots, extra word struck through). `ignoreAccents: true` in lesson 1 and `false` afterwards is a natural difficulty ramp.
- `record` degrades correctly without a microphone (error text + Done still enabled) and the Skip path works.
- `sketch` strokes persist as an attachment and reload on revisit; PNG export works; canvas is resolution-independent.
- `board` with no rules engine covered every puzzle we wanted to write, including a flipped-orientation one and a multi-answer one (`Qd5`/`Qf3`). Listing accepted moves by hand was not a burden at this scale.
- `manifest.uses` derivation caught a missing `microphone` declaration on first validation — exactly its job.

### Open questions — answers so far

- **Dictation partial credit (Q2):** not needed at sentence length ≤ 8 words; the diff *is* the partial credit. Revisit only if someone authors paragraph dictation. Suggest a `maxWords: 20` validator warning instead.
- **Sketch layers (Q3):** not needed for a beginner course; trace-under was enough for all five exercises.
- **Glyph legibility (Q4):** legible at 64 px/square on desktop; the outlined white pieces on dark squares are the weak case on a phone. Recommend players draw glyph pieces with a 1 px halo in the opposite colour, and accept sprites as the path for a serious chess course.

### Tooling notes

- Spanish audio is espeak-ng synthesis (40 clips, 500 KB). Fine for a format test, obviously not shippable; a real course needs a recording workflow — which argues for a `tome assets normalise` command (loudness, trim silence, transcode to Opus) in the CLI.
- A `transcript` next to every clip doubled as the only way to review the audio during authoring. A CLI `tome audio-sheet` listing every clip with its transcript and duration would have saved time.

---

## Round 5 — from authoring the music course (Reading Music: First Steps, 20 widgets, 0.4 draft)

### Applied to the 0.4 draft while building

1. **Notes need a touch target, not a note head.** A rendered note head is ~6 px tall and the staff lines sit *on top of it*, so clicks land on the staff, not the note. Unusable with a mouse, hopeless on a phone. The player now injects a transparent hit rect (≥ 22 × 30 px) per note and disables pointer events on everything else. This belongs in the spec as a requirement, not an implementation detail: **players MUST give every clickable note a hit area of at least 24 × 32 CSS px, and MUST NOT let staff or beam graphics intercept it.**

2. **Notation libraries label their own SVG.** abcjs sets `role="img" aria-label="Sheet Music"`, which wins over the widget's note-by-note description — a screen-reader user hears "Sheet Music" and nothing else. Spec addition: **players MUST hide the renderer's own SVG from the accessibility tree** and expose the §7.8 description on the wrapper.

3. **`score` is graded only when it has an `answer`.** Most score widgets are illustrations. A new `isGraded()` in core replaces the flat type list, so a plain score does not block a checkpoint.

4. **Sequence answers must fail on the wrong note, not at the end.** Tapping eight notes and being told "no" is useless feedback. `keyboard` with `kind: sequence` now rejects as soon as the prefix stops matching. Spec: **players MUST reject a sequence at the first wrong note and say which position failed.**

5. **Changing tempo stops playback.** Otherwise the follow-highlight desynchronises from the sound.

### Confirmed working

- `bar:index` addressing (Q1): fine for these examples — 20 widgets, no ambiguity. Rests are excluded from the count as specified, which is what an author expects. **Caveat found while writing:** a pickup (anacrusis) bar makes "bar 1" ambiguous. Spec should say: a pickup is bar 0.
- ABC as the source format: compact enough to sit in YAML, and the same string drives rendering *and* playback via `setUpAudio`, so what is drawn is exactly what sounds.
- `transpose` verified end to end — the D major tune at −2 reports `E4 E4 F4 G4 …` in its description and plays there.
- Follow-highlight, tempo slider, `highlight` bar ranges, `octaveTolerant`, `given` keys.
- The bundled soundfont: five synthesised samples, ~70 kB, no network access at all during playback (verified with external traffic blocked).

### Open questions — answers

- **Q2 (loop range):** not needed for a reading course; a practice course would want it. Leave for 0.5.
- **Q3 (sustain for chords):** click-to-toggle was enough, and it makes the answer state visible, which a hold gesture would not.
- **Q4 (pitch-shifted piano above C5):** acceptable to C6, thin above it — which is why the built-in range stops there. A real course should ship its own samples via §7.9.

### Authoring footgun worth fixing in the tooling

Three of the five validation failures in this course were **a colon inside an unquoted YAML string** (`hint: Skip a key each time: C, E, G`). The error message points at the YAML line but never says "quote it". **Fixed.** The validator now recognises the common YAML failures (unquoted colon, unquoted flow value, tabs, bad indentation), names the offending line, and prints the corrected line ready to paste. Schema errors that are only fallout from a failed YAML parse are suppressed, so the real error is not buried:

```
ERROR  lessons/02-the-keyboard.md:56  Widget YAML: Nested mappings are not allowed …
       hint: Skip a white key each time: C, then E, then G.
             ^
       A value containing a colon must be quoted. Try:
         hint: "Skip a white key each time: C, then E, then G."
```

---

## Round 6 — from authoring the biology course (Cells & Heredity, 14 widgets, 0.5 draft)

### Applied while building

1. **The YAML hint added in Round 5 caught its first real bugs immediately.** Two of the three validation failures in this course were unquoted colons inside `explanation:` (`… the classic 3 : 1 ratio`), and the validator printed the corrected line ready to paste. Worth noting that a *ratio* is now a known trap alongside lists — colons appear in ordinary prose far more than expected.

2. **`explanation` was missing from six widget types.** Authoring the Punnett lesson wanted an explanation on `numeric-input` and the schema rejected it; the same gap existed on `free-text`, `fill-blank`, `ordering`, `matching` and `dictation` since 0.2. Added to the schema and rendered by the player. This is a good argument for a **shared "graded widget" base** in the schema rather than repeating optional fields per type — the next widget will forget one too.

3. **Percentage coordinates (Q1) are workable but tedious.** Circles and rects were fine to write by hand against a known 800 × 600 drawing; the one polygon (the endoplasmic reticulum, 8 points) took several passes of guess-and-check. Verdict: ship as-is, but a `tome regions <image>` command that opens a browser, lets you draw shapes and prints the YAML would pay for itself the first time an author uses a photograph rather than a diagram they drew themselves.

4. **Tap-then-tap beat drag-and-drop (Q2), for everyone.** Implemented as: tap a label to pick it up, tap a region to place it. It works with a mouse, on touch, and by keyboard with no extra code path, and the "held" label is visible state — a drag has no equivalent. Recommendation: make tap-then-tap the *only* required interaction and treat drag as an optional enhancement, rather than the reverse as the draft implies.

5. **Per-cell marking is enough (Q3).** "3 of 4 cells correct — the wrong ones are marked" plus red/green cells was clear without per-cell messages. Critically, correct cells are **not** cleared on a failed attempt: the learner fixes one cell rather than retyping the grid.

6. **Polygons did get used (Q4)** — exactly once, for an irregular organelle. Circles and rects covered the other 17 regions. Keep polygons; expect them to be rare.

### Confirmed working

- Multiple accepted regions (`accept: [mitochondrion-right, mitochondrion-left]`) — the course has two mitochondria and either is correct.
- `outline: never` for "find it without help" versus `outline: always` for labelling; `showLabels: after` reveals names once complete, which turns the exercise into a reference diagram afterwards.
- Region `description` doubles as the teaching text, shown on click — the explore-first widget needed no separate prose.
- `alternatives` on table cells (`Pp` / `pP`), numeric cells with `tolerance`, and `mode: choose` for a fixed palette.
- Every region is a keyboard-reachable button named by its label; the image keeps its own `alt`.

### Implemented after Round 6

- **Shared `graded` schema base** — `hint`, `explanation`, `maxAttempts`, `solutionAfterAttempts` defined once and referenced by all fifteen graded types. Verified both ways: a `hint` on `record` (which never had one) now validates, and a `hint` on `flashcards` is still rejected.
- **mhchem** — `\ce{}` and `\pu{}` render wherever maths does, loaded lazily with KaTeX. The photosynthesis equation is now in the leaf lesson. Gotcha for authors: `$$…$$` on a single line is *inline* maths; display maths needs the delimiters on their own lines.
- **`tome regions <image>`** — draw circles, rects and polygons on an image in a browser, edit ids and labels inline, copy the YAML. One bug found while testing it: re-rendering the region list on focus destroyed the input being typed into, so renames silently reverted. Overlay and list are now redrawn separately.
- **`fill-blank` gained `prompt`** — it was the only graded widget that could not frame its own question.

### Still to decide

- A `table-input` cell cannot yet be *partially* credited across attempts in the progress record — only the final all-correct state is stored. Fine for now; would matter if we ever report per-question analytics to authors.
- The biology course wants `\ce{}` chemical notation in two places and does not have it. The mhchem note in the 0.5 draft should be promoted to a task, not an open item.

---

## Round 7 — from authoring the chemistry course (Molecules and Rates, 20 widgets, 0.6 draft)

### Applied while building

1. **`molecule` needs `reaction` *or* `smiles`, not both required.** The esterification equation has no single structure. Schema now requires exactly one; a reaction has no clickable atoms.

2. **Hit radii must be in CSS pixels, not viewBox units.** The drawer picks its own viewBox per molecule — benzene's is 140 units wide, aspirin's is far larger — so a fixed radius of 12 units was a sensible tap target on one structure and swallowed half the ring on another. Radius is now derived from the render scale (16 px ⇒ a 32 px target). Same class of bug as the `score` note heads, from the opposite direction.

3. **Hit targets must live inside the drawn SVG.** An overlay with its own coordinate system drifted; appending circles into the drawer's SVG makes alignment exact by construction. Verified by comparing hit coordinates against the drawn bond endpoints — identical to 12 decimal places.

4. **SMILES atom order is usable but fragile (Q1).** Counting to index 3 for propan-1-ol is fine; counting to 12 for aspirin is not. **Built `tome atoms <smiles>`**, which prints each heavy atom with its index. Checking the course's hand-counted indices against it found them correct, but that is luck at this size, not method.

### Confirmed working

- Structures render offline from bundled smiles-drawer (~200 kB), including aromatic rings, branches and the reaction equation. No network access at any point.
- `simulation`: first-order decay, Arrhenius temperature dependence and a reversible equilibrium all run from declarative `step` expressions. The equilibrium model settles at **B/A = 1.98** against a theoretical *k*₁/*k*₂ = 2.0 — the model is doing real arithmetic, not animating a canned curve.
- Pause holds the state (readout unchanged over a further 700 ms), `stopWhen` halts at t = 20, `params` move while running, `trace` and `readouts` update together, and a numeric answer about the model's *behaviour* grades correctly.
- Determinism: with no `random()` in the expression language, every learner sees the same numbers, so a question with one answer is legitimate.

### Open questions — answers

- **Q2 (events):** not needed here. `stopWhen` covered every case; a one-shot event would only matter for something like "add reagent at t = 10", which is wet-lab territory we are not entering.
- **Q3 (is `repeat` + `i` enough?):** *No — conditionals are wanted immediately.* Drawing 60 molecules as blue-or-orange required **two** shapes of 60 with complementary `if()` opacity, i.e. 120 elements to draw 60 dots. It works and stays declarative, but the intent is obscured. Recommend either a `when` expression on a shape (skip the instance) or an expression-valued `color`. Worth doing before 0.6 is merged.
- **Q4 (readouts vs trace):** keep both. `trace` shows shape over time, `readouts` give the number you are asked about. The half-life exercise needs the readout; the flattening-curve question needs the trace.

### Note on scope

`simulation` here is a *model*, not a virtual lab: state, a step rule, and a view. Nothing in the chemistry course simulates apparatus, and the wet-lab item stays deliberately unscheduled.

---

## Freeze — 1.0.0-rc.1

The 0.4, 0.5 and 0.6 drafts are merged into SPEC.md and deleted. The format is frozen: from here, only clarifications and corrections, nothing a validator would have to learn to accept.

What the merge changed beyond copying text:

- **§7.4 now states the grading rule once.** `score`, `molecule` and `simulation` are graded only when they carry an `answer`; everything else grades by type; `required` overrides either way. This was previously implied in three separate widget entries.
- **§8.5 Determinism** is a new security clause, promoted from an aside in the `simulation` draft. The expression language has no randomness, no clock and no device access — so a model gives every learner the same numbers (a question about it has one answer) and no widget can fingerprint a device. It belongs with the security requirements, not with a widget.
- **§11 Validator conformance** grew from 8 checks to 11: media and instrument assets exist, `uses` is complete, listening-group structure, and notation/structure parsing with in-range answer indices. It also now *requires* that YAML failures be reported in terms an author can act on — the unquoted-colon error accounted for five of the eleven validation failures across the eight sample courses.
- **§13 is now "Open Items (post-1.0)"** and says plainly that nothing on it blocks 1.0.
- All eight sample courses declare `formatVersion: 1.0.0-rc.1`, validate, build, sign and verify against the frozen schema.

Cross-check run at freeze: every widget type in the JSON Schema has a catalogue entry in SPEC.md and vice versa — 22 types, no drift in either direction.


---

## rc.2 — asset credit, and a decision on `diagram`

**Credit (§3.3).** Attribution was missing entirely: a course could ship a stock photograph with nothing recording where it came from, and the review-before-sale step had nothing to check. Added:

- Manifest `assetsByAuthor: true` — an assertion that every image, audio and video asset is the authors' own work — or a `credits` entry per borrowed asset (`asset`, `creator`, optional `title`, `source`, `license`, `modified`).
- A `credit` attribute on `:::figure`, the shorthand for a one-off attribution shown under the caption.
- A validator error for any displayed asset that is neither covered by `assetsByAuthor` nor credited, including the cover. Verified both ways: the biology course passes with a figure-level credit on one diagram, and stripping `assetsByAuthor` from a copy correctly flags the remaining two assets.
- A rule that matters more than the fields: **credit that only exists in the manifest and is never shown does not discharge the obligation.** The player renders figure credits inline and gives every course a credits view at the end of each lesson — including courses that simply assert their own authorship, since that assertion is itself worth showing.

`source` is informative and never fetched, so this cannot become a tracking vector or a network dependency.

The Spanish course now credits its espeak-ng audio honestly, which is a better test than a fabricated attribution: the tool's licence, the fact the output is not a recording of any person, and the note that native-speaker recordings replace it before publication.

**`diagram`.** Specified in 0.2, never implemented, and the only catalogue entry with nothing behind it. Rather than ship a promise, it is now **reserved and rejected**: a validator refuses `type: diagram` with a message pointing at `figure` with an SVG. The name stays reserved so a future minor version can add it. 21 implemented types, no gap between the document and the player.

---

## Authoring documentation, and what writing it found

Three artefacts, in the order an author meets them:

1. **`tome new <dir>`** — a course that validates, builds and opens on the first run: manifest, one lesson with three widgets, a cover, and a README. For most authors this *is* the documentation; a blank directory teaches nothing.
2. **AUTHORING.md** — a tutorial, one course end to end in about an hour. It never restates SPEC.md; it links to it. Kept in `docs/` alongside the spec so it is versioned and reviewed with the code, not on a wiki that drifts.
3. **SPEC.md** — unchanged in role: the reference.

**`tome check-docs`** extracts every fenced example from the documentation and runs it through the same parser and schema the player uses. Documentation rot is the default state of authoring guides; this turns it into a failing command. A `<!-- check-docs: skip -->` marker exempts deliberately-broken examples, of which the guide has one (the unquoted-colon demonstration) — and removing the marker correctly fails, so the exemption is not hiding anything.

### Found by writing the guide and the scaffold

- **`--out` was never parsed.** Every `tome build … --out dir` in this project silently created a directory literally called `--out` and wrote the bundle there; the intended output directory was ignored. It went unnoticed because the file was always *somewhere*, and the next command was given the real path by hand. Now parsed as a flag or positionally.
- **Two broken examples in SPEC.md**, caught on the first `check-docs` run: the listening-group example elided its widget bodies with `…`, so it demonstrated the wrapper and not the contents; and the manifest example used `"sha256:3a7b…"`, which is not a digest and made the whole JSON block unparseable. Both fixed — the listening example now shows two complete widgets.
- **A JSONC comment may contain quotes.** The first comment-stripper was a regex and choked on `// OPTIONAL: SPDX id or "all-rights-reserved"`. Replaced with a scanner that tracks string state.
- **`"contentHashes": {}` is what an author writes** — the build fills it — so `check-docs` stands in a placeholder rather than reporting an error the author cannot act on.

### Verified end to end

`tome new` → add a second lesson following §2–§4 of the guide → `validate` → `build --out` → `keygen`/`sign` → `verify` → open in the player, answer all three scaffold widgets, checkpoint passes. No hand-editing of anything the guide does not mention.

### Standing caveat

This guide was written by the person who designed the format, which is the same blind spot recorded earlier. It is a hypothesis about where authors get stuck, not evidence. Revise it from where the first outside author actually stalls.


---

## `tome preview` — and two bugs it exposed

Previewing a course previously meant copying the folder into the player's `public/courses/` and hand-editing `index.json`. That was the clumsiest step in authoring and the one most likely to lose a first-time author before they ever saw their own lesson render.

`tome preview <dir>` serves the player's production build with the course mounted at `/courses/preview/`, generating the manifest from `manifest.json.in` on the fly exactly as `build` would. It watches for changes, reloads the page on save, and reports problems in two places: the terminal, and a band at the foot of the page. The store is stubbed out with an empty catalogue, since buying is not part of previewing.

**Bug 1 — a YAML failure produced a real widget type.** The `type` attribute lives on the directive, not in the body, so it survived a failed parse: the player received a `multiple-choice` with no `options` and crashed on `options.map`. One mistyped character blanked the entire lesson. The parser now forces `type: invalid` when the body does not parse.

**Bug 2 — nothing contained a widget that threw.** Even with the parser fixed, any renderer that fails takes the page with it. Widgets are now wrapped in an error boundary: a failing widget degrades to "This exercise could not be displayed", the rest of the lesson renders, and the error is logged. This matters most while authoring, when bodies are half-typed, but a published course can reach it too — through a field a newer player validates differently.

Both were found by watching a live-reload test type a broken widget, which is the closest thing in this session to observing an author at work — and it argues for doing the real version of that as soon as possible.


---

## Packaging the CLI

Authors install a published package rather than cloning the monorepo:

```
npx @tome/cli new my-first-course
```

The reason is versioning, not convenience. A clone drifts, and every support conversation then starts by working out which commit the author is on; with `npx` they are on the version the guide describes. The CLI's major and minor track the format — `@tome/cli@1.0.x` speaks format `1.0`. Publishing it publicly also matters for the claim that the format is open: a tool nobody can install undercuts that.

**What ships.** One bundled entry point (esbuild, ~1.2 MB) plus the player's production build (~4.6 MB) for `tome preview`. Tarball 3.0 MB, unpacked 5.8 MB. Pyodide is *not* copied into the package — it is a normal dependency that `tome preview` serves from `node_modules`, keeping 14 MB out of the tarball and letting npm cache it once across projects. smiles-drawer is external for the same reason. Sample courses and demo bundles are excluded: the tool ships the player, not content.

**Three packaging bugs, all found by running the built artefact rather than the source:**

- The source shebang survived bundling and the build added its own, so the published binary began with two `#!` lines and would not start.
- Bundling CommonJS dependencies (`yaml`) into ESM output broke on their load-time `require('process')`. Fixed with a `createRequire` banner plus `__dirname`/`__filename` shims.
- `tome preview` located the player relative to the source tree. It now looks for `../player` (published) and falls back to `../../player-web/dist` (checkout), and resolves Pyodide through `createRequire`.

**Verified in a clean directory**, installing the tarball as a user would: `new` → `validate` → `build` → `keygen` → `sign` → `verify` → `preview`, with the preview rendering the scaffolded lesson and its three widgets, no console errors.


---

## Sample audio: espeak → Piper

The Spanish course's placeholder clips sounded like a 1985 speech synthesiser, which is a problem for a sample course even though it is not a problem for the platform: **the format has no text-to-speech at all.** `audio` always points at a file in the bundle, so a real language course ships recordings of a human being and never touches a synthesiser. Nothing in the player falls back to TTS.

Still, the sample is the first thing anyone looks at. The clips are now generated with Piper (neural TTS, `es-carlfm-x-low`, trained on a public-domain dataset) instead of espeak-ng. Regenerating 40 clips takes about a minute; the folder is 360 kB, slightly smaller than before.

Two things learned while doing it:

- **The obvious "better" model was worse.** `es-mls_10246-low` (58 MB, trained on audiobooks) produced 25 seconds of audio for a five-second sentence — it rambles. The smaller `carlfm` model (19 MB) is coherent. Bigger is not better when the model is doing something the training data never contained.
- **Slowing speech down for learners backfired.** Setting `length_scale: 1.15` on the theory that beginners need gaps made single words drawl: "Hola" ran 2.3 seconds. Measuring the waveform showed it was speech, not padding — the model is already unhurried. Back to 1.0, and "Hola" is 0.39 s.

The manifest credit is updated to name Piper and the voice, and to say plainly that this is placeholder audio a published course would replace. The generator lives in `tools/gen_spanish_audio.py` with its own note explaining why it exists, so nobody mistakes it for a platform feature.


---

## Round 8 — a medical course (Reading the ECG, 16 widgets)

Built to answer a question from authors: can the format carry a medical course? Short answer: **yes, and no new widget is strictly required** — but the exercise found one real gap and three things that are not widgets at all.

### What worked with existing widgets

- `hotspot` for naming the waves on a trace, both as "click the P wave" and as a full labelling exercise. Percentage coordinates meant the regions survived swapping the underlying image from raster to vector without a single edit.
- `table-input` for the small-squares-to-seconds conversions and the rate table, and for a rhythm summary grid with `mode: choose`.
- `numeric-input` with `tolerance` for rate calculations — tolerance matters here, since counting squares on a strip is inherently approximate.
- `multiple-choice` for rhythm recognition, with the wrong options carrying the teaching (*"in atrial fibrillation there are no P waves at all"*).
- `free-text` with `grading: self` for "write the order you will read a strip in", which is the actual learning objective of the course.

### The real gap: you cannot measure on the trace

Reading an ECG *is* measuring. Every exercise in this course had to tell the learner the answer to the measuring step — "the R waves are four large squares apart" — and then ask for the arithmetic. That is the wrong half of the skill. What is missing is a **caliper**: place two markers on a calibrated trace, read the interval, and be graded on it within a tolerance.

That argues for a `waveform` widget in a future minor version: a time series rendered on calibrated paper (rather than an image), with `calipers` as an answer kind — `{ kind: interval, from: p-start, to: qrs-start, answer: 0.16, tolerance: 0.02 }` — plus zoom, and a text description generated from the data for screen readers. It generalises past medicine: seismographs, oscilloscope traces, sensor logs, audio envelopes. Not a blocker for 1.0; the clearest candidate for 1.1.

### Three gaps that are not widgets

1. **Intended-use statement.** The course opens with an `:::important` saying it is educational and not a clinical decision aid. That is the author's discipline, not the platform's. A medical course needs this *before purchase*, where the store can show it and a reviewer can check it — a manifest field (`intendedUse`, or a broader `disclaimer`), not a paragraph in lesson one.

2. **Provenance and consent for clinical material.** `credits` records who made an asset and under what licence. It has no way to record that a real ECG, x-ray or clinical photograph was used **with consent and de-identified**. Every trace in this course is synthetic precisely to avoid the question — a real medical course cannot avoid it. Suggest extending a credits entry with `consent` and `deidentified`, and requiring one of them for courses tagged as clinical.

3. **Currency.** Guidelines move. ST-elevation thresholds, resuscitation algorithms and drug doses all change on a cycle of a few years, and a course that is *owned forever* will outlive the guidance it was written against. This is the sharpest tension between the buy-to-own promise and medical content. A manifest `reviewedOn` / `reviewedAgainst` pair, surfaced in the library ("last reviewed 2026-08 against ESC 2023"), lets a learner see the age of what they own without the platform pretending to revoke it.

### Also found

**Line art must be SVG.** The first traces were rendered at 8 px/mm and looked visibly pixelated at the size the player draws them. The spec already says to prefer SVG for `hotspot` images (§2.3) — I ignored my own advice and the result was immediately obvious. Regenerated as SVG with a millimetre-unit grid pattern: sharp at any zoom, 37 kB per six-second strip, and the hotspot coordinates did not change because they are percentages.


---

## A silent directive failure

Reported from the ECG course: a `:::note` rendered as literal text — `:::note title="Why "block" is a misleading word"` printed verbatim on the page instead of a styled callout.

Two bugs, and the second is the one that matters.

**The course was wrong.** A double quote inside a double-quoted attribute value. The fix is curly quotes inside: `title="Why ‘block’ is a misleading word"`.

**The validator said nothing.** A directive whose attributes fail to parse was passed straight through to Markdown, where `:::note …` is just a paragraph. `tome validate` reported the course as clean, and the only way to notice was to read the rendered page. Every author will hit this, because quoting a word inside a title is a completely ordinary thing to want.

The parser now recognises a line that *looks* like a directive — `:::` plus a known directive name — but whose attributes did not parse, and reports it with the specific reason:

```
ERROR  lessons/02-intervals.md:49  Directive ':::note' has a double quote inside a quoted
       value — use ‘ ’ or rephrase, so it will render as plain text instead of a note block.
```

Running the new check across all nine sample courses found exactly one occurrence: the one reported. That is a reassuring result — it is a real trap, but not a widespread one — and it is the second time an author-facing error message has been worth more than the fix behind it.

**Also found in the same screenshot:** callout titles were being Title Cased by CSS, so *"Why ‘block’ is a misleading word"* rendered as *"Why ‘Block’ Is A Misleading Word"*. The player was altering the author's words. Removed. The remaining uppercase transforms are all on player-supplied labels ("Console", "Solution", "Listen"), never on author text.


---

## Receiving a course from an author

Asked how to add a `.course` sent by a new author, the honest answer was: unzip it into the player's `public/courses/` and edit `index.json` by hand. The tooling could preview a *source directory* but not a bundle — and a bundle is exactly what an author sends. Two commands close it:

- **`tome preview <bundle.course>`** — unpacks to a temporary directory and serves it like any other course. It verifies first and prints the result: a hash mismatch **refuses** to open (the bundle was altered after signing), while an unknown signing key opens with a warning, because a stranger's key being unknown is expected rather than suspicious.
- **`tome unpack <bundle> <dir> [keys.json]`** — writes an editable source tree, with `manifest.json.in` restored (hashes stripped) so `validate` and `build` work on the result immediately. Without that, a reviewer's first `build` would silently disagree with the manifest on disk.

The distinction the output now makes explicit is worth stating in the review process too:

| | Means | Do |
|---|---|---|
| unknown key | You have not decided to trust this author yet | Review, then add their public key |
| hash mismatch | The bundle changed after it was signed | Do not open it; ask for a fresh one |

Verified end to end with a bundle built and signed by a *different* key from the platform's: `verify` reports it untrusted and exits non-zero, `unpack` produces a directory that validates, and `preview` renders it with the warning shown.

**Production note.** This is the manual path. In the platform the store re-signs a course with the platform key after review, so players only ever trust one key and a learner never sees an author's key at all. The author's signature is what proves the bundle arrived as they built it; the platform's is what proves it passed review.


---

## Round 9 — the first course from an outside author

*Mechanics: The Essential Toolkit* (6 lessons, 17 widgets) arrived as a `.course` from Open Learning Studio. It failed validation with two errors, and both turned out to be **our** bugs, not the author's. This is the first evidence from someone who did not design the format, and it is worth more than any of the sample courses.

### 1. One concept, two shapes

The author wrote a multi-series chart inside `slider-explore`:

```yaml
plot:
  series:
    - { expr: "v0 + a*x", label: $v(t)$ }
  x: [0, 5]
```

Which is exactly how the `plot` **widget** works — and exactly what `slider-explore.plot` did not accept, because it took a single `expr`. Two shapes for the same idea, and the author picked the one they had already learned. Nobody who designed the format would have made this mistake, which is precisely why it survived nine sample courses.

Fixed by making `slider-explore.plot` take the same shape as the `plot` widget, with `expr` kept as sugar for a single series, and by **sharing one renderer between them** so they cannot drift apart again. A side benefit: the slider chart now gets the axes, ticks and legend the standalone widget always had.

### 2. A slider that silently did nothing

Their simulation exposed the time step as a slider:

```yaml
params:
  - { name: dt, label: Time step, min: 0.01, max: 0.2, value: 0.05 }
```

`dt` is the engine's own step, so the param was shadowed: the slider moved, the label updated, and the model ignored it. Measured before the fix, the clock advanced at the same rate at `dt=0.01` and `dt=0.2`. The engine now reads `dt` from the params when present — the author's intent, honoured — and `t` (the model clock) is a reserved name that the validator rejects in `state` or `params` rather than letting it shadow silently.

### What this says about the design process

Both bugs are the same kind: **an inconsistency invisible from the inside**. The format grew one widget at a time against courses written by its designer, so `plot` and `slider-explore.plot` diverging never looked wrong to me. It took ninety minutes of an outside author's time to surface it.

The rest of the course — 15 other widgets across free-text, matching, ordering, table-input, fill-blank, numeric-input and multiple-choice — rendered correctly with no placeholders, no unparsed directives and no console errors. So the format held; the seams between its parts did not.


---

## Round 10 — an author's review of the documentation

The author of *Mechanics* sent a written review of AUTHORING.md and SPEC.md. Triaged rather than applied wholesale: six accepted, three deferred, four declined. What made the cut and why.

### Accepted

1. **§7.1 did not list the shared graded attributes.** We factored `hint`, `explanation`, `maxAttempts` and `solutionAfterAttempts` into a schema base and never added them to the reference table — so the changelog claimed they existed "once for all graded types" while §7.3 showed them nowhere. Now catalogued in §7.1, with a note that non-graded types must reject them.

2. **`simulation` used `params[].value`, `slider-explore` used `default`.** The same seam that broke this author's chart: one idea, two spellings. Both are now synonyms in both widgets, in schema and player.

3. **The spec never mentioned `manifest.json.in`.** It appears throughout the guide and in every sample course, but a second toolchain implementer would have had no idea it existed. §2.2 now documents the source form against the bundle form, and says plainly that a tool should not make an author maintain `contentHashes` by hand.

4. **Nothing said what an author ships without platform keys.** §2.2 and the guide now state it: an unsigned bundle, signed by the platform after review. Signing your own is for proving to yourself the file has not changed.

5. **The spec never pointed at the JSON Schema.** The reviewer concluded no machine-readable schema existed. It does — we simply never linked it. §3.1 now names both files and settles precedence: the schema is normative for structure, the prose for meaning.

    **But the deeper defect was that no document said who it was for.** The reviewer read SPEC.md as author documentation and reported a missing author deliverable; an author should never need to know that JSON Schema exists, let alone read it. Both documents now open by naming their audience: AUTHORING.md says everything an author needs is in it, and that the spec is a lookup table and the schemas are for the tooling. SPEC.md says it is for people building players, validators and tools, and that an author should read the guide instead. The schema link stays in the spec only.

    One exception, because it costs an author nothing: a manifest may now carry an ignored `$schema` key, which makes editors offer completion and inline errors on `manifest.json.in`. That is the single case where a schema is worth an author's attention, and it requires understanding none of it.

6. **No text alternative for `plot`, `geometry` or `simulation`.** We require `alt` on images, transcripts on audio, generated descriptions for notation and structures — and left the three most abstract visuals silent. New §7.11: an optional author `description`, a *required* generated fallback so nothing is ever announced as an unlabelled graphic, and a validator warning when a graded visual has none.

That last check immediately found five undescribed simulations **in our own chemistry course**, two of them graded. Fixed by writing the descriptions rather than exempting ourselves.

### Deferred

- **Conformance fixtures** (one valid and one invalid case per widget). Real value for an open format — it is how a second player implementation proves itself, and it would have caught both of this author's bugs. Worth doing when a second implementation is in prospect.
- **`tome validate --json`** for CI. Cheap; not yet needed.
- **Promoting §8.6 resource limits from SHOULD to MUST.** Agreed in principle, but the numbers deserve deciding rather than promoting as they stand.

### Declined, with reasons

- **Learning-design guidance** — prerequisites, lesson counts, assessment blueprints, pass thresholds. That is course design, not course format, and pass thresholds imply certification, which is deliberately out of scope.
- **A degree-notation convention.** KaTeX handles `^\circ`, prose handles `°`; no rule is needed and one would only be broken.
- **A directive parsing algorithm.** A worked nested example: yes. Pseudocode in a spec invites divergence from the reference implementation, which is the failure mode we have spent this whole project avoiding.
- **Further credit-display requirements.** §3.3 already settles it: manifest-only is insufficient, and either an inline `figure` credit or a course-level credits view discharges it.

### What the review was worth

The two most valuable findings from this author came from *building* — the plot shape and the `dt` slider — not from reading. A document review surfaces inconsistencies between paragraphs; using the thing surfaces inconsistencies between parts. Both are worth having, in that order of priority. Their glossary suggestion is already in §13, which is a small sign the review did not reach the end of the document.


---

## "tome: command not found"

Reported while trying to run the commands the guide prescribes. Two causes, one of them a real bug:

**The bug.** `packages/cli/build.mjs` wrote `dist/index.js` without the executable bit. npm sets that bit when installing from a tarball — which is why the clean-room install test passed — but a workspace checkout symlinks straight at the file, so inside the repo `npx tome` failed with *Permission denied*. The build now chmods it. A good reminder that testing the packaged artefact and testing the checkout are different tests.

**The documentation gap.** The guide is written for the published package (`npx @tome-courses/cli …`), which does not exist yet, and said nothing about the case everyone is actually in today: a checkout. It now has a collapsed section covering both routes —

```
npm install && npm run build:cli
npx tome validate .              # anywhere inside the checkout
npm link -w @tome-courses/cli    # optional: `tome` on the PATH everywhere
```

— and the CLI's own README says the same. Both verified: `npx tome` works from the repo root and from a subdirectory, and after `npm link` a bare `tome` scaffolds and validates a course from an unrelated directory.


---

## "manifest.json is missing"

Reported when validating a course an author had sent. `manifest.json.in` on its own validates correctly — that was never the problem. The real one: the course sat inside a wrapper folder (as an unpacked zip does), so the tool was pointed one level too high, found no manifest, and **crashed with an unhandled ENOENT naming `manifest.json`** — the generated file an author never writes. The message therefore read as *"your course is missing a file"* when it meant *"you are in the wrong directory"*. It is hard to design a more misleading error.

`findCourseRoot` now resolves the path for every command that takes a course directory:

| Situation | Behaviour |
|---|---|
| Manifest is one level down, exactly one candidate | Uses it, and says so: *Using ./knots-course — the course is one level down.* |
| Several courses side by side | Lists them and asks which |
| A `.course` file passed by mistake | Suggests `tome preview` or `tome unpack` on that file |
| No manifest anywhere | Explains what a course directory contains, and ends with: *manifest.json is generated by `tome build`; you never write it by hand* |

The guide now states the same thing where an author meets it: `manifest.json.in` is the only manifest you ever write, `manifest.json` never appears in your own directory, and being asked for one means you are pointed at the wrong place.

Three of the last four reports have been error messages rather than broken features. That is a good sign about the code and a poor one about the messages, and it is worth budgeting time for the latter before more authors arrive.


---

## A bundle with a wrapper directory

`tome preview electrodynamics.course` failed with *"Error: manifest.json missing"* while the same course previewed fine once unpacked. Not expected, and the same wrapper-folder problem as the previous report — this time *inside* the zip.

The bundle had every entry under `electrodynamics/`, which is what you get from zipping the folder rather than its contents. §2.2 requires `manifest.json` at the bundle root, so the file was technically malformed, and the reader threw a bare error naming the file it could not find rather than the reason.

Now: `unpackBundle` detects a single wrapper directory containing a manifest, strips it, and reports what it did — *"Bundle entries are nested under 'electrodynamics/' … rebuild it with `tome build` rather than zipping the folder"* — through `preview`, `unpack`, `verify` and `sign` alike. Strict in what we produce, lenient in what we read, and explicit about the difference. The player's install path gets the same leniency, so an already-distributed bundle of this shape is not lost.

Two related failures fixed at the same time, both of which threw stack traces: a `.course` that is not a zip at all now says *"could not be opened: invalid zip data"*, and a zip with no manifest says what it does contain. `verify` and `sign` no longer crash on either.

The guide now tells authors to use `tome build` rather than zipping by hand, and says why.

**Pattern worth noting:** the same underlying confusion — *where is the root of this course* — has now produced three separate reports, at three layers (directory, unpacked zip, bundle). Each was a different code path with its own error message. Worth remembering when adding any new entry point that takes a course.


---

## Getting the tools to an author

Three options, in order of how much friction the author feels:

1. **Publish to npm** — `npx @tome-courses/cli new my-course`. One command, nothing to download, always the version the guide describes. The right answer, and worth doing even while creators are invite-only: a tool nobody can install undercuts the claim that the format is open, and the tool without courses is harmless.
2. **A GitHub release URL** — `npm install -g https://…/tome-courses-cli-1.0.0-rc.4.tgz`. Same install, no registry account, and a stable link to send. Good interim.
3. **The tarball itself** (3.0 MB) — `npm install -g ./tome-courses-cli-1.0.0-rc.4.tgz`. Works today with no infrastructure at all. Updates mean sending a new file.

What is *not* worth doing: a private registry or GitHub Packages. Both need the author to authenticate npm before they can install anything, which is the highest-friction step in the whole process and lands on the person least likely to enjoy it.

**Verified from a clean global install**, outside the repo: `new`, `validate`, `build`, `sign`, `verify` and `preview` all work, with Pyodide served from `node_modules` and the player served from the package.

**Version alignment fixed.** The package still said `1.0.0-rc.2` while the format was at rc.4, breaking the promise in its own README that `@tome-courses/cli@1.0.x` speaks format `1.0.x`. Package version, `FORMAT_VERSION` in the scaffold, and the spec are now the same string.

**AUTHOR-SETUP.md** is a one-page sheet to send with the file: install, update, the five commands that matter, and the note that authors never need to sign anything.


---

## Round 11 — a second author's review, and a self-inflicted bug found while checking it

This review argued the guide teaches **structural** correctness well and **semantic/grading** correctness poorly: a widget can validate cleanly while still rejecting an answer a learner reasonably considers correct. Rather than trust that framing, I tested it against the reviewer's own course (*Binary Logic Gates*) before changing anything.

**It reproduced immediately, in their own course.** `lessons/01-binary-logic.md` has:

```md
text: "A binary bit has {{two}} possible values: {{0}} and {{1}}."
```

`{{two}}` is a **text** blank — compared as a literal string, with no numeric alternative. A learner who reasonably types `2` instead of spelling out `two` is marked wrong. Verified in the running player: `two/0/1` → *3 of 3 correct*; `2/0/1` → *2 of 3 correct*. This is not a platform bug — `fill-blank` behaved exactly as specified — but it is a real, present-in-the-wild instance of the exact failure mode the review describes, which moved several of its recommendations from "plausible" to "demonstrated."

### Accepted, and added

- **A "How answers are matched" reference** (AUTHORING.md §3): the `{{answer|alt}}` vs `{{=number~tolerance}}` distinction stated plainly, with the `two`-vs-`2` trap named directly; `matching`/`ordering` explained as **positional** rather than text-comparison, which was previously undocumented anywhere, including SPEC.md; a compact table for the five most-used graded widgets, in the shape the reviewer proposed.
- **A new §7, "Test every exercise as a learner"**: a five-step checklist (intended answer, obvious wrong answer, plausible alternative, hint/explanation read-back, numeric edge case), with the reasoning made explicit — a course opened offline has no teacher on the other end to notice a correct answer was rejected.
- **A companion line by "write the exercises first"**: "test the answer, not just the exercise."
- **Troubleshooting gained a second table**: symptom → likely cause, for the semantic failures a validator cannot catch by construction.
- **SPEC.md §7.3 now states the matching/ordering grading rule** (`matching`: paired by position in `pairs`, not by text; `ordering`: correct order is the order `items` is written in). This was a genuine spec gap, confirmed by reading the widget source, not merely a documentation-thinness complaint.

### Declined, and why

- **A full per-widget "author checklist"** (purpose / input / answer / alternatives / normalisation / tolerance / feedback / accessibility / testing) **for every widget.** The reviewer's own priority list asked for this "without making the guide substantially longer," which the full version of their own proposal cannot satisfy — repeating SPEC.md's field-by-field detail in AUTHORING.md is the mistake a previous round already reversed (SPEC.md is the reference; the guide is not). Built the compact table instead, covering the widgets that generate nearly all grading questions.
- **Automatic detection of likely answer-matching mistakes** (e.g. flagging a spelled-out number with no numeric alternative). Considered and rejected: this is natural-language answer-equivalence detection, an open problem, and a heuristic here would mostly produce false positives on courses that spell out numbers on purpose (a French numbers lesson, say). Better to teach the pattern once, well, than to build a linter that cries wolf.

### Versioning note

Nothing in this round touched a schema or changed grading behaviour — every change is prose. `formatVersion` was **not** bumped: a documentation clarification is not a format change, and a course built under rc.4 is unaffected by any of this. Two stale literal version strings were fixed in passing (SPEC.md §3.1's example manifest and AUTHORING.md's scaffold comment both still said an earlier rc), which is the same class of drift the very first documentation review flagged — worth a standing reminder that a hardcoded version string anywhere is a bug waiting for the next release.


---

## Round 12 — an electrical-engineering author

Two problems in their course, both fixed on the author's side: exercises that repeated the worked example's numbers exactly, and hand-drawn circuit SVGs whose components did not quite meet their wires. The feedback generalised both into requests. Triaged:

### Accepted

- **"A worked example and its exercise should use different values."** Correct, and not previously said anywhere. Added as the *first* item of the §7 testing checklist, because it is the one failure that survives every other check: the exercise validates, renders and grades correctly — it simply tests copying instead of applying.
- **An automated warning for it.** Built as a narrow heuristic: warn when a numeric answer *and* at least one of its given quantities both appear in the prose since the previous widget. Requiring the pair is what keeps it quiet. Measured before deciding to keep it:
  - fires on the author's exact case (5 V / 10 Ω → 0.5 A, repeated), as `numeric-input` and as a numeric `fill-blank`;
  - silent on the fix (9 V / 15 Ω → 0.6 A) and on a coincidental same-answer exercise with different inputs;
  - **zero warnings across all ten existing courses.**
  A warning, not an error: deliberate "now you try it with the same numbers" is legitimate. This is the contrast with the answer-equivalence detector declined in Round 11 — that one would have been noisy on real courses; this one measurably is not.
- **Guidance for technical diagrams.** New *Technical diagrams* subsection: write the one-sentence intent first, check connections at 300–400 % zoom, dot the joins and not the crossings, check at learner size and narrow width, and reuse the intent sentence as the alt text so the description is checked against the drawing rather than written from it.

### Deferred

- **Semantic circuit diagrams — components and connections in, rendered schematic out.** A genuinely good idea: it makes misalignment impossible and yields a meaningful text alternative for free. But text-to-schematic renderers already exist, so this is an integration rather than an invention, and it should wait until more than one course needs it. Recorded in §13 with the route: pick a renderer, confirm it works offline within the bundle budget, wrap it as a widget — as `score` did with ABC and `molecule` with SMILES.

### Declined

- **Connection-point validation, snapping and junction detection on raw SVG.** Inferring that a line "nearly touches" a component means reverse-engineering geometry from arbitrary drawings — fragile, and superseded by the deferred item above, which removes the problem instead of detecting it. Authors get the manual version in the guide in the meantime.
- **A bundled library of electrical symbols.** Same reason: it belongs with the schematic widget if that is built, not as loose assets.

### The general point, which the author made well

Three levels: the files parse, the course is valid, and the learner experiences what the author intended. The tooling covers the first two. For the third, the guide now has a checklist, and the validator has exactly one heuristic that earned its place by being right on the real case and quiet everywhere else — which is the bar any future "semantic" warning should have to meet.


---

## CircuiTikZ as the near-term answer for circuits

Asked whether LaTeX could draw circuits. It can — CircuiTikZ is the standard in engineering LaTeX, and most EE educators already know it. Tested end to end rather than asserted: two circuits (the author's battery/switch/resistor/LED loop and a voltage divider with a tapped output) rendered through `latex` + `dvisvgm` to clean 11–13 kB SVGs, then validated, bundled and shipped as ordinary image assets with their `.tex` source alongside.

**It fixes the author's actual problems.** Components are placed on the path between two coordinates, so they cannot be drawn short of a wire; junctions are explicit (`*-`), so crossings and joins cannot be confused. No format change and no player change: the SVG is just an image.

**It does not fix everything, and I demonstrated that on myself.** Polarity follows the direction a path is drawn. My first divider had the source upside down; my first *fix* was also wrong — I reversed the drawing direction *and* added `invert`, cancelling out. The correct version took three attempts, and each wrong one looked like a perfectly good schematic. So the guide says to check +, diode direction and current arrows in the rendered picture, not the code. That is the single most useful sentence in the new section, and it is there because I needed it.

**Where it runs matters.** At authoring time, on the author's machine — never in the player. KaTeX cannot render TikZ, and shipping a TeX engine to the player would mean executing author-supplied code at view time, which §8.1 forbids.

This makes the deferred netlist widget less urgent without making it pointless: CircuiTikZ gives no generated text alternative and no semantic check, which is exactly what the netlist route would add.


---

## LaTeX for diagrams generally

The CircuiTikZ note in the guide was widened into a *Drawing diagrams in LaTeX* section: a table of packages by subject (`circuitikz`, `tikz`, `forest`, `chemfig`), one worked example, the conversion commands, and three checks. Tested before writing it: a circuit, a free-body diagram and a flowchart all render through `latex` + `dvisvgm` to 12–34 kB SVGs.

Two things only testing found:

- **The PDF route needs a different tool.** Authors on Overleaf get a PDF, not a DVI. `dvisvgm --pdf` looked like the obvious answer and failed here — it only supports particular Ghostscript versions — so the guide recommends `pdf2svg` or Inkscape instead, which both worked.
- **My first free-body diagram was wrong, in a new way.** Forces started from three different points (centre, top face, sides), gravity was drawn through the label and the floor, and the floor was there at all — a free-body diagram isolates the body. Nothing to do with the tool: TikZ drew exactly what I described. So the guide's checks now include *follow your subject's conventions*, alongside the circuit polarity trap.

The pattern from the circuits carries over intact: code makes a diagram precise, not correct. Both of my wrong diagrams were crisp, valid and plausible.

Also noted in the guide: `--no-fonts` turns labels into outlines, so a screen reader cannot read any text in the diagram and the alt text carries everything; and a Tome widget (`plot`, `molecule`, `geometry`) is preferable where one fits, since it is interactive and describes itself.

A leftover duplicate heading from Round 11's edit was removed in passing.


---

## Maths in feedback, and a silent YAML trap

Reported from a screenshot: an explanation showing `1/R_eq = …` with no subscript. Maths does render in explanations, hints, options and prompts — the author had simply written no `$…$`. Verified in the player: the same explanation with delimiters renders with KaTeX, both unquoted and single-quoted.

Testing the quoting variants found the real problem. **Double-quoted YAML silently corrupts LaTeX.** YAML treats `\` as an escape inside `"…"`, and many common commands begin with a valid escape letter:

| Written | Parsed as |
|---|---|
| `\theta`, `\times`, `\tau` | tab + `heta`, `imes`, `au` |
| `\frac` | form feed + `rac` |
| `\beta`, `\bar` | backspace + `eta`, `ar` |
| `\alpha` | bell + `lpha` |
| `\nu`, `\neq` | newline + `u`, `eq` |

No error, no warning — the validator passed it, and the learner would see broken maths. Only commands whose second letter is not an escape (`\mathrm`) failed loudly. Worse, the guide told authors to fix a colon by wrapping the value in double quotes, and the validator's own hint printed a double-quoted fix: our advice led straight into it.

Fixed three ways:

- **The validator rejects LaTeX inside double quotes** — specifically a backslash command inside a `$…$` span in a double-quoted scalar, which scopes out intended `\n` newlines — and prints the single-quoted line to paste. The loud `\mathrm` case now reports once, not twice.
- **The colon hint suggests single quotes** whenever the value contains a backslash.
- **The guide** says maths works throughout widgets, shows a single-quoted example (checked by `check-docs`), and gives the one rule for single quotes: a literal apostrophe is written twice.

Checked against every existing course: no false positives, and an independent search confirmed none contained double-quoted LaTeX — nothing had been silently corrupted. SPEC §11 now says a validator SHOULD catch this.

The root cause is worth naming: the fix for the most common YAML mistake (quote it) collides with the most common content in a technical course (LaTeX). Two pieces of good advice, each correct alone, and wrong together.


---

## Round 13 — a cuneiform course

The author wrote fifteen lessons but, by their own account, never ran `tome validate` or `tome preview`. That shaped the triage: several of their "widgets I would have liked" already exist, so before building anything I checked what they could not have known.

### The real finding: discoverability, and a bug that hid a feature

- **Already there:** flashcards (with images on either face), `hotspot` for finding a sign on a tablet photograph, `ordering` with a non-drag keyboard path, and `free-text` with `grading: self` and a `modelAnswer` for interpretation. They were buried in one sentence of the guide. *Choosing a widget* is now a table organised by what the learner should be able to do, covering every type, plus a paragraph on when not to use a widget at all.
- **A bug that made one of them unusable:** images inside widgets never loaded. Widget text — options, flashcard faces, prompts, explanations — was rendered without the course's asset resolver, so `assets/images/x.svg` was requested from the wrong place. Images in prose worked, which is presumably why it went unnoticed. Fixed by passing the resolver through React context; verified in the player that images in options and flashcards now load, and that tapping an image inside an option selects the option rather than doing anything else. The validator also ignored images written inside widget text, so a wrong path there passed silently; it now checks them and counts them for credit.

### Built

- **Full-screen image viewer.** Any image in lesson prose opens full-screen on tap, with a second tap for a closer view and scrolling to pan; Esc closes and returns focus. Player-only, no format change, so every existing course benefits — a six-second ECG strip goes from 336 px wide on a phone to 780 px. Two bugs on the way: "actual size" for an SVG is just its declared width (vectors have none), so the closer view is at least twice the screen width; and the image, being a flex item, shrank to its natural width regardless.
- **Asset limits actually enforced.** SPEC §2.3 says validators MUST reject images over 10 MB or 8192 px; nothing checked, and a 9000 px image validated. Now enforced (pixel sizes read from PNG, JPEG and WebP headers), with a warning over 2 MB and the course's total size and largest files printed by every `validate`.
- **`tome build` rewritten in-process.** Reading it turned up two defects: it wrote `manifest.json` into the author's source folder — contradicting what the guide says — and it shelled out to the system `zip`, which does not exist on Windows. It now uses core's own `packBundle`. All ten courses rebuild, sign and verify; six stale `manifest.json` files from the old build were removed from the sample courses, where anyone copying one had inherited them.
- **A two-lesson starter, tested automatically.** `tome new` now adds a lesson showing an image, alt text and a question with image options. `npm test` builds the tool, checks every documentation example, and confirms the starter validates without warnings, builds, and leaves the source untouched.
- **Guide additions:** image formats and sizes (with a one-line ImageMagick command), *Teaching with images*, a *Before you send it* checklist, and a line at the first `validate` saying what "Valid" does not mean.

One correction to my own work: the image-options example first described the sign AN as "four wedges meeting at the centre". Its shape varies a great deal by period — the very thing this author warned about — so it now says only that AN began as a picture of a star.

### Also fixed in passing

The SPEC §2.3 asset table had been split in two by a paragraph I inserted in Round 6, so its last two rows rendered as a stray fragment.

### Deferred

- **Spaced review for flashcards** — a player behaviour; the cards are already data.
- **Annotated images** — an exploratory `hotspot` with no answer, much as `score` works without one.
- **A course-level term or sign bank** — folded into the existing glossary item.

### Declined

- **A CLI "release state" summary** tracking whether manual tests were done. The tool cannot know whether an author answered every widget, and a status line implying otherwise would be worse than the checklist.


---

## rc.5 — annotated images, and a keyboard audit that found three broken widgets

**Annotated images.** The cuneiform author's request for a guided image viewer became an optional `answer` on `hotspot`: without one, regions are outlined, tapping shows the label on the image and the description below, and nothing is graded — the same pattern `score`, `molecule` and `simulation` already follow. Tested on a drawn tablet with three regions.

**Testing it by keyboard found that hotspot regions could not be activated by keyboard at all.** The handler called `.click()` on the region, but regions are SVG elements and SVG has no `.click()`; it threw, silently. Tab reached a region, Enter did nothing. The biology course had only ever been tested with a mouse.

That prompted an audit of every widget with SVG targets:

| Widget | Reachable by Tab | Activatable by keyboard |
|---|---|---|
| `hotspot` | yes | **no** |
| `keyboard` | yes | **no** |
| `board` | **no** | **no** |
| `score` (note answers) | **no** | **no** |
| `molecule` | yes | yes |
| `geometry` | no | — the same values have sliders, which are |

The spec promised keyboard operation for several of these. All four are fixed, each with one tab stop and arrow-key movement rather than a tab stop per target — a chessboard with 64 tab stops would barely be better than none. Accessible names now carry what a screen-reader user needs: *"c6, ♛"*, *"C5, pressed"*, *"Bar 2, note 4, C5"*. The score's wrapper switches from `role="img"` to `role="group"` when its notes are answers, since an image role would hide its children from assistive technology.

Verified by completing each widget with the keyboard alone — hotspot (explore and graded), piano, board, score — then re-checked with the mouse for regressions. SPEC now states the keyboard behaviour normatively for `board` and `keyboard` too.

This is the concrete form of a warning recorded much earlier: accessibility asserted in the spec, never exercised. The defect class — "reachable but not operable" — is invisible to a sighted mouse user and to every validator.

**Version drift, closed for good.** Version strings had drifted apart three times. `npm test` now fails if the package, the scaffold, the spec header and both documented example manifests do not all name the same version — checked against a deliberately wrong value.


---

## rc.6 — spaced review, and a field that had waited since 0.2

**Built:** spaced review for flashcards. After turning a card the learner grades their recall — *again*, *hard*, *good* — and each button says when the card will return. A **Review** entry in the course contents gathers due cards from every spaced deck, and the library card shows how many are waiting.

**Design choices, each made for this product rather than borrowed:**

- **Leitner boxes** (1, 3, 7, 16, 35 days), not SM-2. A box is explainable to a learner, predictable for an author, and forgiving of a learner who disappears for a month: their cards are simply due, in overdue order, with nothing lost. Unit-tested, including that case; 19 tests now run in `npm test`.
- **One progress row per card, not per deck.** Sync is last-write-wins per row, so a deck stored as one row would let a phone and a laptop reviewing offline erase each other's work. Per card, they only collide on the same card, where the later review is the right one to keep.
- **Cards keyed by their front**, so an author reordering a deck does not scramble anyone's schedule.
- **Course review includes only cards already met in a lesson** — including its "practise all" — so review never presents material before the lesson that teaches it. The first implementation got this wrong for practice mode; the end-to-end test caught it.
- **Practice and browsing never change the schedule.** Verified by comparing stored progress before and after.

**A bug the clock-controlled test found:** due counts only updated on re-render, and nothing re-renders when time merely passes, so a tab left open overnight still said "nothing due" the next morning. A small `useNow` hook re-renders every minute and whenever the page becomes visible; the test now advances 25 hours *without navigating* and sees "6 due".

**The surprise:** SPEC already had `spaced` — *"opt into the player's spaced-repetition queue"* — since 0.2, and two sample courses (Python, Vectors) already set it. No player had ever acted on it. `shuffle` was in the schema, absent from the spec's table, and likewise ignored. Reading the spec before building is what caught this; the first implementation had made review the default for every deck, which would have contradicted a frozen opt-in field and changed the behaviour of every existing deck. Now `spaced: true` opts in, decks without it browse exactly as before, and `shuffle` works and is documented. This is the second field (after `diagram`) that was specified and never built — worth a systematic check that every schema field has a player behaviour behind it.

**Versioning:** rc.6. The schema is unchanged and every rc.5 course is valid, but the spec gains normative player requirements and the bundled player changes, and an rc.5 tarball had already been distributed — two different packages under one version would be indistinguishable to an author. The drift check confirmed every version string moved together.


### Follow-up: an audit of every schema field

`spaced` was the second field, after `diagram`, that the format specified and no player implemented. Rather than wait for a third to be found by accident, every widget field in the schema was checked against the player source that should implement it.

| Field | Finding | Outcome |
|---|---|---|
| `geometry.description` | added in rc.4, never wired — and the scene had **no accessible name at all**, announced as just "image" | implemented, with a generated fallback naming its labels and current values |
| `free-text` `minLength`, `maxLength` | ignored | implemented: Check stays disabled below the minimum, with a live character count |
| `code-exercise` `resetable` | ignored; Reset was always shown | implemented |
| `maxAttempts` | a §7.1 graded attribute that nothing implemented | **reserved** — its only meaning, locking an exercise, would block a checkpoint forever in a course with no teacher to unlock it; `solutionAfterAttempts` covers the need humanely |
| `ref` | shared widget bodies, specified but not even parsed | **reserved** — needs file resolution in parser, validator and both player loaders; no author has asked |
| `code-exercise` `files` | multi-file exercises, ignored | **reserved** for a future minor version |
| `record.grading`, `sketch.grading` | only allowed value is `self` | no behaviour needed |

Reserved fields are rejected with a message saying what to use instead, exactly as `diagram` was. No known course used any of them. The principle from the `diagram` decision held up: a frozen format must not promise what no player does — either build it, or withdraw it honestly while the rc period still allows it.

The audit now runs in `npm test` (`scripts/field-audit.mjs`): any field the schema accepts with no behaviour in the reference player fails the build. Checked by adding an unimplemented field to the schema — the test named it.
