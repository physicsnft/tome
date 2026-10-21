import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import widgetSchema from './widget.schema.json' with { type: 'json' };
import manifestSchema from './manifest.schema.json' with { type: 'json' };
import { check as checkExpr } from './expr.ts';
import type { Manifest, WidgetDef } from './types.ts';

const ajv = new Ajv2020({ allErrors: true, strict: false, discriminator: true });
addFormats(ajv);
const vWidget = ajv.compile(widgetSchema);
// One validator per widget type, compiled against that type's $defs branch, so errors are specific.
const branchValidators = new Map<string, ReturnType<typeof ajv.compile>>();
const branchValidator = (def: string) => {
  let v = branchValidators.get(def);
  if (!v) { v = ajv.compile({ $defs: (widgetSchema as any).$defs, $ref: `#/$defs/${def}` }); branchValidators.set(def, v); }
  return v;
};
const vManifest = ajv.compile(manifestSchema);

/** Advisory checks: real problems, but not reasons to refuse a build. */
export function widgetWarnings(w: any): string[] {
  return textAlternative(w);
}

/** §7.11: a graded visual whose answer depends on reading it needs an author's description. */
function textAlternative(w: any): string[] {
  const visual = w.type === 'plot' || w.type === 'simulation' || w.type === 'geometry';
  if (!visual || w.description) return [];
  if (w.answer) return [`A graded ${w.type} should carry a \`description\`: the answer depends on reading the visual, and a generated fallback cannot say what it means (§7.11).`];
  // Without a caption either, the only text a screen reader gets is the generated fallback.
  if (!w.caption) return [`${w.type} has no \`description\` or \`caption\` — a screen reader will get only the axis ranges and labels (§7.11).`];
  return [];
}

/** `t` is the simulation clock, supplied by the player; an author variable of that name would shadow it. */
function reservedNames(w: any): string[] {
  if (w.type !== 'simulation') return [];
  const msgs: string[] = [];
  if (w.state && 't' in w.state) msgs.push("`t` is the model clock and is provided automatically — remove it from `state`.");
  for (const p of w.params ?? []) if (p.name === 't') msgs.push("A param cannot be called `t`: that is the model clock.");
  return msgs;
}

/**
 * Fields the format once promised and no player implements. A frozen format must not promise what no
 * player does, so they are reserved: rejected with a way forward, kept free for a future minor version.
 */
function reservedFields(w: any): string[] {
  const m: string[] = [];
  if (w.ref !== undefined) m.push('`ref` is reserved but not implemented in 1.0 (§7.1): write the widget body inline.');
  if (w.maxAttempts !== undefined) m.push('`maxAttempts` is reserved (§7.1): locking an exercise would block the checkpoint with no one to unlock it. Use `solutionAfterAttempts` to offer the answer instead.');
  if (w.type === 'code-exercise' && w.files !== undefined) m.push('`files` is reserved but not implemented in 1.0 (§7.3): put the exercise in a single `starterCode`.');
  return m;
}

const RESERVED: Record<string, string> = { diagram: 'The `diagram` type is reserved but not implemented in 1.0 (§7.3). Use a `figure` with an SVG asset.' };
const TYPE_DEF: Record<string, string> = { 'multiple-choice': 'multipleChoice', 'numeric-input': 'numericInput', 'free-text': 'freeText', 'fill-blank': 'fillBlank', ordering: 'ordering', matching: 'matching', 'slider-explore': 'sliderExplore', plot: 'plot', 'code-exercise': 'codeExercise', flashcards: 'flashcards', diagram: 'diagram', geometry: 'geometry', dictation: 'dictation', record: 'record', sketch: 'sketch', board: 'board', score: 'score', keyboard: 'keyboard', hotspot: 'hotspot', 'table-input': 'tableInput', molecule: 'molecule', simulation: 'simulation' };

/** Schema + expression checks for one widget. Returns human-readable messages. */
export function validateWidget(w: WidgetDef): string[] {
  const msgs: string[] = [...reservedNames(w), ...reservedFields(w)];
  if (msgs.length && reservedFields(w).length) return msgs; // schema errors would only repeat it
  if (RESERVED[w.type]) return [RESERVED[w.type]];
  if (!vWidget(w)) {
    const def = TYPE_DEF[w.type];
    if (!def) msgs.push(`Unknown widget type '${w.type}'`);
    const bv = def ? branchValidator(def) : null;
    const errs = bv && !bv(w) ? (bv.errors ?? []).filter((e) => e.keyword !== 'if') : [];
    const seen = new Set<string>();
    for (const e of errs) {
      const prop = (e.params as any).additionalProperty ?? (e.params as any).unevaluatedProperty;
      const extra = prop ? ` ('${prop}')` : '';
      const hint = prop && /[)$\s]/.test(prop) ? ' — did you forget to quote a flow-style value containing a comma?' : '';
      const msg = `${e.instancePath || '/'} ${e.message}${extra}${hint}`;
      if (!seen.has(msg)) { seen.add(msg); msgs.push(msg); }
    }
    if (!msgs.length) msgs.push('does not match schema');
  }
  msgs.push(...checkExpressions(w));
  return msgs;
}

function checkExpressions(w: any): string[] {
  const out: string[] = [];
  const names = new Set<string>((w.params ?? []).map((p: any) => p.name));
  const chk = (e: unknown, where: string) => {
    if (typeof e !== 'string' && typeof e !== 'number') return;
    const err = checkExpr(e, names);
    if (err) out.push(`${where}: ${err}`);
  };
  (w.outputs ?? []).forEach((o: any, i: number) => chk(o.expr, `outputs[${i}]`));
  if (w.plot) chk(w.plot.expr, 'plot');
  (w.series ?? []).forEach((s: any, i: number) => s.expr && chk(s.expr, `series[${i}]`));
  const scene = w.type === 'geometry' ? w : w.geometry;
  if (scene?.shapes) {
    scene.shapes.forEach((sh: any, i: number) => {
      for (const [k, v] of Object.entries(sh)) {
        if (Array.isArray(v) && k !== 'bind' && k !== 'points') v.forEach((c, j) => chk(c, `shapes[${i}].${k}[${j}]`));
        else if (k === 'points') (v as any[]).forEach((pt, j) => pt.forEach((c: any, l: number) => chk(c, `shapes[${i}].points[${j}][${l}]`)));
        else if (k === 'radius' || (sh.kind === 'arc' && (k === 'from' || k === 'to'))) chk(v, `shapes[${i}].${k}`);
        else if (k === 'bind') (v as string[]).forEach((n) => { if (!names.has(n)) out.push(`shapes[${i}].bind: unknown param '${n}'`); });
      }
    });
  }
  return out;
}

export function validateManifest(m: unknown): string[] {
  if (vManifest(m)) return [];
  return (vManifest.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`);
}

export function manifestLessons(m: Manifest): string[] {
  return m.structure.flatMap((c) => c.lessons);
}

/** All asset paths referenced by a widget body, plus audio clips lacking transcripts (0.3). */
export function widgetAssets(w: any): { audio: string[]; images: string[]; untranscribed: string[] } {
  const audio: string[] = [], images: string[] = [], untranscribed: string[] = [];
  // `selfTranscribed`: the clip sits next to the text it speaks (Item audio, option audio), so no transcript is needed.
  const media = (m: any, selfTranscribed = false) => { if (!m) return; if (typeof m === 'string') { audio.push(m); if (!selfTranscribed) untranscribed.push(m); } else { audio.push(m.src); if (!m.transcript && !selfTranscribed) untranscribed.push(m.src); } };
  const item = (it: any) => { if (it && typeof it === 'object') media(it.audio, true); };
  media(w.audio); media(w.model && typeof w.model !== 'string' && w.model.src ? w.model : typeof w.model === 'string' && w.type === 'record' ? w.model : undefined);
  (w.options ?? []).forEach((o: any) => media(o.audio, true));
  (w.items ?? []).forEach(item);
  (w.pairs ?? []).forEach((p: any) => { item(p.left); item(p.right); });
  (w.cards ?? []).forEach((c: any) => { item(c.front); item(c.back); });
  for (const k of ['reference', 'trace']) if (typeof w[k] === 'string') images.push(w[k]);
  if (w.type === 'sketch' && typeof w.model === 'string') images.push(w.model);
  if (typeof w.image === 'string') images.push(w.image);
  (w.pieces ?? []).forEach((p: any) => p.sprite && images.push(p.sprite));
  // Images written as Markdown inside any text field — an option, a flashcard face, a prompt — are
  // displayed too, so they need to exist and be credited like any other image.
  const walkText = (v: any): void => {
    if (typeof v === 'string') { for (const m of v.matchAll(/!\[[^\]]*\]\((assets\/[^)\s]+)\)/g)) images.push(m[1]); }
    else if (Array.isArray(v)) v.forEach(walkText);
    else if (v && typeof v === 'object') Object.values(v).forEach(walkText);
  };
  walkText(w);
  for (const p of Object.values(w.instrument?.samples ?? {})) media(p as string, true); // a sample is its own label
  return { audio, images, untranscribed };
}

/** Device capabilities a widget needs (manifest `uses`). */
export function widgetUses(w: any): string[] {
  const u = new Set<string>();
  if (w.type === 'record') u.add('microphone');
  if (w.type === 'score' || w.type === 'keyboard') u.add('music');
  if (w.type === 'sketch') u.add('drawing');
  if (widgetAssets(w).audio.length) u.add('audio');
  return [...u];
}

/** Media object for a `:::listening` directive, built from its attributes (§6.1). */
export function listeningMedia(attrs: Record<string, any>): { src: string; playLimit?: number; speed?: number[] } | null {
  if (!attrs?.src) return null;
  const m: any = { src: String(attrs.src) };
  if (attrs.playLimit !== undefined) m.playLimit = Number(attrs.playLimit);
  if (attrs.speed !== undefined) m.speed = String(attrs.speed).split(',').map((x) => Number(x.trim())).filter((x) => x > 0);
  return m;
}

/** Structural checks on a lesson tree for 0.3 directives. */
export function checkListening(tree: any, widgets: any[]): { problems: string[]; audio: string[] } {
  const problems: string[] = [], audio: string[] = [];
  const visit = (n: any, inGroup: boolean) => {
    if (n.type === 'containerDirective' && n.name === 'listening') {
      const m = listeningMedia(n.attributes ?? {});
      if (!m) problems.push(':::listening requires a src attribute'); else { audio.push(m.src); if (!/\.(mp3|m4a|ogg)$/.test(m.src)) problems.push(`:::listening src must be an audio asset: ${m.src}`); if (m.playLimit !== undefined && !(m.playLimit >= 1)) problems.push(':::listening playLimit must be ≥ 1'); }
      if (inGroup) problems.push(':::listening groups cannot be nested');
      const ws = (n.children ?? []).filter((c: any) => c.type === 'paragraph' && /^@@widget:\d+@@$/.test(c.children?.[0]?.value ?? ''));
      if (!ws.length) problems.push(':::listening contains no widgets');
      for (const c of ws) { const w = widgets[Number(/\d+/.exec(c.children[0].value)![0])]; if (w?.audio) problems.push(`Widget '${w.id}' inside :::listening must not have its own audio`); }
      if (!(n.children ?? []).some((c: any) => c.type === 'containerDirective' && c.name === 'transcript')) problems.push(':::listening has no :::transcript (warning)');
      (n.children ?? []).forEach((c: any) => visit(c, true)); return;
    }
    if (n.type === 'containerDirective' && n.name === 'transcript' && !inGroup) problems.push(':::transcript is only valid inside :::listening');
    (n.children ?? []).forEach((c: any) => visit(c, inGroup));
  };
  visit(tree, false);
  return { problems, audio };
}

/** Image, audio and video assets a lesson body references (Markdown images and media directives). */
export function bodyAssets(tree: any): { path: string; credited: boolean }[] {
  const out: { path: string; credited: boolean }[] = [];
  const visit = (n: any, figureCredit = false) => {
    const inFigure = n.type === 'containerDirective' && n.name === 'figure';
    const credit = inFigure ? !!n.attributes?.credit : figureCredit;
    if (n.type === 'image' && typeof n.url === 'string' && n.url.startsWith('assets/')) out.push({ path: n.url, credited: credit });
    if ((n.type === 'containerDirective' || n.type === 'leafDirective') && ['video', 'audio', 'lottie'].includes(n.name) && n.attributes?.src)
      out.push({ path: String(n.attributes.src), credited: credit });
    (n.children ?? []).forEach((c: any) => visit(c, credit));
  };
  visit(tree);
  return out;
}

/**
 * Heuristic for a worked example reused as its own exercise: a numeric answer whose value *and* at
 * least one of its given quantities both appear in the prose since the previous widget. Requiring the
 * pair keeps it quiet on lessons that merely mention the answer, or that reuse a constant.
 * A warning only — deliberate repetition ("now you do it") is legitimate.
 */
export function copiedExampleWarnings(tree: any, widgets: any[]): { id: string; message: string }[] {
  const nums = (t: string) => (t.match(/-?\d+(?:[.,]\d+)?/g) ?? []).map((x) => parseFloat(x.replace(',', '.'))).filter(Number.isFinite);
  const same = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));
  const text = (n: any): string => (n.value && n.type !== 'code' ? String(n.value) + ' ' : '') + (n.children ?? []).map(text).join('');
  const out: { id: string; message: string }[] = [];
  let prose: number[] = [];
  for (const node of tree.children ?? []) {
    const m = node.type === 'paragraph' && /^@@widget:(\d+)@@$/.exec(node.children?.[0]?.value ?? '');
    if (!m) { if (node.type !== 'heading') prose.push(...nums(text(node))); else prose = []; continue; }
    const w = widgets[Number(m[1])];
    const answers: number[] = [];
    if (w?.type === 'numeric-input' && typeof w.answer === 'number') answers.push(w.answer);
    if (w?.type === 'fill-blank' && typeof w.text === 'string') for (const b of w.text.matchAll(/\{\{=\s*(-?[\d.]+)/g)) answers.push(parseFloat(b[1]));
    const given = nums(String(w?.prompt ?? '') + ' ' + String(w?.type === 'fill-blank' ? w.text.replace(/\{\{[^}]*\}\}/g, ' ') : ''));
    for (const a of answers) {
      const inputs = given.filter((g) => !same(g, a));
      if (prose.some((p) => same(p, a)) && inputs.length && inputs.some((g) => prose.some((p) => same(p, g)))) {
        out.push({ id: w.id, message: `The answer (${a}) and its given values also appear in the text just above. If that text is a worked example, the learner can copy it — change the numbers, or the unknown.` });
        break;
      }
    }
    prose = [];
  }
  return out;
}
