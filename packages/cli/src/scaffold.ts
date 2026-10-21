/**
 * `tome new <dir>` — a course that validates, builds and opens on the first try.
 *
 * For most authors this is the documentation: a blank directory teaches nothing, a working lesson with
 * three widgets in it teaches the shape of everything. Every file here is deliberately small enough to
 * read in full before changing it.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const COVER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <rect width="600" height="800" fill="#2b4acb"/>
  <rect x="40" y="40" width="520" height="720" fill="none" stroke="#f7f8fa" stroke-width="6"/>
  <circle cx="300" cy="330" r="120" fill="none" stroke="#f7f8fa" stroke-width="8"/>
  <path d="M240 330 L290 380 L370 290" fill="none" stroke="#f7f8fa" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="60" y="600" font-family="sans-serif" font-size="52" font-weight="700" fill="#ffffff">TITLE</text>
  <text x="60" y="660" font-family="sans-serif" font-size="26" fill="#c9d4f7">a course about SUBJECT</text>
</svg>
`;

/** Kept in one place: a version string repeated across scaffold, guide and spec is a version string that drifts. */
export const FORMAT_VERSION = '1.0.0-rc.9'; // matches this package's version, by policy (README)

const manifest = (id: string, title: string) => `{
  "formatVersion": "${FORMAT_VERSION}",
  "id": "${id}",
  "version": "0.1.0",
  "title": "${title}",
  "subtitle": "One line that says what the learner will be able to do",
  "description": "Two or three sentences. This is what someone reads before buying, so say what they will be able to do at the end, not what topics are covered.",
  "language": "en",
  "authors": [{ "name": "Your Name" }],
  "tags": ["example"],
  "level": "beginner",
  "estimatedMinutes": 15,
  "cover": "assets/images/cover.svg",
  "assetsByAuthor": true,
  "structure": [
    { "id": "start", "title": "Getting started", "lessons": ["lessons/01-first-lesson.md", "lessons/02-images.md"] }
  ],
  "contentHashes": {}
}
`;

const lesson = `---
title: Your First Lesson
estimatedMinutes: 15
summary: One sentence, shown in the table of contents.
---

# Your First Lesson

Write in Markdown. **Bold**, *italic*, \`code\`, links, lists and tables all work, and maths
does too: $a^2 + b^2 = c^2$.

Keep paragraphs short. A lesson is read on a phone as often as on a laptop.

:::note title="Callouts"
Four kinds: \`note\`, \`tip\`, \`warning\` and \`important\`. Use them for asides — not for the main
thread of the lesson, which should survive being read straight through.
:::

## Ask something before you explain it

A question the learner cannot yet answer is not a test, it is a reason to keep reading.

:::widget type="multiple-choice" id="first-question"
prompt: Which of these is a *widget*?
options:
  - text: A callout box
    explanation: Callouts are directives, not widgets — they hold text, not answers.
  - text: A multiple-choice question
    correct: true
  - text: A heading
:::

## Then let them do it

:::widget type="numeric-input" id="first-number"
prompt: How many widgets are in this lesson?
answer: 3
tolerance: 0
hint: Count the \`:::widget\` blocks — including this one.
explanation: Three. Every widget needs an \`id\` that is unique within the course.
:::

:::widget type="fill-blank" id="first-blank"
prompt: Fill in the two words.
text: "Every course is a signed {{bundle}} that works fully {{offline}}."
explanation: Both properties are what make a course something the learner owns rather than borrows.
:::

:::checkpoint
A checkpoint blocks progress until the exercises above it are complete. Use one per section.
:::

## Next steps

- \`tome validate .\` after every change. It is fast, and it catches far more than typos.
- Add an image to \`assets/images/\` and show it with \`![alt text](assets/images/your-file.png)\`.
- The full list of widget types is in SPEC.md §7.3 — there are twenty-one of them.
`;

/** Two shapes, so the image lesson has something real to compare. Drawn here: no credit needed. */
const SHAPE_A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" fill="#f3efe6"/><circle cx="60" cy="60" r="34" fill="none" stroke="#2b4acb" stroke-width="8"/>
</svg>
`;
const SHAPE_B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" fill="#f3efe6"/><circle cx="60" cy="60" r="34" fill="none" stroke="#2b4acb" stroke-width="8" stroke-dasharray="14 10"/>
</svg>
`;

const lesson2 = `---
title: Working with Images
estimatedMinutes: 5
summary: Showing an image, and asking about one.
---

# Working with Images

Images live in \`assets/images/\` and appear with Markdown's image syntax. The text in square
brackets is the **alt text**: what a learner who cannot see the picture needs to know.

![A solid blue ring on a cream background](assets/images/shape-solid.svg)

Learners can tap any image in the lesson text to see it full-screen. For a detailed photograph,
that is how they will read it on a phone.

## Asking about an image

Images can also go *inside* a widget — here, as the options of a question. This is the most direct
way to practise telling two similar things apart.

:::widget type="multiple-choice" id="which-is-dashed"
prompt: Which ring is drawn with a dashed line?
options:
  - text: "![A solid blue ring](assets/images/shape-solid.svg)"
    explanation: This one is a single unbroken line.
  - text: "![A blue ring made of short separate strokes](assets/images/shape-dashed.svg)"
    correct: true
    explanation: The gaps between the strokes are what make it dashed.
:::

Notice the alt text describes what is *visible* — "made of short separate strokes" — without saying
"dashed". Alt text that names the answer gives the question away.

:::checkpoint
You can show an image and ask about one. That covers most of what any course needs.
:::
`;

const readme = (name: string) => `# ${name}

A Tome course. Everything here is plain text and images; there is no build step and no code.

    tome validate .            # check it — do this constantly
    tome build . --out dist    # produce a .course bundle
    tome sign dist/*.course key.json   # sign it (tome keygen key.json first)

## Layout

    manifest.json.in     what the course is; the build fills in contentHashes
    lessons/*.md         one file per lesson, in the order given by manifest structure
    assets/images/       images, referenced as assets/images/…
    assets/audio/        audio, same
    widgets/             optional: shared widget bodies referenced with \`ref\`

## Before publishing

- Every asset is your own work (\`assetsByAuthor: true\`) or has a \`credits\` entry. The validator checks.
- \`estimatedMinutes\` on every lesson, and a \`summary\` — both appear in the table of contents.
- Read the course end to end on a phone-sized window.
`;

export function newCommand(dir: string) {
  const root = resolve(dir);
  if (existsSync(root)) { console.error(`${root} already exists — pick a directory that does not.`); process.exit(1); }
  const name = basename(root);
  const id = `dev.${(process.env.USER ?? 'author').toLowerCase().replace(/[^a-z0-9]/g, '')}.${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
  const title = name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  mkdirSync(join(root, 'lessons'), { recursive: true });
  mkdirSync(join(root, 'assets/images'), { recursive: true });
  mkdirSync(join(root, 'assets/audio'), { recursive: true });
  writeFileSync(join(root, 'manifest.json.in'), manifest(id, title));
  writeFileSync(join(root, 'lessons/01-first-lesson.md'), lesson);
  writeFileSync(join(root, 'lessons/02-images.md'), lesson2);
  writeFileSync(join(root, 'assets/images/shape-solid.svg'), SHAPE_A);
  writeFileSync(join(root, 'assets/images/shape-dashed.svg'), SHAPE_B);
  writeFileSync(join(root, 'assets/images/cover.svg'), COVER.replace('TITLE', title.slice(0, 18)).replace('SUBJECT', 'your subject'));
  writeFileSync(join(root, 'README.md'), readme(title));

  console.log(`Created ${root}`);
  console.log(`  id: ${id}   (change it in manifest.json.in — it is permanent once published)\n`);
  console.log('Next:');
  console.log(`  tome validate ${dir}`);
  console.log(`  tome build ${dir} --out ${dir}/dist`);
}
