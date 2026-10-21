// Every field the widget schema accepts must have a behaviour behind it in the reference player.
// `spaced`, `diagram`, `maxAttempts`, `ref`, `files`, `minLength` and `resetable` were all specified
// and silently ignored at some point. This makes the next one a failing test rather than a discovery.
import { readFileSync, readdirSync } from 'node:fs';

const schema = JSON.parse(readFileSync('packages/core/src/widget.schema.json', 'utf8')).$defs;
const dir = 'packages/player-web/src/widgets';
const src = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => [f.slice(0, -4), readFileSync(`${dir}/${f}`, 'utf8')]));
const FILE = { multipleChoice: 'MultipleChoice', numericInput: 'NumericInput', freeText: 'FreeText', fillBlank: 'FillBlank', ordering: 'Ordering',
  matching: 'Matching', sliderExplore: 'SliderExplore', plot: 'Plot', codeExercise: 'CodeExercise', flashcards: 'Flashcards', geometry: 'Geometry',
  dictation: 'Dictation', record: 'Record', sketch: 'Sketch', board: 'Board', score: 'Score', keyboard: 'Keyboard', hotspot: 'Hotspot',
  tableInput: 'TableInput', molecule: 'Molecule', simulation: 'Simulation' };
// Fields whose only allowed value is the default have no behaviour to implement.
const VALUE_ONLY = new Set(['record.grading', 'sketch.grading']);

const missing = [];
for (const [def, file] of Object.entries(FILE)) {
  for (const [prop, rule] of Object.entries(schema[def].properties)) {
    if (prop === 'type' || rule === false || VALUE_ONLY.has(`${def.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}.${prop}`) || VALUE_ONLY.has(`${file.toLowerCase()}.${prop}`)) continue;
    if (!new RegExp(`\\b${prop}\\b`).test(src[file] ?? '')) missing.push(`${def}.${prop}`);
  }
}
// Shared attributes must be used by at least one widget (or, for `required`, by the app).
const shared = { ...schema.common.properties, ...schema.graded.properties };
const app = readFileSync('packages/player-web/src/App.tsx', 'utf8');
for (const [prop, rule] of Object.entries(shared)) {
  if (rule === false || prop === 'id') continue;
  const used = Object.values(src).some((s) => new RegExp(`def\\.${prop}\\b`).test(s)) || new RegExp(`\\.${prop}\\b`).test(app);
  if (!used) missing.push(`(shared).${prop}`);
}
// The graded base (§7.1) is inherited by every graded type, so "some widget uses it" is not enough:
// each graded widget must honour it. Multiple-choice, fill-blank, ordering and matching ignored all three
// until the "Why?" disclosure went in. Self-assessed types have no wrong attempt, so no hint or solution;
// free-text shows its model answer on the first check.
const NO_WRONG = new Set(['record', 'sketch']);
const OWN_SOLUTION = new Set(['record', 'sketch', 'freeText']);
for (const [def, file] of Object.entries(FILE)) {
  if (!JSON.stringify(schema[def].allOf ?? []).includes('#/$defs/graded')) continue;
  const need = ['explanation', ...(NO_WRONG.has(def) ? [] : ['hint']), ...(OWN_SOLUTION.has(def) ? [] : ['solutionAfterAttempts'])];
  for (const prop of need) if (!new RegExp(`def\\.${prop}\\b`).test(src[file] ?? '')) missing.push(`${def}.${prop} (graded base)`);
}
if (missing.length) { console.error('schema fields with no player behaviour:\n  ' + missing.join('\n  ')); process.exitCode = 1; }
else console.log('field audit: every schema field has a behaviour in the reference player');
