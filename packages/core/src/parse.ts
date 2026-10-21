import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import YAML from 'yaml';
import type { Root } from 'mdast';
import type { FrontMatter, ParsedLesson, Problem, WidgetDef } from './types.ts';
import { KNOWN_DIRECTIVES } from './types.ts';
import { validateWidget } from './validate.ts';

/**
 * Spec directive syntax is `:::name key="value"`; remark-directive wants `:::name{key="value"}`.
 * Widget bodies are YAML, not Markdown, so they are lifted out before remark sees the text and
 * replaced by a placeholder paragraph `@@widget:N@@`.
 */
const OPEN = /^(:{3,})([a-z][a-z0-9-]*)((?:\s+[a-zA-Z]+=(?:"[^"]*"|[0-9.]+|true|false))*)\s*$/;
/** Looks like someone meant a directive, whether or not the attributes parsed. */
const OPEN_LOOSE = /^(:{3,})([a-z][a-z0-9-]*)(.*)$/;

function parseAttrs(s: string): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const m of s.matchAll(/([a-zA-Z]+)=(?:"([^"]*)"|([0-9.]+)|(true|false))/g)) {
    out[m[1]] = m[2] !== undefined ? m[2] : m[3] !== undefined ? Number(m[3]) : m[4] === 'true';
  }
  return out;
}

function preprocess(src: string, problems: Problem[]) {
  const lines = src.split('\n');
  const out: string[] = [];
  const widgets: WidgetDef[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = OPEN.exec(lines[i]);
    if (!m) {
      // A directive whose attributes do not parse is passed through to Markdown, where it renders as the
      // literal text `:::note title=…`. That used to happen silently, which is worse than an error.
      const loose = OPEN_LOOSE.exec(lines[i]);
      if (loose && KNOWN_DIRECTIVES.has(loose[2])) {
        const attrs = loose[3];
        const quotes = (attrs.match(/"/g) ?? []).length;
        const why = quotes % 2 === 1 ? 'an unbalanced double quote'
          : /"[^"]*"[^\s]/.test(attrs) ? 'a double quote inside a quoted value — use \u2018 \u2019 or rephrase'
          : 'an attribute that is not name="value", a number, or true/false';
        problems.push({ level: 'error', message: `Directive ':::${loose[2]}' has ${why}, so it will render as plain text instead of a ${loose[2]} block.`, line: i + 1 });
      }
      out.push(lines[i]);
      continue;
    }
    const [, fence, name, attrStr] = m;
    const attrs = parseAttrs(attrStr);
    if (!KNOWN_DIRECTIVES.has(name)) problems.push({ level: 'error', message: `Unknown directive ':::${name}'`, line: i + 1 });
    if (name === 'widget') {
      const body: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== fence) body.push(lines[j++]);
      if (j >= lines.length) problems.push({ level: 'error', message: 'Unterminated :::widget', line: i + 1 });
      let def: WidgetDef;
      let yamlOk = true;
      // In a double-quoted YAML string a backslash starts an escape, so LaTeX is silently corrupted:
      // \theta becomes a tab + "heta", \frac a form feed + "rac", \alpha a bell + "lpha". Catch it
      // before parsing, while the author's original text is still there to point at.
      let latexInDoubleQuotes = false;
      for (const [k, line] of body.entries()) {
        for (const q of line.matchAll(/"(?:[^"\\]|\\.)*"/g)) {
          // Only inside $…$: a bare "\nline" outside maths is an intended newline followed by a word.
          const maths = [...q[0].matchAll(/\$[^$]+\$/g)].map((m) => m[0]).join(' ');
          const cmd = /\\[a-zA-Z]{2,}/.exec(maths);
          if (cmd) latexInDoubleQuotes = true;
          if (cmd) problems.push({ level: 'error', line: i + 2 + k, message:
            `LaTeX inside double quotes: YAML reads the backslash in ${cmd[0]} as an escape, so the maths is corrupted or rejected. ` +
            `Use single quotes for anything containing LaTeX:\n           ${line.trim().replace(/^([\w-]+:\s*)"(.*)"\s*$/, (_m: string, key: string, v: string) => `${key}'${v.replace(/\\"/g, '"').replace(/'/g, "''")}'`)}` });
        }
      }
      try {
        const parsed = YAML.parse(body.join('\n'), { schema: 'core' }) ?? {};
        def = { ...parsed, ...attrs } as WidgetDef;
      } catch (e) {
        // Already reported, more usefully, as LaTeX inside double quotes — same cause.
        if (!(latexInDoubleQuotes && /Invalid escape sequence/.test((e as Error).message)))
          problems.push({ level: 'error', message: `Widget YAML: ${(e as Error).message}${yamlHint(e as Error, body)}`, line: i + 1 });
        // `type` comes from the directive attributes and survives a YAML failure, so a half-parsed body
        // would otherwise be handed to a real widget renderer with all its fields missing. Force `invalid`.
        def = { ...attrs, type: 'invalid', id: String(attrs.id ?? `w${widgets.length}`) } as WidgetDef;
        yamlOk = false;
      }
      // Schema errors after a YAML failure are just fallout from the half-parsed body; reporting them buries the real one.
      if (yamlOk) for (const msg of validateWidget(def)) problems.push({ level: 'error', message: `Widget '${def.id}': ${msg}`, line: i + 1 });
      widgets.push(def);
      out.push('', `@@widget:${widgets.length - 1}@@`, '');
      i = j;
      continue;
    }
    const attrText = Object.entries(attrs).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
    out.push(attrText ? `${fence}${name}{${attrText}}` : `${fence}${name}`);
  }
  return { text: out.join('\n'), widgets };
}

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).use(remarkMath).use(remarkDirective);

export function parseLesson(path: string, src: string): ParsedLesson {
  const problems: Problem[] = [];
  const id = path.replace(/^.*\//, '').replace(/\.md$/, '');
  const { text, widgets } = preprocess(src, problems);
  const tree = processor.parse(text) as Root;

  let frontMatter: FrontMatter = { title: id };
  const fm = tree.children[0];
  if (fm && fm.type === 'yaml') {
    try { frontMatter = { ...frontMatter, ...YAML.parse(fm.value) }; } catch (e) { problems.push({ level: 'error', message: `Front matter: ${(e as Error).message}${yamlHint(e as Error, fm.value.split('\n'))}` }); }
    tree.children.shift();
  } else problems.push({ level: 'error', message: 'Missing front matter (title is required)' });
  if (!frontMatter.title) problems.push({ level: 'error', message: 'Front matter: title is required' });

  // Forbidden constructs (§5.3)
  walk(tree, (n: any) => {
    if (n.type === 'html' && !problems.some((p) => p.line === n.position?.start.line && p.message.startsWith('Raw HTML'))) problems.push({ level: 'error', message: 'Raw HTML is not allowed', line: n.position?.start.line });
    if ((n.type === 'link' || n.type === 'image') && typeof n.url === 'string') {
      const u: string = n.url;
      const ok = u.startsWith('#') || u.startsWith('https://') || u.startsWith('lesson:') || (n.type === 'image' && /^assets\//.test(u));
      if (!ok) problems.push({ level: 'error', message: `Forbidden ${n.type} destination '${u}'`, line: n.position?.start.line });
      if (n.type === 'image' && !n.alt) problems.push({ level: 'error', message: `Image without alt text: ${u}`, line: n.position?.start.line });
    }
  });
  return { id, path, frontMatter, tree, widgets, problems };
}

export function walk(node: any, fn: (n: any) => void) {
  fn(node);
  if (node.children) for (const c of node.children) walk(c, fn);
}

export function parseFrontMatterOnly(src: string): FrontMatter | null {
  const m = /^---\n([\s\S]*?)\n---/.exec(src);
  if (!m) return null;
  try { return YAML.parse(m[1]); } catch { return null; }
}

/**
 * YAML errors are accurate but not actionable for course authors. By far the most common mistake is an
 * unquoted value containing a colon (`hint: Skip a key: C, E, G`), which YAML reads as a nested mapping.
 * Point at the offending line and show the fix.
 */
export function yamlHint(err: Error, body: string[]): string {
  const msg = err.message;
  const culprit = (test: RegExp) => body.find((l) => test.test(l));
  if (/Invalid escape sequence/.test(msg))
    return '\n         A backslash inside double quotes starts a YAML escape. For LaTeX, use single quotes instead.';
  if (/Nested mappings are not allowed|Implicit map keys need to be followed|Implicit keys need to be on a single line/.test(msg)) {
    const line = culprit(/^\s*[A-Za-z_][\w-]*:\s+[^"'|>\[{].*:/);
    const key = line ? /^\s*([\w-]+):/.exec(line)?.[1] : undefined;
    const value = line ? line.slice(line.indexOf(':') + 1).trim() : '';
    // Suggest single quotes when the value has a backslash: double quotes would corrupt any LaTeX in it.
    const fixed = !line ? undefined : value.includes('\\')
      ? `${key}: '${value.replace(/'/g, "''")}'`
      : `${key}: "${value.replace(/"/g, '\\"')}"`;
    return `\n         A value containing a colon must be quoted.${fixed ? ` Try:\n           ${fixed}` : ''}`;
  }
  if (/Flow map contains an unexpected|Flow sequence contains an unexpected/.test(msg))
    return '\n         A flow-style value ({...} or [...]) containing a comma or colon must be quoted.';
  if (/Tab characters/.test(msg)) return '\n         YAML does not allow tabs for indentation — use spaces.';
  if (/All mapping items must start at the same column|Unexpected scalar/.test(msg))
    return '\n         Check the indentation: every key in a block must start at the same column.';
  return '';
}
