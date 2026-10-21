# Course Format Specification

**Version:** 1.0.0-rc.9  
**Status:** Release candidate. The format is **frozen**: no breaking changes before 1.0.0 final. Additions during the rc period are limited to optional fields that an older player can ignore safely. Report ambiguities and gaps against this document.

---

## 0. Purpose and Principles

This document specifies the portable course format used by the platform player. A course is a self-contained, signed archive that can be rendered fully offline on iOS, Android, desktop and web.

**Who this is for.** People implementing a player, a validator or authoring tools, and authors looking up a specific field. It is a reference, not a tutorial: an author writing their first course should read **AUTHORING.md** instead and come here only for §7.3. Nothing in this document is knowledge an author needs in order to write a course — the tooling applies these rules on their behalf.

Design principles, in priority order:

1. **Safety.** A course can never execute author-supplied code on the learner's device. All interactivity is declarative.
2. **Longevity.** A course valid under any released version of this spec MUST remain openable by all future players.
3. **Portability.** No external dependencies at runtime: no network, no remote fonts, no CDN scripts.
4. **Authorability.** Courses can be written in a plain text editor and validated with a CLI.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as in RFC 2119.

---

## 1. Terminology

| Term | Meaning |
|---|---|
| **Bundle** | The `.course` archive containing a complete course |
| **Manifest** | `manifest.json` at the bundle root |
| **Lesson** | A single Markdown document |
| **Chapter** | An ordered group of lessons |
| **Block** | A fenced `:::` directive inside a lesson (callout, video, widget, …) |
| **Widget** | An interactive block rendered by a player-provided component |
| **Player** | The application that opens and renders bundles |
| **Validator** | The reference tool that checks a source directory against this spec |
| **Signer** | The platform service that signs approved bundles |

---

## 2. Bundle

### 2.1 Container

A bundle is a ZIP archive (PKZIP 2.0, DEFLATE or STORE) with the extension `.course`. 

- Paths MUST use `/` separators and be relative to the archive root.
- Paths MUST NOT contain `..`, leading `/`, backslashes, or absolute drive references.
- Paths MUST be valid UTF-8 and MUST match `^[A-Za-z0-9._/-]+$`.
- Filenames are case-sensitive. Two entries MUST NOT differ only by case.
- Maximum uncompressed bundle size: **2 GiB**. Players MAY refuse larger bundles.

### 2.2 Layout

```
/
├── manifest.json        REQUIRED
├── signature.json       REQUIRED in distributed bundles (absent in unsigned dev builds)
├── lessons/             REQUIRED — one or more .md files
├── assets/              OPTIONAL
│   ├── images/
│   ├── video/
│   ├── audio/
│   └── animations/
├── widgets/             RESERVED — for shared widget definitions; not used in 1.0
└── i18n/                OPTIONAL — translation files
```

Any additional top-level entries MUST be ignored by the player and SHOULD be flagged by the validator.

**Source form.** The layout above is the *bundle*. A course is normally written in a directory that differs in two ways, and a build step produces the bundle from it:

| In the source directory | In the bundle |
|---|---|
| `manifest.json.in` — hand-written, `contentHashes` left as `{}` | `manifest.json` — generated, `contentHashes` filled in |
| no `signature.json` | `signature.json`, added by signing (§4) |

A tool MAY use different names, but SHOULD NOT require an author to maintain `contentHashes` by hand: they change on every edit, and a stale one is indistinguishable from tampering. `tome build` implements this; §11 conformance applies to the bundle, not to the source directory.

**Signing is not the author's step.** An author without platform keys ships an **unsigned bundle** — valid in every respect except that it lacks `signature.json` — and the platform signs it after review (§4). A player MAY open an unsigned bundle in a developer mode; it MUST NOT do so in the ordinary library.

### 2.3 Asset constraints

| Kind | Allowed formats | Limits |
|---|---|---|
| Image | PNG, JPEG, WebP, SVG (sanitised, see §8.3) | ≤ 10 MiB each; ≤ 8192 px per side |
| Video | MP4 container, H.264 video, AAC audio | ≤ 500 MiB each; ≤ 1080p |
| Audio | MP3, AAC (M4A), Opus in OGG | ≤ 50 MiB each. Also used for instrument samples (§7.9) |
| Animation | Lottie JSON (v5.x schema) | ≤ 5 MiB; MUST NOT contain expressions |
| Font | *not allowed* | Player supplies all fonts |

`hotspot` regions are defined in percentages of the image box (§7.3), so a low-resolution image goes blurry long before the coordinates stop working: prefer SVG, or a 2× raster.

Validators MUST reject assets outside these constraints. The signer MAY transcode media to conforming formats.

There is no limit on the total size of a course. Every asset is downloaded once per device and kept, so size is a cost to the learner's storage and first download rather than to every visit; `tome validate` reports the total.

---

## 3. Manifest

`manifest.json` MUST be a UTF-8 JSON object conforming to the schema below.

### 3.1 Schema

The normative machine-readable schemas are `schemas/manifest.schema.json` and `schemas/widget.schema.json`, distributed with this document (JSON Schema draft 2020-12). Where this prose and the schema disagree, **the schema is normative for structure** and the prose is normative for meaning. `tome validate` runs exactly these files.

A manifest MAY carry a `$schema` key pointing at `manifest.schema.json`. It is ignored by players and validators, and exists so an author's editor can offer completion and inline errors.

The annotated example below is informal, for reading:

```jsonc
{
  "formatVersion": "1.0.0-rc.9",            // REQUIRED, semver, this spec's version
  "id": "com.example.linear-algebra-101",   // REQUIRED, reverse-DNS style, immutable for the life of the course
  "version": "1.3.0",                       // REQUIRED, semver of the course content
  "title": "Linear Algebra, Visually",      // REQUIRED, ≤ 120 chars
  "subtitle": "From arrows to eigenvalues", // OPTIONAL, ≤ 200 chars
  "description": "…",                       // REQUIRED, plain text or limited Markdown, ≤ 4000 chars
  "language": "en",                         // REQUIRED, BCP 47
  "authors": [                              // REQUIRED, ≥ 1
    { "name": "Jane Doe", "id": "author_8f2k" }
  ],
  "tags": ["math", "linear-algebra"],       // OPTIONAL, ≤ 10, lowercase kebab-case
  "level": "beginner",                      // OPTIONAL: beginner | intermediate | advanced
  "estimatedMinutes": 240,                  // OPTIONAL, integer
  "cover": "assets/images/cover.webp",      // REQUIRED, image, 3:4 aspect recommended
  "minPlayerVersion": "1.0.0",              // OPTIONAL, semver; player MUST refuse if older
  "structure": [                            // REQUIRED, ordered chapters
    {
      "id": "ch1",                          // REQUIRED, unique within manifest, ^[a-z0-9-]+$
      "title": "Vectors",                   // REQUIRED
      "lessons": [                          // REQUIRED, ordered paths into lessons/
        "lessons/01-intro.md",
        "lessons/02-vectors.md"
      ]
    }
  ],
  "contentHashes": {                        // REQUIRED, every file except manifest.json and signature.json
    "lessons/01-intro.md": "sha256:003a9be454c8dfac7dcec69357c6c0af118a8d6059c85dcd410d1a290711e7f0",
    "assets/images/cover.webp": "sha256:a7c537dca46cdc697736f6a79f632f62cf91fcc7fe78a600668d98166aa5bb98"
  },
  "bestOn": ["tablet", "desktop"],          // OPTIONAL: subset of phone | tablet | desktop. Informative hint, nothing is blocked
  "uses": ["microphone", "drawing"],        // OPTIONAL: device capabilities the course uses: microphone | drawing | audio (see §3.2)
  "accessibility": { "audioWithoutTranscript": false }, // OPTIONAL, see §9
  "license": "all-rights-reserved",         // OPTIONAL: SPDX id or "all-rights-reserved" (default)
  "assetsByAuthor": true,                   // OPTIONAL: every image, audio and video asset is the authors'
                                            // own work. Default false — see §3.3
  "credits": [                              // OPTIONAL: attribution per asset, see §3.3
    {
      "asset": "assets/images/mitosis.jpg", // REQUIRED, path within the bundle
      "title": "Onion root tip mitosis",    // OPTIONAL
      "creator": "A. Photographer",         // REQUIRED
      "source": "https://example.org/x",    // OPTIONAL, informative: never fetched
      "license": "CC BY-SA 4.0",            // OPTIONAL, SPDX id or a licence name
      "modified": "Cropped and relabelled"  // OPTIONAL
    }
  ],
  "changelog": "Fixed typos in chapter 2.", // OPTIONAL, shown to learners on update
  "issuedTo": {                             // ADDED BY THE STORE to a purchased copy, never by authors — see §3.4
    "order": "web_5ff8ec6d",                // REQUIRED: the order this copy was issued for
    "subject": "acct_8c1f02aa",             // REQUIRED: opaque id of the account (or anonymous install) that bought it
    "issuedAt": "2026-10-20T08:30:00Z",     // REQUIRED
    "name": "Ana"                           // OPTIONAL: a display name the buyer chose; never an email address
  }
}
```

### 3.2 Rules

- `uses` is derived by the validator from the content (`record` → `microphone`, `sketch` → `drawing`, any audio clip in a widget or `:::listening` → `audio`). Authors may list it explicitly; a manifest that omits a capability the content needs is an error, one that lists an unused capability is a warning.

- `id` MUST NOT change between versions of the same course. Changing it creates a new course.
- Every file in the archive (except `manifest.json` and `signature.json`) MUST have an entry in `contentHashes`, and every entry MUST correspond to an existing file. Players MUST verify hashes before rendering.
- Every lesson path in `structure` MUST exist; every `.md` file in `lessons/` SHOULD be referenced (validator warning otherwise).
- Lesson IDs are derived from the path: `lessons/02-vectors.md` → `02-vectors`. They MUST be unique across the course. Progress is keyed on `(courseId, lessonId)`, so **renaming a lesson file resets learner progress for it**. Authors SHOULD keep filenames stable.

### 3.3 Asset credit

Attribution is a legal and an ethical requirement, and a course that cannot be checked for it cannot be reviewed before sale. So the format makes authorship explicit rather than assumed:

- A manifest MUST either set `assetsByAuthor: true` — asserting that every image, audio and video asset is the authors' own work — or list a `credits` entry for each asset that is not.
- A `credits` entry MAY still appear when `assetsByAuthor` is true, for the few assets that are borrowed.
- `source` is informative only. Players MUST NOT fetch it (§8.2); it exists so a reader can find the original and a reviewer can check the claim.
- Where an asset is displayed, the player MUST make its credit reachable: inline with the figure (§5.4) or through a course-level credits view. Credit that only exists in the manifest and is never shown does not discharge the obligation.
- Sound and video assets follow the same rule as images. Instrument samples (§7.9) and the player's built-in sounds are the player's responsibility, not the course's.

A validator MUST report an uncredited asset (§11). It cannot know who made a picture — only that the author has not said.

<!-- not-on-site -->
### 3.4 Personal copies

A course bought from a store is issued as a **personal copy**: the store writes `issuedTo` into the manifest and signs the result (§4). Only the manifest changes; the lesson and asset files, and so `contentHashes`, are the same in every copy, which makes issuing one per purchase cheap.

What traces a copy is its **order**: it leads to a payment, which only the store can resolve and which is much harder to fake than an email address. A copy can end up public, so it MUST NOT carry personal data the buyer did not choose to put there: `subject` is an opaque id, and `name`, if present, is a display name the buyer opted into — never an email address (the schema refuses `@` in either).

Because the signature covers the manifest, `issuedTo` cannot be removed or altered without the copy failing verification. This is deliberately not copy protection. A course has to be readable offline and for as long as its owner lives, so it is not encrypted, and the format is open, so a player could be written to ignore the rules below. What a personal copy does is make every copy say whose it is — which is what stops nearly all casual sharing.

- `issuedTo` MUST NOT appear in a course's source. A validator MUST reject it there: in a source folder it means a bought copy is being republished.
- A store SHOULD issue every purchased download as a personal copy, and SHOULD NOT make its unpersonalised master copies downloadable.
- A player MUST make it visible to the owner that the copy is personal (the reference player: the library card and the end of each lesson show "your personal copy · order …", or the chosen name).
- A copy is the learner's own when `issuedTo.subject` is an account or install identity the player already knows, or the player holds an entitlement for the course. Either check MUST work offline from data on the device; a player MUST NOT need the network to open a course the learner owns.
- A player SHOULD open someone else's copy as a preview only: the first lesson, with a way to get one's own copy. It MAY install it, so that buying later unlocks it in place.
- A copy without `issuedTo` — a free course, an author's draft, an older bundle — opens as before.
- A player SHOULD refuse to open, even in developer mode, an unsigned bundle whose `id` is that of a store course the learner does not own: that is a personal copy with its stamp removed.
<!-- /not-on-site -->

---

## 4. Signature

`signature.json`:

```json
{
  "algorithm": "Ed25519",
  "keyId": "platform-2026-01",
  "signedAt": "2026-08-20T12:00:00Z",
  "manifestHash": "sha256:…",
  "signature": "base64…",
  "publicKey": "3c9319c1…"     // OPTIONAL, hex: the signer's public key (see below)
}
```

- `signature` is the Ed25519 signature over the raw bytes of `manifest.json`.
- Because the manifest contains hashes of all content, signing the manifest transitively signs the whole bundle.
- Players MUST verify the signature against pinned platform public keys before rendering. A course that verifies this way is a **store course**.
- **Courses from outside the store.** Anyone may share a course without a store. Such a bundle is either signed with its **author's own key** — the signature carries `publicKey`, and verifying against it proves the bundle is unchanged since the holder of that key signed it, though not who they are — or **unsigned**. A player MAY open either, but only after the learner explicitly agrees, and MUST then mark it persistently as not from the store wherever it appears (the reference player: a badge on the library card and a note on every lesson, showing the key's fingerprint for an author-signed course). A player MUST NOT treat an embedded `publicKey` as trusted, MUST check a signature that names a pinned `keyId` against the pinned key only, and MUST refuse a bundle that names a pinned `keyId` but does not verify with it. A course from outside the store MUST NOT replace a store course with the same `id` (§3.4).
- The fingerprint shown to learners is the first 16 hex digits of the SHA-256 of the public key, in groups of four.
<!-- not-on-site -->
- A store re-signs each personal copy when it issues it (§3.4); the signature is what makes `issuedTo` trustworthy.
<!-- /not-on-site -->
- Key rotation: players ship a list of valid `keyId`s; revoked keys are removed in player updates. Old bundles signed with still-valid keys continue to work — this is essential to the longevity promise.

---

## 5. Lessons

### 5.1 Encoding and front matter

Lessons are UTF-8 Markdown files. They MAY begin with a YAML front-matter block:

```md
---
title: Vectors as Arrows
estimatedMinutes: 12
---
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Displayed in navigation |
| `estimatedMinutes` | no | |
| `summary` | no | ≤ 300 chars |

### 5.2 Supported Markdown

Base syntax is **CommonMark 0.31** plus the following GFM extensions:

- Tables
- Strikethrough
- Task lists (rendered read-only)
- Autolinks (rendered as plain text for non-`https` schemes)

**Parsing order.** Math spans (§5.4) and inline code are recognised *before* table cell splitting, so a `|` inside `$…$` or backticks does not start a new cell. Authors who need to be safe with other tools MAY use `\lvert … \rvert` instead of `|` in math.

### 5.3 Explicitly unsupported / forbidden

Validators MUST reject lessons containing:

- Raw HTML blocks or inline HTML tags (`<div>`, `<script>`, `<img>`, …). Entity references like `&amp;` are allowed.
- Links or images whose destination is not (a) a relative path inside the bundle, (b) an `https://` URL, or (c) an internal `#anchor` / `lesson:` link (§5.6).
- `javascript:`, `data:`, `file:` or any other non-https URL schemes.
- Footnotes (deferred to a later version).

### 5.4 Math

- Inline: `$ … $`. Block: `$$ … $$` on its own lines.
- Dialect: **KaTeX-supported LaTeX** only. Players bundle KaTeX (or an equivalent renderer) and its fonts.
- `\def`, `\newcommand` and `\href` are NOT supported. Use `\renewcommand`-free, self-contained expressions.
- A literal dollar sign is written `\$`.

### 5.5 Images, video, audio

Images use standard Markdown syntax with a relative path:

```md
![A vector drawn from the origin](assets/images/vector-arrow.webp)
```

Alt text is REQUIRED for accessibility (validator error if missing).

Video and audio use block directives (§6):

```md
:::video src="assets/video/intro.mp4" poster="assets/images/intro-poster.webp"
Optional caption in Markdown.
:::
```

Attributes: `src` (required), `poster` (image, optional), `captions` (WebVTT file path, optional), `autoplay` (MUST be ignored if `audio` track present). Players MUST NOT autoplay with sound.

### 5.6 Internal links

- To another lesson: `[see the next lesson](lesson:03-dot-product)`
- To a heading in the same lesson: `[above](#definition)` — heading anchors are auto-generated as lowercase kebab-case of the heading text.
- To a heading in another lesson: `lesson:03-dot-product#projection`

Validators MUST check that targets exist.

---

## 6. Block Directives

Directives use the fenced `:::` syntax (compatible with the `remark-directive` / "generic directives" proposal).

```
:::name key="value" key2=123
(optional Markdown or JSON body)
:::
```

Rules:

- The opening fence is `:::` followed by a name matching `^[a-z][a-z0-9-]*$` and zero or more attributes.
- Attribute values are double-quoted strings, integers, floats or the bare words `true`/`false`.
- The body ends at a line containing only `:::`. Nesting is achieved by using more colons for the outer block (`::::`), as in container-directive convention.
- For directives with a **data body** (`widget`), the body is parsed as **YAML 1.2** (safe subset: no tags, no anchors/aliases, no custom types). JSON is valid YAML, so either style works. YAML block scalars (`|`) are the recommended way to write code, TeX and multi-line text without escaping.
- Unknown directive names MUST cause a validator error. Players encountering an unknown directive (e.g. from a newer spec) MUST render a visible placeholder ("This content requires a newer app version"), never silently drop it.

### 6.1 Built-in directives

| Name | Body | Purpose |
|---|---|---|
| `note`, `tip`, `warning`, `important` | Markdown | Callout boxes. Optional `title` attribute. |
| `video`, `audio` | Markdown caption | See §5.5 |
| `lottie` | — | `src` attribute. Attributes `loop` (bool, default true), `autoplay` (bool, default true) |
| `figure` | Markdown caption | Wraps an image with a numbered caption. Optional `credit` attribute (inline Markdown) shown under the caption — the shorthand for a one-off attribution, equivalent to a `credits` entry (§3.3) |
| `details` | Markdown | Collapsible section. `summary` attribute required. Also the idiomatic way to give a lesson-level hint: `:::details summary="Hint"` |
| `checkpoint` | Markdown (optional message) | Progress gate; lesson marked complete only after all checkpoints are passed (§7.4) |
| `widget` | YAML/JSON | Interactive widget, see §7 |
| `columns` | Markdown containing `::: column` children | Side-by-side layout; players MAY collapse to single column on narrow screens |
| `listening` | Markdown containing widgets and an optional `:::transcript` | A **listening group**: one clip shared by several widgets, see §6.2 |
| `transcript` | Markdown | Only valid inside `listening`. Dialogue: single newlines are rendered as line breaks |

### 6.2 Listening groups

"Listen, then answer several questions" is the core exercise of every language course. A listening group gives the questions one clip, one play limit and one transcript:

```md
::::listening src="assets/audio/dialogo-1.mp3" playLimit=2 speed="0.75,1"
:::transcript
— Buenos días, ¿qué desea?
— Un café con leche, por favor.
:::

:::widget type="multiple-choice" id="q1"
prompt: What does the customer order?
options:
  - text: A tea
  - text: A coffee with milk
    correct: true
  - text: An orange juice
:::

:::widget type="fill-blank" id="q2"
text: "The customer says *por {{favor}}* at the end."
:::
::::
```

Attributes: `src` (required, audio asset), `playLimit` (integer ≥ 1, optional), `speed` (comma-separated playback rates, optional). These are the scalar form of the Media object (§7.7).

Rules:

- The group MUST contain at least one widget. Widgets inside MUST NOT have their own `audio` (validator error). Groups do not nest.
- The play limit applies to the group and is per attempt: it resets when any widget in the group is answered wrong.
- The transcript is revealed once every widget in the group is complete. A group without a transcript produces a validator warning.
- Players render the clip once, above the widgets, and SHOULD visually bracket the group.


---

## 7. Widgets

A widget is a `:::widget` directive whose body is a YAML (or JSON) object.

```md
:::widget type="multiple-choice" id="q-dot-1"
prompt: What is $\vec a \cdot \vec b$ when the vectors are perpendicular?
options:
  - text: "0"
    correct: true
    explanation: Perpendicular vectors have zero projection onto each other.
  - text: "1"
  - text: $|\vec a||\vec b|$
    explanation: That is the maximum, reached when they are parallel.
shuffle: true
:::
```

Backslashes need no escaping in YAML plain scalars, which is why YAML is recommended for TeX-heavy and code-heavy widgets. Two YAML rules to remember:

- Quote a value that starts with a character YAML would otherwise interpret (`"0"`, `"- item"`, `"{…}"`), or that contains `: ` or ` #`.
- Inside **flow** style (`{…}` / `[…]`), commas separate items — so quote any value containing a comma, e.g. `label: "$(v_x, v_y)$"` or `expr: "atan2(vy, vx)"`. Block style has no such restriction.

The validator reports unexpected keys, which is the usual symptom of an unquoted comma.

### 7.1 Common attributes

| Attribute | Required | Notes |
|---|---|---|
| `type` | yes | One of the registered types (§7.3) |
| `id` | yes | `^[a-z0-9-]+$`, unique within the course. Learner state is keyed on `(courseId, widgetId)` — keep stable across versions |
| `ref` | — | **Reserved.** Shared widget bodies in `widgets/` were specified before any player implemented them; validators MUST reject `ref` in 1.0. Write the body inline |
| `required` | no | If `true`, the widget must be completed to pass the next checkpoint. Default `true` for graded widgets, `false` for exploratory ones |
| `audio` | no | *Media* (§7.7): a clip with its own player shown above the prompt. Allowed on every widget that has a `prompt`, and on `fill-blank`. For several questions about one clip use a listening group (§6.2) instead |

**Graded widgets** — every type that grades (§7.4) also accepts these, defined here rather than repeated in each entry of §7.3. In the schema they are the `graded` base; a type that does not grade MUST reject them.

| Attribute | Required | Notes |
|---|---|---|
| `hint` | no | Inline Markdown, shown after the first wrong attempt |
| `explanation` | no | Inline Markdown, shown on success and with a revealed solution — never after a wrong answer while the learner can still try, since it would give the answer away. A player MAY keep it behind a disclosure under the verdict (the reference player's "Why?"), but MUST make it reachable from the success state, including on a later visit. This is where the teaching goes — an empty `explanation` wastes the moment the learner is most receptive |
| `maxAttempts` | — | **Reserved**; validators MUST reject it. Its only meaning — locking an exercise after N tries — would block a checkpoint forever in a course with no teacher to unlock it. `solutionAfterAttempts` is the humane way to end a struggle |
| `solutionAfterAttempts` | no | Integer. After this many failures the player offers the answer. Default 3; `-1` never |

### 7.2 Strings inside widget bodies

Two kinds of Markdown strings appear in widget bodies:

- **Block Markdown** — `prompt` fields (every widget that has one). Paragraphs, lists, code blocks, tables and math blocks are allowed; directives are not. This lets an assignment contain its own example code and requirement list.
- **Inline Markdown** — every other human-readable field (`text`, `explanation`, `caption`, `label`, `front`/`back`, `hint`, `hints[]`, …): emphasis, code, math and links only.

**Item** — wherever the catalogue says *Item*, the author may write either an inline-Markdown string or an object:

```yaml
- text: "el pan"              # inline Markdown, required
  audio: assets/audio/pan.mp3 # optional Media
```

Item replaces plain strings in: `ordering.items[]`, `matching.pairs[].left|right`, `flashcards.cards[].front|back`. `multiple-choice` options keep `text` as a string and gain a sibling `audio` field. A player renders the audio as a small play button beside the text. Items are still compared by `text` for grading; audio never influences grading.

Audio on an Item or option needs no transcript — the text beside it is the transcript. The transcript warning (§7.7) applies to widget-level `audio`, `dictation.audio` and `record.model` only.


### 7.3 Widget catalogue

Fields marked • are required.

#### `multiple-choice`
| Field | Type | Notes |
|---|---|---|
| `prompt` • | string | |
| `options` • | array of `{ text•, correct?, explanation? }` | 2–8 options; ≥ 1 correct. An option's `explanation` says why *that option* is right or wrong: shown after the learner checks an answer that includes it (a wrong option's never names the right one), and for correct options together with the widget `explanation` |
| `multiple` | bool | Allow several answers (default false) |
| `shuffle` | bool | Default false |

Graded. Complete when the learner has submitted a fully correct answer (retries allowed unless `maxAttempts` is set).

#### `numeric-input`
| Field | Type | Notes |
|---|---|---|
| `prompt` • | string | |
| `answer` • | number | |
| `tolerance` | number | Absolute tolerance, default 0 |
| `relativeTolerance` | number | e.g. 0.01 = 1 % |
| `unit` | string | Displayed suffix |
| `hint` | string | Shown after first wrong attempt |

Graded.

#### `free-text`
| Field | Type | Notes |
|---|---|---|
| `prompt` • | string | |
| `grading` • | `"self"` \| `"keywords"` \| `"pattern"` | |
| `keywords` | array of strings | For `keywords`: all must appear (case-insensitive) |
| `pattern` | string | For `pattern`: a **RE2-compatible** regex (no backreferences/lookaround, to prevent catastrophic backtracking) |
| `modelAnswer` | string | Revealed after submission |

Graded (self-graded counts as complete on submission).

#### `fill-blank`
| Field | Type | Notes |
|---|---|---|
| `text` • | string | Blanks written as `{{answer|alt1|alt2}}` (text) or `{{=number}}` / `{{=number~tolerance}}` (numeric, e.g. `{{=1.414~0.01}}`) |
| `caseSensitive` | bool | Default false; applies to text blanks only |

Text blanks are compared after trimming whitespace. Numeric blanks accept any decimal representation within the tolerance (default tolerance 0). Players MUST parse `text` as inline Markdown *before* substituting blanks, so emphasis and other inline spans may contain a blank (`*¿Algo {{más}}?*`).

Graded.

#### `ordering`
| Field | Type | Notes |
|---|---|---|
| `prompt` • | string | |
| `items` • | array of strings | Given in correct order; player shuffles |

Graded. Correct order is **the order `items` is written in** — the player shuffles the *display* order and grades against the authored order, by item position, not by comparing text.

#### `matching`
| Field | Type | Notes |
|---|---|---|
| `prompt` • | string | |
| `pairs` • | array of `{ left•, right• }` | 2–10 pairs |

Graded. A pair is correct when the learner connects the left item to the right item it is paired with **by position in `pairs`** — the player never compares the text of `left` and `right`, so two pairs may share identical text on one side without becoming interchangeable.

#### `slider-explore`
| Field | Type | Notes |
|---|---|---|
| `params` • | array of `{ name•, min•, max•, step, default, label }` | Names are identifiers `^[a-zA-Z_][a-zA-Z0-9_]*$`. `value` is accepted as a synonym of `default` |
| `plot` | Same shape as the `plot` widget | `series` (each `{ expr \| points, label?, style? }`), `x`, `y`, `samples`, `axes`, `caption`. `expr` is accepted as sugar for a single series. Expressions may reference `x` and the params (§7.5) |
| `outputs` | array of `{ label•, expr•, precision?, suffix? }` | Live computed values displayed beside the sliders. `precision` = decimals (default 2); `suffix` e.g. `"°"`, `" m/s"` |
| `geometry` | *Scene* (see `geometry`) | A 2-D scene whose coordinates may reference the params |
| `caption` | string | |

At least one of `plot`, `outputs`, `geometry` is required. Exploratory (not graded).

#### `geometry`

A declarative 2-D drawing: points, vectors, segments, circles, polygons and labels on a coordinate plane. All numeric fields are **expressions** (§7.5), so they MAY reference `params` — either the widget's own or, when embedded inside `slider-explore`, that widget's sliders.

| Field | Type | Notes |
|---|---|---|
| `view` • | `{ x•: [min,max], y•: [min,max], grid?, axes?, aspect? }` | `grid`/`axes` booleans (default true); `aspect` `"equal"` (default) or `"auto"` |
| `params` | as in `slider-explore` | Own sliders (omit when nested in `slider-explore`) |
| `shapes` • | array of *Shape* | Drawn in order |
| `caption` | string | |

**Shape** — `kind` is required; all coordinates are expressions.

| `kind` | Fields | Notes |
|---|---|---|
| `point` | `at•: [x,y]`, `label?`, `bind?: [px, py]`, `color?` | A point with `bind` is **draggable**: dragging writes its coordinates (snapped to each param's `step` and clamped to its range) into the two named params |
| `vector` | `from?: [x,y]` (default origin), `to•: [x,y]`, `label?`, `color?`, `dashed?` | Arrow |
| `segment` | `from•`, `to•`, `label?`, `color?`, `dashed?` | |
| `line` | `through•: [x,y]`, `direction•: [dx,dy]`, `color?`, `dashed?` | Infinite line |
| `circle` | `center•`, `radius•`, `color?`, `fill?` | |
| `polygon` | `points•: [[x,y],…]`, `color?`, `fill?` | Closed |
| `arc` | `center•`, `radius•`, `from•` (deg), `to•` (deg), `label?`, `color?` | For marking angles |
| `text` | `at•`, `text•`, `color?` | `text` is inline Markdown |

`color` is one of a small named palette (`primary`, `secondary`, `accent`, `muted`, `red`, `green`, `blue`, `orange`) so courses look consistent and honour dark mode. `fill` is a number 0–1 (opacity of the fill).

Exploratory (not graded). Every name in a `bind` MUST refer to an existing param (the widget's own, or the enclosing `slider-explore`'s). A draggable point and a slider bound to the same param stay in sync.

```md
:::widget type="slider-explore" id="explore-vector"
params:
  - { name: vx, min: -5, max: 5, step: 0.5, default: 3, label: $v_x$ }
  - { name: vy, min: -5, max: 5, step: 0.5, default: 4, label: $v_y$ }
geometry:
  view: { x: [-5, 5], y: [-5, 5] }
  shapes:
    - { kind: vector, to: [vx, vy], label: $\vec v$, color: primary }
    - { kind: segment, from: [0, 0], to: [vx, 0], dashed: true, color: muted }
    - { kind: segment, from: [vx, 0], to: [vx, vy], dashed: true, color: muted }
    - { kind: point, at: [vx, vy], bind: [vx, vy] }   # draggable tip
outputs:
  - { label: Length, expr: sqrt(vx^2 + vy^2) }
:::
```

#### `plot`
| Field | Type | Notes |
|---|---|---|
| `series` • | array of `{ expr?, points?, label?, style? }` | Either `expr` (function of `x`) or `points` (array of `[x,y]`) |
| `x` • | `[min, max]` or `{ labels: [...] }` | Numeric range, or a categorical axis: `points[][0]` is then an index into `labels` (years, countries, weekdays…) |
| `y` | `[min, max]` | Auto if omitted |
| `series[].style` | `line` \| `dashed` \| `dots` \| `bars` \| `area` | Default `line` |
| `axes` | `{ xLabel?, yLabel?, grid? }` | |
| `caption`, `source` | inline Markdown | Caption under the chart; `source` is an attribution line |
| `description` | string | Text alternative, see §7.11 |

Exploratory.

#### `code-exercise`

An in-lesson programming environment: a code editor, an output console, a **Run** button and a **Submit** button. See §7.6 for full semantics.

| Field | Type | Notes |
|---|---|---|
| `language` • | `"python"` \| `"javascript"` | Players ship a WASM sandbox per language (§8.4). Adding a language requires a player release, not a spec change |
| `prompt` • | string | The assignment, **block** Markdown (§7.2): may contain code blocks, lists and tables |
| `starterCode` | string | Initial editor contents |
| `files` | — | **Reserved** for multi-file exercises in a future minor version; validators MUST reject it in 1.0. Use a single `starterCode` |
| `stdin` | string | Fed to the program on **Run** (not on Submit — tests control their own input) |
| `grading` | `"tests"` \| `"output"` | Default `"tests"` |
| `tests` | array of *Test* (below) | Required when `grading` is `"tests"` |
| `cases` | array of *Case* (below) | Required when `grading` is `"output"`; each case is one stdin/expected-output pair |
| `outputMatch` | `"exact"` \| `"trimmed"` \| `"lines"` | For `"output"` grading, see §7.6.3. Default `"trimmed"` |
| `solution` | string | Reference solution |
| `solutionAfterAttempts` | integer | Number of failed submits before "Show solution" appears. Default 3 for `"tests"`, 2 for `"output"`; `0` = always available; `-1` = never |
| `hints` | array of strings | Revealed one at a time, in order, on request |
| `limits` | `{ timeoutMs?, memoryMb? }` | Defaults 5 000 ms / 128 MB; hard-capped by the player at 10 000 ms / 256 MB |
| `resetable` | bool | Show a "Reset to starter code" action. Default true |

**Test object**

| Field | Type | Notes |
|---|---|---|
| `name` • | string | Shown to the learner in the results list (even for hidden tests, the name is shown; only the code and failure detail are withheld) |
| `code` • | string | Test code in the same language. A test **passes** if it runs to completion without raising/throwing; it **fails** otherwise |
| `hidden` | bool | If true, the test's code and failure message are not shown; the learner sees only pass/fail. Default false |
| `stdin` | string | Input provided while this test runs |
| `timeoutMs` | integer | Per-test override, ≤ `limits.timeoutMs` |

**Case object** (output grading)

| Field | Type | Notes |
|---|---|---|
| `name` | string | Shown in the results list. Default "Case N" |
| `stdin` | string | Input for this run. Default empty |
| `expectedOutput` • | string | Expected stdout |
| `hidden` | bool | If true, stdin and expected output are not shown on failure. Default false |

Graded. Complete when a **Submit** passes all tests (or all cases, for `"output"` grading).

#### `flashcards`
| Field | Type | Notes |
|---|---|---|
| `cards` • | array of `{ front•, back• }` | `front` and `back` are Items (§7.2) |
| `spaced` | bool | Opt into spaced review, below. Default `false`: the deck is browsed |
| `shuffle` | bool | Present the cards in a new random order on each visit. Default `false` |

Exploratory: a deck never blocks a checkpoint.

**Spaced review.** With `spaced: true` the player presents the deck as a review session rather than a browsable stack: the learner turns a card, then grades their own recall as *again*, *hard* or *good*, and the player schedules when that card returns. Requirements:

- Each grade control MUST say when the card will return ("this session", "1 day"), so the learner can see the consequence of the choice.
- *Again* returns the card later in the same session. A learner who is away for any length of time MUST find their overdue cards simply due, without loss or penalty.
- The schedule is learner progress (§7.4): it is stored locally, synced with the rest of their progress, and reset with it. It MUST be stored per card, not per deck, so that two devices reviewing different cards offline do not overwrite each other.
- A card's identity is its `front`. Reordering or inserting cards keeps every learner's schedule; changing a card's `front` makes it a new card.
- Players SHOULD offer a course-level review gathering due cards from every spaced deck — and MUST include only cards the learner has already met in a lesson, so that review never presents material before the lesson that teaches it.
- Browsing a spaced deck, or practising it outside the schedule, MUST NOT change the schedule.

The scheduling algorithm is the player's choice. The reference player uses Leitner boxes (1, 3, 7, 16 and 35 days) because a learner can understand them and they recover gracefully from long breaks.

#### `diagram`

**Reserved, not implemented.** A Mermaid subset (flowchart, sequence, class, state) was specified in 0.2 and never built: no sample course needed one — processes were better served by `ordering`, structures by `hotspot` — and Mermaid is a large dependency whose HTML-label features would each need locking down under §8.

The type name is reserved so that a future player can add it as a minor version. Until then a validator MUST reject `type: diagram`, and authors should use `figure` with an SVG asset.

#### `dictation`

Listen and type what you hear.

| Field | Type | Notes |
|---|---|---|
| `audio` • | Media | The clip. `transcriptAfter` defaults to `complete` |
| `answer` • | string | The expected text, plain |
| `alternatives` | array of strings | Other accepted texts (e.g. with/without contraction) |
| `prompt` | block Markdown | Optional framing ("Write the second sentence only") |
| `ignoreCase` | bool | Default true |
| `ignorePunctuation` | bool | Default true. Strips `.,;:!?¿¡"'()-—` and collapses whitespace |
| `ignoreAccents` | bool | Default **false** — accents are meaning-bearing in most target languages. Set true for beginners |
| `hint` | inline Markdown | Shown after the first wrong attempt |

**Grading.** Both the learner's text and each accepted text are normalised per the flags (NFC first, then the flags). The widget is complete when the learner's text equals one of them. On a wrong attempt the player MUST show a word-level diff: matched words, missing words, and extra words, so the learner knows which word to listen for. The expected text itself is not revealed until complete.

Graded.

#### `record`

Speak; compare yourself with a model.

| Field | Type | Notes |
|---|---|---|
| `prompt` • | block Markdown | What to say |
| `model` | Media | A reference recording the learner can play before and after |
| `maxSeconds` | integer | Default 30, max 120 |
| `rubric` | array of inline Markdown | Self-check items, e.g. "I pronounced the *rr* as a trill" |
| `grading` | `"self"` | The only value in 0.3. Reserved for future pronunciation scoring |

**Flow.** Record → play back (and play the model) → tick the rubric → "Done". Complete when a recording exists and "Done" is pressed; the rubric is not enforced. The recording is stored as a learner attachment (§7.4). Re-recording replaces it.

**Without a microphone.** If permission is denied or no device exists, the player MUST still let the learner complete the widget by listening to the model and pressing "Done", and SHOULD say why. A course must remain completable on any device.

Graded (self).

#### `sketch`

Draw on a canvas.

| Field | Type | Notes |
|---|---|---|
| `prompt` • | block Markdown | |
| `canvas` | `{ width, height }` | Logical pixels, default 800 × 600, max 2048 per side. The drawing is stored at this resolution regardless of screen size |
| `reference` | image path | Shown beside (or above, on narrow screens) the canvas the whole time — the thing to draw |
| `trace` | image path | Shown faded *under* the canvas for tracing; the learner can toggle it. Same dimensions as `canvas` or it is letterboxed |
| `traceOpacity` | number 0–1 | Default 0.3 |
| `model` | image path | The instructor's version, revealed after "Done" **beside the learner's drawing at the same size** (stacked, learner's first, below 860 px) |
| `tools` | array | Subset of `pen`, `eraser`, `fill`. Default `[pen, eraser]` |
| `palette` | array of colours | CSS hex. Default a 6-colour neutral set. The first is the initial colour |
| `widths` | array of numbers | Stroke widths offered. Default `[2, 5, 10]` |
| `pressure` | bool | Use stylus pressure for width, default true. Finger and mouse get a constant width |
| `rubric` | array of inline Markdown | Self-check items shown with the model |
| `minStrokes` | integer | "Done" is disabled below this many strokes. Default 1 |
| `grading` | `"self"` | Only value in 0.3 |

**Stored state.** A PNG at canvas resolution plus the stroke list (`[{ color, width, points: [[x, y, p], …] }]`) so a future player can re-render or continue. Both are learner attachments (§7.4).

**Tracing is a crutch, deliberately.** There is no automatic tracing score. Comparing with the model and the rubric is the feedback loop; the widget is about looking, not matching pixels.

Graded (self).

#### `board`

A grid position with a question: find the square, make the move.

| Field | Type | Notes |
|---|---|---|
| `prompt` • | block Markdown | |
| `rows` •, `cols` • | integer 1–19 | |
| `grid` | `"squares"` \| `"intersections"` | Pieces sit on squares (chess, checkers) or on line intersections (go). Default squares |
| `theme` | `"checkered"` \| `"plain"` \| `"wood"` | Default checkered for squares, wood for intersections |
| `coordinates` | `"algebraic"` \| `"none"` | Algebraic: files a… from the left, ranks 1… from the bottom. Default algebraic |
| `orientation` | `"normal"` \| `"flipped"` | Flipped shows rank 1 at the top (Black's view) |
| `pieces` • | array of Piece | |
| `answer` • | Answer | See below |
| `marks` | array of `{ at, kind }` | Static highlights: `circle`, `square`, `arrow` (with `to`). For teaching diagrams |
| `explanation` | inline Markdown | Shown when complete |
| `hint` | inline Markdown | After the first wrong attempt |
| `solutionAfterAttempts` | integer | Default 3; `-1` never |

**Piece** — `{ at•, glyph• | sprite•, color? }`. `at` is algebraic (`"e4"`) or `[row, col]` zero-based from the top-left. `glyph` is a single Unicode character (chess: ♔♕♖♗♘♙ ♚♛♜♝♞♟; go: ● ○; checkers: ⛀⛂); `sprite` is an image asset. `color` tints the glyph.

The board MUST be operable without a pointer: one tab stop for the whole board, arrow keys to move in screen directions (so a `flipped` board still behaves naturally), Enter or Space to act on the square. Each square's accessible name MUST include its coordinate and any piece on it.

**Answer** — one of:

- `{ kind: square, accept: ["e5"] }` — click a square. Any listed square is correct.
- `{ kind: squares, accept: ["c3", "e3"] }` — select all listed squares, then Check.
- `{ kind: move, accept: ["e2e4", "e2-e4"] }` — click a piece, then a destination. Either notation; promotion suffix `e7e8q` allowed and ignored for display.

No rules engine: the widget does not know how a knight moves. The author lists the accepted answers; that is what makes one widget cover chess, go, checkers, Sudoku-style "which cell" questions and even "which country on this grid map". Variants of a move that an engine would consider equal (different move orders) must be listed explicitly.

After a correct `move` the player MUST show the piece on its destination. On a failed `squares` check the selection is kept so the learner can adjust it.

Graded. Complete on an accepted answer.

#### `score`

Display notation; optionally play it; optionally ask a question about it.

| Field | Type | Notes |
|---|---|---|
| `abc` • | string | Notation, §7.8 |
| `prompt` | block Markdown | |
| `play` | bool | Show a play button. Default `true` |
| `tempo` | integer 30–240 | Playback tempo in bpm; overrides `Q:` |
| `tempoRange` | `[min, max]` | Offer a tempo slider between these values |
| `transpose` | integer −12…12 | Render and play transposed by semitones |
| `highlight` | array of `{ from, to, label? }` | Bar ranges (1-based, inclusive) marked in the score, for "look at bars 3–4" |
| `follow` | bool | Highlight each note as it plays. Default `true` when `play` |
| `instrument` | Instrument | §7.9 |
| `answer` | Answer | Optional; without it the widget is exploratory, not graded |
| `explanation`, `hint` | inline Markdown | |
| `solutionAfterAttempts` | integer | Default 3; `-1` never |

**Answer** — one of:

- `{ kind: note, accept: ["3:2"] }` — click a note. Addressed as `bar:index`, both 1-based, index counting notes (not rests) in that bar. Any listed note is correct.
- `{ kind: notes, accept: [...] }` — select several, then Check.
- `{ kind: bar, accept: [4] }` — click a bar.
- `{ kind: text, accept: ["G major", "G"] }` — a short typed answer, compared case-insensitively after trimming (for "what key is this?").

A `score` without `answer` is exploratory: it does not count toward a checkpoint (§7.4).

Graded when `answer` is present.

#### `keyboard`

A piano as an answer surface.

| Field | Type | Notes |
|---|---|---|
| `prompt` • | block Markdown | |
| `range` | `[low, high]` | Scientific pitch, default `[C4, C6]`. At most 3 octaves |
| `labels` | `none` \| `c-only` \| `all` | Key names printed on the keys. Default `c-only` |
| `answer` • | `{ kind, accept }` | `kind: keys` — the set of notes to press (order-free), e.g. `["A4","C5","E5"]`. `kind: sequence` — notes in order, e.g. a scale. `accept` may list several acceptable sets, each an array |
| `given` | array of notes | Pre-pressed keys shown as context ("here is the root") |
| `showAnswerAs` | `keys` \| `score` \| `both` | How the solution is revealed. Default `keys` |
| `octaveTolerant` | bool | Accept the right pitch classes in any octave. Default `false` |
| `instrument` | Instrument | §7.9 |
| `hint`, `explanation` | inline Markdown | |
| `solutionAfterAttempts` | integer | Default 3 |

The keyboard MUST be operable without a pointer: one tab stop for the whole instrument, arrow keys to move between keys in pitch order, Enter or Space to press. Each key's accessible name MUST include its pitch and whether it is pressed.

Pressing a key always sounds it, whether or not the answer is right — the point is to connect the name, the position and the sound.

With `kind: sequence`, the player MUST reject at the **first** wrong note rather than at the end of the sequence, and say which position failed. Changing tempo (in `score`) MUST stop playback, or the follow-highlight drifts out of sync with the sound.

Graded.

#### `hotspot`

Regions on an image, clicked or labelled.

| Field | Type | Notes |
|---|---|---|
| `image` • | image path | The diagram or photograph |
| `alt` • | string | Description of the whole image, for screen readers |
| `prompt` • | block Markdown | |
| `regions` • | array of Region | The clickable areas |
| `answer` | Answer | See below. Optional: without it the widget is an **annotated image** (below) |
| `showLabels` | `never` \| `after` \| `always` | When region names are drawn on the image. Default `after` (once complete) |
| `outline` | `always` \| `hover` \| `never` | When region shapes are visible. Default `hover`; `always` suits a labelling exercise, `never` a "find it" exercise |
| `hint`, `explanation` | inline Markdown | |
| `solutionAfterAttempts` | integer | Default 3; `-1` never |

**Region** — `{ id•, label•, shape•, at•, description? }`

- `id` — referenced by `answer`; unique within the widget.
- `label` — inline Markdown, shown as the answer/label text.
- `shape` — `circle`, `rect` or `polygon`.
- `at` — coordinates in **percentages of the image box**, so the widget is resolution-independent: circle `[cx, cy, r]`, rect `[x, y, w, h]`, polygon `[x1, y1, x2, y2, …]` (at least 3 points).
- `description` — optional longer text revealed with the label; this is where the teaching goes.

**Answer** — one of:

- `{ kind: click, accept: ["mitochondrion"] }` — click the right region.
- `{ kind: clicks, accept: [...] }` — select several, then Check.
- `{ kind: label }` — place every label on its region. Complete when all regions are correctly labelled. **Tap-then-tap is the required interaction** (tap a label to pick it up, tap a region to place it): it works with a mouse, on touch and by keyboard, and the held label is visible state. Drag-and-drop MAY be offered in addition, never instead.

**Without `answer`** the widget is an annotated image, not an exercise: every region is outlined, and choosing one shows its `label` on the image and its `description` below. It is not graded and never blocks a checkpoint. This is the form for detailed source material — a tablet, a manuscript, a map — where the point is to look closely with guidance, not to be tested.

Accessibility: every region MUST be reachable by keyboard as a button named by its `label` (for `kind: label`, named by its position in the image using `description` if given), and the widget MUST expose `alt` for the image itself. A labelling exercise that can only be completed by dragging with a mouse is not acceptable.

Graded.
#### `table-input`

A grid the learner fills in.

| Field | Type | Notes |
|---|---|---|
| `prompt` • | block Markdown | |
| `columns` • | array of inline Markdown | Column headers |
| `rows` | array of inline Markdown | Row headers. Omit for a table with no row labels |
| `cells` • | 2-D array of Cell | `cells[row][col]`. Length must match `rows` × `columns` |
| `caption` | inline Markdown | Rendered as the table caption |
| `mode` | `type` \| `choose` | `type`: free text/number entry. `choose`: every blank cell offers the same set of `options`. Default `type` |
| `options` | array of strings | Required when `mode: choose`; the palette of allowed values |
| `hint`, `explanation` | inline Markdown | |
| `solutionAfterAttempts` | integer | Default 3; `-1` never |

**Cell** — one of:

- a string — a **given** cell, shown and not editable (headers inside the body, worked examples).
- `{ answer•, tolerance?, alternatives?, unit? }` — a **blank** the learner fills. Numeric when `answer` is a number (compared within `tolerance`, default 0); otherwise text, compared after trimming, case-insensitively.
- `null` — a blank cell that is never graded (spacer).

Grading is all-or-nothing on Check, but the player MUST mark each cell individually so the learner sees *which* cells are wrong, and MUST NOT clear correct cells on a failed attempt.

Graded.

#### `molecule`

| Field | Type | Notes |
|---|---|---|
| `smiles` | string | Structure, §7.10. Required unless `reaction` is given |
| `name` | inline Markdown | Displayed as a caption |
| `prompt` | block Markdown | |
| `reaction` | string | A SMILES reaction (`reactants>>products`, multiple species separated by `.`) rendered as an equation instead of a single structure. Exactly one of `smiles` or `reaction` is required; a reaction has no clickable atoms |
| `showFormula` | bool | Show the molecular formula under the structure. Default `false` |
| `highlight` | array of integers | Atom indices marked in the drawing, for "look at this group" |
| `answer` | Answer | Optional; without it the widget is exploratory |

**Answer** — one of:

- `{ kind: atom, accept: [7] }` — click an atom.
- `{ kind: atoms, accept: [7, 8, 9] }` — select several, then Check.
- `{ kind: text, accept: ["carboxyl", "carboxylic acid"] }` — short typed answer, compared case-insensitively after trimming.

Every atom MUST be a keyboard-reachable target of at least 24 × 24 CSS px, named by its element and index, exactly as notes are in `score` (§7.3 score).

Graded when `answer` is present.
#### `simulation`

A model that runs.

| Field | Type | Notes |
|---|---|---|
| `prompt` • | block Markdown | |
| `state` • | map of name → number | Initial values. Names follow §7.5 identifier rules. `t` is reserved: the player supplies the model clock |
| `step` • | map of name → expression | Applied every tick. All right-hand sides are evaluated against the *previous* state, so order does not matter |
| `dt` | number | Model time per tick. Default `0.05`. A `param` named `dt` overrides it, so the time step can be a slider |
| `params` | array of Param | Sliders the learner can move while it runs: `{ name•, label, min•, max•, step, value }`. `default` is accepted as a synonym of `value`, since `slider-explore` spells it that way; players MUST accept both and authors SHOULD prefer `value` |
| `stopWhen` | expression | Boolean; the run halts when it becomes true |
| `readouts` | array of `{ label•, expr•, precision?, unit? }` | Live numeric values |
| `trace` | `{ x•, series•, y? }` | Plot state over time. `series` is a list of `{ expr•, label? }` |
| `scene` | `{ viewBox?, shapes• }` | Shapes whose geometry is bound to expressions, drawn every frame |
| `autoplay` | bool | Default `false`. Players MUST NOT autoplay a simulation with sound |
| `description` | string | Text alternative, see §7.11 |
| `answer` | `{ kind: text \| numeric, accept?, answer?, tolerance? }` | Optional question about the model's behaviour |

**Shape** — `{ kind•, … }` where `kind` is `circle` (`cx`, `cy`, `r`), `rect` (`x`, `y`, `w`, `h`), `line` (`x1`, `y1`, `x2`, `y2`) or `text` (`x`, `y`, `text`). Every geometric field is an expression over state, params and `t`. A shape may carry `repeat: n` (integer or expression, ≤ 400), which draws it `n` times with the variable `i` bound to `0 … n−1` — this is how you draw particles, molecules or a population without writing a loop.

**Determinism.** `step` expressions use only the §7.5 whitelisted functions. `random()` is **not** available: a simulation must produce the same numbers on every device, or the answer to a question about it is not the same for two learners. Randomness that an author wants must be written as an explicit formula (e.g. a hash-like expression of `i`).

**Controls.** Players MUST provide play/pause, reset, and a visible model clock; the learner MUST be able to move `params` while paused and see the effect on the next step.

**Budget.** At most 20 state variables, 20 shapes before `repeat`, 4000 shape instances after it, and 60 ticks per second. A player MUST cap the wall-clock cost of a tick and pause with a message rather than freezing the page.

Graded when `answer` is present.

### 7.4 Grading and completion semantics

- A widget is **graded** if its type grades by default, except that `score`, `molecule`, `simulation` and `hotspot` are graded only when they carry an `answer`; without one they are illustrations and never block a checkpoint. `required` overrides this either way (§7.1).
- A lesson is **complete** when the learner has reached the end of the lesson and every `checkpoint` before the end has been passed.
- A checkpoint is **passed** when every `required` widget between the previous checkpoint (or lesson start) and it is complete.
- A lesson without checkpoints is complete when scrolled to the end.
- Players MUST store widget state locally and SHOULD sync it when online. The format of stored state is player-defined but MUST be keyed on `(courseId, widgetId)`.

Widget state may include **attachments**: binary files produced by the learner (`record` audio, `sketch` PNG). Rules:

- Keyed `(courseId, widgetId, name)`; `name` is player-defined per widget type (`recording`, `image`, `strokes`).
- Limits: 4 MiB per attachment, 64 MiB per course. Players MUST re-encode to stay within them (Opus for audio, PNG for images).
- Stored locally first, like all state. Sync is optional and MUST be opt-in per course, because recordings are personal.
- The learner MUST be able to export (share sheet / download) and delete any attachment from the widget itself.
- Attachments are never sent to the author or to other learners by the platform.

### 7.5 Expression language

Used by `slider-explore`, `plot` and future widgets. It is a deliberately small, side-effect-free language:

- Literals: decimal numbers, `pi`, `e`.
- Operators: `+ - * / ^ %`, unary minus, parentheses.
- Comparison producing 0/1: `< <= > >= == !=`.
- Functions: `sin cos tan asin acos atan atan2 sinh cosh tanh exp log log10 log2 sqrt abs floor ceil round min max clamp sign step`.
- Conditional: `if(cond, a, b)`.
- Variables: `x` plus declared param names.

There are no strings, assignments, loops, or user-defined functions. Implementations MUST NOT evaluate expressions with a host-language `eval`. Division by zero yields `NaN`; players render gaps for non-finite values.

### 7.6 Code-exercise semantics

#### 7.6.1 User interface
Players MUST provide at minimum:

- An **editor** with syntax highlighting for the declared language and a monospace font.
- A **console** showing stdout and stderr (visually distinguished), plus runtime errors and the exit status.
- A **Run** action and a **Submit** action.
- A **Reset** action (unless `resetable` is false), a **Hint** action (if `hints` present) and a **Show solution** action (per `solutionAfterAttempts`).

On narrow screens players MAY stack editor and console vertically or use tabs; the editor SHOULD remain usable on a phone keyboard (e.g. an accessory bar with `Tab`, brackets, quotes).

#### 7.6.2 Run
1. Take the current editor contents (all files, if `files` is used).
2. Execute the entry point in a fresh sandbox (§8.4) with `stdin` attached.
3. Stream stdout/stderr to the console as they are produced.
4. On completion, show the exit status and elapsed time. On timeout or memory limit, show a clear message naming the limit.

Run never affects grading. Learners may Run any number of times.

#### 7.6.3 Submit
For `grading: "tests"`:

1. For **each** test, in order, start a **fresh** sandbox. Run the learner's entry point with the test's `stdin` attached, capturing its stdout. Then execute the test code in the same interpreter scope, so tests can call the learner's functions **and** inspect what the program printed via the pre-defined variable `__stdout__` (a string).
2. Record pass/fail, captured output and, on failure, the error message.
3. Present a results list: test name and ✔/✘ for every test. For non-hidden failed tests, show the error message and the test code; for hidden ones, show only "Hidden test failed".
4. If all tests pass, mark the widget complete and record the submission. Otherwise increment the failed-attempt counter (used by `solutionAfterAttempts`).

For `grading: "output"`:

1. For each case, run the learner's code in a fresh sandbox with the case's `stdin`.
2. Compare stdout with the case's `expectedOutput` using `outputMatch`:
   - `exact` — byte-for-byte equality.
   - `trimmed` — both sides have leading and trailing whitespace (including the final newline) removed, and `\r\n` normalised to `\n`; then exact equality.
   - `lines` — as `trimmed`, then each line has leading/trailing whitespace removed and internal runs of whitespace collapsed to one space; then line-by-line equality.
3. On mismatch for a non-hidden case, show a diff of expected vs. actual. For a hidden case show only "Hidden case failed".

Submitting while a Run is in progress MUST cancel it. Learner code state MUST be persisted locally after each Run/Submit so work is not lost across sessions, keyed on `(courseId, widgetId)`.

#### 7.6.4 Test authoring conventions
- Players MUST pre-define a small helper in the test scope: Python `assert_equal(actual, expected, message=None)`, JavaScript `assertEqual(actual, expected, message)`. It fails with a message that shows both values, which is more useful to learners than a bare `AssertionError`. Plain `assert` / `throw` remain valid.
- Tests can check program output via `__stdout__`, e.g. `assert_equal(__stdout__.strip().splitlines()[-1], "42")`.
- Because each test runs in a fresh sandbox, tests MUST NOT depend on each other's side effects.
- Tests SHOULD give the learner useful failure messages (e.g. `assert add(2,3) == 5, f"add(2,3) returned {add(2,3)}"`), and hidden tests SHOULD exist to discourage hard-coding the visible cases.

#### 7.6.5 Language runtimes (informative)
| Language | Reference runtime | Notes |
|---|---|---|
| `python` | CPython 3.x compiled to WebAssembly (e.g. Pyodide) | Standard library available; third-party packages only if the player bundles them. Players MUST document which packages are available per player version |
| `javascript` | QuickJS (or equivalent) in WebAssembly | ES2020; no DOM, no Node APIs |

Runtimes are shipped with the player and loaded lazily on first use. They MUST be available offline after the first load. Future versions of this spec may add languages (e.g. `go`, `rust`, `c`) once suitable WASM toolchains are selected.

#### 7.6.6 Example

````md
:::widget type="code-exercise" id="ex-fizzbuzz"
language: python
prompt: |
  Write a function `fizzbuzz(n)` that returns:

  - `"Fizz"` for multiples of 3,
  - `"Buzz"` for multiples of 5,
  - `"FizzBuzz"` for multiples of both,
  - the number as a string otherwise.

  The starter code prints `fizzbuzz(i)` for 1 to 15 so you can check with **Run**.
starterCode: |
  def fizzbuzz(n):
      # your code here
      pass

  for i in range(1, 16):
      print(fizzbuzz(i))
tests:
  - name: Multiples of 3
    code: |
      assert_equal(fizzbuzz(3), "Fizz")
      assert_equal(fizzbuzz(9), "Fizz")
  - name: Multiples of 5
    code: assert_equal(fizzbuzz(5), "Buzz")
  - name: Multiples of both
    code: assert_equal(fizzbuzz(15), "FizzBuzz")
  - name: Other numbers
    code: assert_equal(fizzbuzz(7), "7")
  - name: Program prints 15 lines
    code: assert_equal(len(__stdout__.strip().splitlines()), 15)
  - name: Large inputs
    hidden: true
    code: |
      assert_equal(fizzbuzz(3000), "FizzBuzz")
      assert_equal(fizzbuzz(3001), "3001")
hints:
  - Check for divisibility by 15 first.
  - "Use the `%` operator: `n % 3 == 0`."
solutionAfterAttempts: 3
:::
````

---

### 7.7 Media object

```yaml
audio:
  src: assets/audio/cafe-01.mp3   # required; must be an audio asset in the bundle
  transcript: |                   # optional, inline Markdown. See transcriptAfter
    — Hola, ¿qué te pongo?
    — Un café con leche, por favor.
  transcriptAfter: complete       # always | complete | never. Default complete
  playLimit: 2                    # optional, ≥ 1. Omit for unlimited
  speed: [0.75, 1]                # optional, playback rates offered. Default [1]
```

The shorthand `audio: assets/audio/cafe-01.mp3` equals `{ src: … }`.

Rules:

- `transcriptAfter: complete` shows the transcript once the enclosing widget is complete (or, for a checkpoint-less use, once the learner has pressed "Show transcript" after the play limit is exhausted). This is the listening-comprehension default: the learner cannot read along before answering, but can afterwards.
- `playLimit` is enforced per *attempt*: it resets when the learner's answer is marked wrong and they try again. Players MUST show remaining plays.
- A transcript is strongly RECOMMENDED for every clip (accessibility, §9). The validator warns when it is missing.
- Players MUST NOT autoplay.
- A clip attached to an Item or a multiple-choice option needs no transcript: the text beside it is the transcript. The warning applies to widget-level `audio`, `dictation.audio`, `record.model` and listening groups.
- In transcripts, single newlines are rendered as line breaks (they are dialogue).

---

### 7.8 Notation (ABC)

Notation is written in **ABC**, not MusicXML: it is compact, diff-friendly, hand-authorable, and sits comfortably inside YAML. A single tune, one voice or two.

```yaml
abc: |
  X:1
  T:Ode to Joy
  M:4/4
  L:1/4
  K:D
  |: FF GA | AG FE | DD EF | F3E/2E/2 :|
```

Rules:

- The `X:` line is optional; players supply `X:1` when it is missing.
- `T:` (title) is rendered above the staff; omit it inside a widget that already has a prompt.
- Tempo comes from `Q:` if present, otherwise from the widget's `tempo`, otherwise 90 bpm.
- Players MUST render notation as **structured graphics with text alternatives**, never as a bitmap: the widget MUST expose an accessible description (key, metre, and the note sequence in scientific pitch notation) so a screen-reader user gets the content, not "image". If the rendering library labels its own SVG, the player MUST hide that from the accessibility tree so it cannot mask the description.
- Every clickable note MUST have a hit area of at least 24 × 32 CSS px, and staff, beam or slur graphics MUST NOT intercept it. Note heads are far too small to be tap targets on their own.
- A pickup (anacrusis) bar is **bar 0**, so `bar:index` addressing stays stable whether or not a tune has one.
- Lyrics (`w:`) are rendered under the staff when present.

### 7.9 Instrument

```yaml
instrument:
  kind: piano            # piano is the only built-in in 0.4
  samples:               # OPTIONAL: a course's own recordings, keyed by scientific pitch
    C4: assets/audio/violin-c4.mp3
    C5: assets/audio/violin-c5.mp3
  range: [C2, C6]        # OPTIONAL, informative
```

Players pitch-shift from the nearest sample. A player MUST NOT fetch instrument sounds from the network — samples are either built in or in the bundle (§8.2 already forbids network access; this makes it explicit for audio).

### 7.10 Structures (SMILES)

Chemical structures are written in **SMILES**, for the same reasons ABC was chosen for music (§7.8): compact, text-native, diffable, and hand-authorable.

```yaml
smiles: "CC(=O)Oc1ccccc1C(=O)O"   # aspirin
```

Rules:

- Players MUST render structures as **structured graphics with a text alternative**, never a bitmap. The description MUST include the molecular formula and, when `name` is given, the name.
- Atom indices used by `answer` follow **SMILES atom order**, counting only heavy atoms (hydrogen is implicit), 0-based.
- Rendering is offline: no structure service, no image fetch.

### 7.11 Text alternatives for generated visuals

Images carry `alt`, audio carries a transcript, notation and structures are described from their own data. `plot`, `geometry` and `simulation` draw from expressions, so a player can describe *what is on screen* but not *what it means* — the shape of a curve, what a scene is showing, what a model demonstrates.

- These three widgets accept an optional `description`: one or two sentences saying what the learner should take from the visual.
- Where `description` is absent, a player MUST still expose a generated fallback (axis ranges and series labels for `plot`; the readouts and their current values for `simulation`; the shapes and labels for `geometry`), so the widget is never announced as an unlabelled graphic.
- A validator SHOULD warn when a graded widget of these types has no `description`: if the answer depends on reading the visual, the visual needs describing.

Authors: write the sentence you would say to someone sitting next to you who glanced away. *"Velocity rises in a straight line from 2 m/s to 12 m/s over five seconds"* is worth more than any restatement of the axes.

---

## 8. Security Requirements for Players and Validators

### 8.1 No code execution from content
Players MUST NOT execute any author-supplied content as code, with the sole exception of `code-exercise` code inside the sandbox described in §8.4.

### 8.2 Network
While rendering a course, players MUST NOT make network requests on behalf of course content. `https://` links open in the system browser only after an explicit user tap.

### 8.3 SVG sanitisation
SVGs MUST be sanitised before signing: remove `<script>`, `<foreignObject>`, event handler attributes (`on*`), external references (`href` to non-fragment URLs, `@import`), and `<style>` blocks containing `url(`. Validators MUST reject non-sanitised SVGs; signers MAY sanitise in place.

### 8.4 Code-exercise sandbox
- Runs in a WebAssembly (or equivalent) isolate with **no** filesystem, network, clock beyond monotonic time, or access to the host.
- Enforces CPU timeout and memory limits from §7.3, hard-capped by the player.
- stdout/stderr are captured and shown to the learner; output is truncated at 64 KiB.
- Each Run and each individual test executes in a fresh isolate; no state survives between executions.
- Test code is treated with the same distrust as learner code: it runs inside the sandbox and has no additional privileges.

### 8.5 Determinism

The expression language (§7.5) has no source of randomness and no access to the clock, the device or the learner. Two consequences the format depends on: a `simulation` produces the same numbers for every learner, so a question about its behaviour has one answer; and no widget can fingerprint the device.

### 8.6 Resource limits
Players SHOULD cap: lesson size (≤ 1 MiB of Markdown), widgets per lesson (≤ 100), KaTeX expression length (≤ 5 000 chars), and plot samples (≤ 10 000).

---

## 9. Internationalisation (optional)

`i18n/<lang>/` MAY mirror the `lessons/` tree with translated files and a translated `manifest.<lang>.json` containing only `title`, `subtitle`, `description` and chapter titles. Players pick the best match for the learner's locale and fall back to the manifest `language`. This section is a placeholder and may change significantly before 1.0.

- Note names differ by locale (H for B in German-speaking countries, do–re–mi elsewhere). 0.4 uses **English letter names in the format**; a player MAY display another naming convention, and MUST accept the displayed convention in `answer.kind: text`. Authors should avoid making a *typed* answer depend on note-name spelling where an alternative exists — prefer a clickable answer.

Accessibility requirements introduced with learner media:

- Audio widgets SHOULD carry transcripts (§7.7). A course with untranscribed audio MUST declare `accessibility.audioWithoutTranscript: true` in the manifest so the store can say so.
- `record` and `sketch` have no non-motor equivalent. Players MUST offer a "Skip — I can't do this on this device" action on both; it completes the widget and records the skip in state, so progress is never blocked by hardware or ability. The course description SHOULD mention that the course uses speaking or drawing.

---

## 10. Versioning and Compatibility

### 10.1 Spec versioning
- `formatVersion` follows semver. From **1.0.0-rc.1** the format is frozen: the release candidate accepts clarifications and corrections, not new fields. A course written against 1.0.0-rc.1 will open in a 1.0.0 player unchanged.
- **Patch** (0.1.x): clarifications only.
- **Minor** (0.x.0 / 1.x.0): additive — new directives, widget types or optional fields. Older players MUST render placeholders for unknown additions (§6).
- **Major**: breaking changes. Players MUST continue to support every previous major version.

### 10.2 Course versioning
- Course `version` follows semver at the author's discretion. Players SHOULD preserve a learner's progress across course versions whenever lesson and widget IDs are unchanged.

---

## 11. Validator Conformance

A conforming validator MUST check at least:

1. Archive constraints (§2.1) and layout (§2.2)
2. Manifest schema and rules (§3)
3. Content hash completeness and correctness
4. Asset formats and limits (§2.3), SVG sanitisation (§8.3)
5. Markdown: forbidden HTML/URLs (§5.3), missing alt text, broken internal links and asset references
6. Directive names and attributes (§6)
7. Widget bodies parse as safe YAML and validate against the per-type schema (§7.3); unique widget IDs; expression syntax (§7.5) including in `geometry` coordinates; `bind` names reference existing params
8. Resource limits (§8.6) and determinism (§8.5): no expression may reference an unknown identifier
9. Media and instrument samples referenced by widgets exist in the bundle; `manifest.uses` declares every capability the content needs (§3.2)
9a. Asset credit (§3.3): every image, audio and video asset is either covered by `assetsByAuthor: true` or has a `credits` entry, or carries a `figure` `credit`. A `credits` entry pointing at an asset that is not in the bundle is an error
10. Listening groups (§6.2): at least one widget, no nested groups, no widget-level `audio` inside one
11. Notation (§7.8) parses; structures (§7.10) parse; `answer` indices are in range for the notation or structure they address

It SHOULD additionally warn on: unreferenced lessons/assets, very long lessons, lessons without any widget, missing `estimatedMinutes`, audio without a transcript, a listening group without a transcript, and `bestOn` omitted by a course that uses drawing.

A conforming validator SHOULD report YAML failures in terms an author can act on — the single most common authoring error is an unquoted value containing a colon. It SHOULD also reject a `$…$` span containing a LaTeX command inside a double-quoted YAML scalar: YAML treats the backslash as an escape, and several common commands (`\theta`, `\times`, `\frac`, `\beta`, `\alpha`, `\nu`, `\vec`) are valid escapes, so the maths is corrupted without any parse error.

---

## 12. Minimal Example

```
hello-course/
├── manifest.json
├── lessons/
│   └── 01-hello.md
└── assets/images/cover.webp
```

`lessons/01-hello.md`:

````md
---
title: Hello, Vectors
estimatedMinutes: 5
---

# Hello, Vectors

A **vector** is an arrow with a length and a direction. We write it as
$\vec v = (v_x, v_y)$.

:::tip title="Intuition"
Think of it as "how far to walk, and which way".
:::

:::widget type="slider-explore" id="explore-length"
params:
  - { name: vx, min: -3, max: 3, step: 0.1, default: 1, label: $v_x$ }
  - { name: vy, min: -3, max: 3, step: 0.1, default: 2, label: $v_y$ }
geometry:
  view: { x: [-3, 3], y: [-3, 3] }
  shapes:
    - { kind: vector, to: [vx, vy], label: $\vec v$ }
outputs:
  - { label: Length, expr: sqrt(vx^2 + vy^2) }
caption: Move the sliders and watch the arrow and its length change.
:::

:::widget type="numeric-input" id="q-length"
prompt: What is the length of $(3, 4)$?
answer: 5
tolerance: 0.01
hint: Pythagoras.
:::

:::checkpoint
Nice — you've got the basics.
:::
````

---

## 13. Open Items (post-1.0)

Nothing in this list blocks 1.0. Each would be an additive minor version.

- **Branching lessons** — dichotomous keys and adaptive paths. Structural rather than a widget: lessons currently have one linear order.
- **3-D models** — molecules, solids, anatomy.
- **Schematic diagrams from a netlist** — circuits (and plausibly block diagrams) described as components and connections, rendered with standard symbols and automatic layout, so a drawing cannot be misaligned and its text alternative can be generated from the connections. Raised by the first electrical-engineering author. Not built in-house: text-to-schematic renderers already exist, so the work is choosing one, checking it runs offline within the bundle budget, and mapping its input to a widget — the same route `score` took with ABC and `molecule` with SMILES. Worth doing once more than one course needs it. **In the meantime, CircuiTikZ rendered to SVG at authoring time covers most of the need** with no format change: components sit on their paths, junctions are explicit, and the player only ever sees an image. What it does not give is a generated text alternative, and it does not catch polarity errors — both reasons the netlist widget remains worth having eventually. Running TeX *in the player* is not an option: it would mean executing author-supplied code at view time, which §8.1 forbids.
- **Wet-lab simulation** — apparatus, procedures, titration. Deliberately unscheduled; `simulation` (§7.3) is a declarative model, not a laboratory.
- **`rhythm` widget** — tap along, graded on timing deviation. Needs an audio-latency calibration flow to be fair.
- **Fretboard variant of `keyboard`**, chord symbols as an answer target, multi-voice score playback.
- **Pronunciation scoring** for `record` (`grading: phonetic`) — needs an on-device model within the offline budget.
- **Additional code-exercise languages** (Go, Rust, C via WASM), and **multi-file exercises** (the reserved `files`).
- **Shared widget bodies** (the reserved `ref`), if a course turns out to need the same exercise in several lessons.
- **Footnotes and citations**; a glossary/tooltip directive — ideally a course-level term bank that lessons reference, so a term, sign or symbol is defined once and stays consistent across files.
- **Analytics for authors** — per-cell and per-attempt records, which today's state model does not keep.
- Deliberately **not** planned: a tracing score for `sketch`; a rules engine inside `board`.

---

## Changelog

- **1.0.0-rc.9** — Courses from outside the store (§4): an optional `publicKey` in `signature.json` lets a player check an author's own signature and show its fingerprint. Author-signed and unsigned courses open after the learner agrees and stay marked as not from the store; neither may replace a store course. Previously the reference player refused author-signed bundles outright while still opening unsigned ones — signing made a course harder to share. Additive: every rc.8 bundle is valid unchanged.
<!-- not-on-site -->
- **1.0.0-rc.8** — Personal copies (§3.4): an optional, store-written `issuedTo` in the manifest ties each purchased copy to its order and is covered by the signature; it carries no email address, only an opt-in display name. Players show it, open a copy fully for its owner from offline data alone, and open other people's copies as a one-lesson preview. Validators reject `issuedTo` in a source folder. Not copy protection, and specified as not being one: courses stay unencrypted, offline and permanent. Additive: every rc.7 course is valid unchanged.
<!-- /not-on-site -->
- **1.0.0-rc.7** — The graded base (§7.1) applied to every graded type in the schema, but four of them — `multiple-choice`, `fill-blank`, `ordering`, `matching` — offered neither hint nor solution, and `dictation`, `record`, `sketch` and `code-exercise` never showed `explanation`; the reference player now honours all of it, and its field audit checks each graded type rather than "some widget". `explanation` is now specified as shown with a revealed solution as well as on success, never after a wrong answer while the learner can still try, and MAY sit behind a disclosure (the reference player's "Why?") provided it stays reachable. A `multiple-choice` option's `explanation` is defined as being about that option. No schema change: every rc.6 course is valid unchanged.
- **1.0.0-rc.6** — An audit of every schema field against the reference player found promises no player kept. Implemented: `free-text` `minLength`/`maxLength`, `code-exercise` `resetable`, and a text alternative for `geometry`, which had none at all. Reserved and rejected with a message saying what to use instead: `ref`, `maxAttempts`, and `code-exercise` `files` — none used by any known course. Spaced review specified for `flashcards` with `spaced: true`, a field present since 0.2 that no player had ever acted on; `shuffle` documented, likewise long in the schema and never implemented. No schema change: every rc.5 course is valid unchanged, and decks without `spaced` behave exactly as before.
- **1.0.0-rc.5** — `hotspot.answer` is optional: without it the widget is an annotated image, ungraded. Keyboard operation is now normative for `board` and `keyboard`, as it already was for `hotspot`, `score` and `molecule` — and all five now actually provide it; three of them did not, which the format claimed and nothing tested. Additive: every rc.4 course is valid unchanged.
- **1.0.0-rc.4** — From an author's review of the documentation: each document now states who it is for, and a manifest may carry an ignored `$schema` key so editors can help; §7.1 now catalogues the four shared graded attributes instead of only asserting they exist; `value` and `default` are synonyms in both `simulation` and `slider-explore` params; §2.2 documents the *source* form of a course (`manifest.json.in`, unsigned bundles) and states that signing is the platform's step, not the author's; §3.1 points at the normative JSON Schema files; and §7.11 adds an optional `description` on `plot`, `geometry` and `simulation`, with a required generated fallback and a validator warning when a graded visual has none.
- **1.0.0-rc.3** — From the first outside author's course: `slider-explore.plot` now takes the same shape as the `plot` widget (`series`, with `expr` kept as sugar for one series), because two shapes for one idea is a trap only a newcomer finds; and a `simulation` param named `dt` sets the time step instead of being silently shadowed, while `t` is reserved and rejected. Both additive — an rc.2 course still validates.
- **1.0.0-rc.2** — Asset credit (§3.3): manifest `assetsByAuthor` and `credits`, a `credit` attribute on `figure`, and a validator requirement that authorship is stated rather than assumed. Additive and ignorable by an rc.1 player, so the freeze holds. Also: `diagram` is now explicitly **reserved and rejected** rather than specified-but-unbuilt — 21 implemented widget types.
- **1.0.0-rc.1** — Format frozen. Merges the 0.4, 0.5 and 0.6 drafts into one document: music (`score`, `keyboard`, §7.8 ABC notation, §7.9 instruments), labelled images and grids (`hotspot`, `table-input`), chemistry and models (`molecule`, §7.10 SMILES, `simulation`). Also: a shared graded-widget base (`hint`, `explanation`, `maxAttempts`, `solutionAfterAttempts` defined once for all graded types); `prompt` on `fill-blank`; `mhchem` for `\ce{}`; §8.5 determinism. Twenty-one widget types, each written against a sample course and revised from what that course exposed.

- **0.3.0** — Learner-produced media, from three more sample courses (Spanish café, Sketching, Chess tactics): `audio` on any widget with a prompt; Item type (`{ text, audio }`) for options, cards, ordering and matching; Media object with `transcript`, `transcriptAfter`, `playLimit`, `speed`; `:::listening` group directive with `:::transcript`; new widgets `dictation`, `record`, `sketch`, `board`; learner attachments in widget state (§7.4); `plot` categorical axis, `area` style, `source`; manifest `bestOn`, `uses`, `accessibility`; Opus audio; fill-blank parses inline Markdown before blanks.
- **0.2.0** — Findings from the first two sample courses: new `geometry` widget (standalone and inside `slider-explore`); widget bodies are YAML (JSON still valid); `prompt` is block Markdown; output grading uses multiple `cases` with hidden support and precisely defined `outputMatch`; tests can read program output via `__stdout__`; mandatory `assert_equal`/`assertEqual` helper; numeric `fill-blank` blanks with tolerance; `precision`/`suffix` on slider outputs; math/code parsed before table cells; `solutionAfterAttempts` default 2 for output grading.
- **0.1.1** — Expanded `code-exercise`: Run/Submit semantics, hidden tests, output-based grading, multi-file exercises, hints (§7.3, §7.6).
- **0.1.0** — Initial draft.
