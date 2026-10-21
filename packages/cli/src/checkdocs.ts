/**
 * `tome check-docs <file.md…>` — run every example in the documentation through the real parser.
 *
 * Authoring guides rot: an example is written once, the format moves, and the guide quietly teaches
 * something that no longer validates. Extracting the examples and validating them with the same code the
 * player uses is the cheapest possible cure, and it turns doc rot into a failing command.
 *
 * Two kinds of block are checked:
 *   ```md          a lesson fragment: parsed as Markdown, widgets validated
 *   ```jsonc/json  a manifest fragment, if it contains "formatVersion"
 * A block tagged with `<!-- check-docs: skip -->` on the line before is ignored (deliberately broken
 * examples — the guide has several, and they should stay broken).
 */
import { readFileSync } from 'node:fs';
import { parseLesson, validateManifest } from '@tome/core';

interface Block { lang: string; body: string; line: number; skip: boolean }

export function extractBlocks(src: string): Block[] {
  const lines = src.split('\n');
  const out: Block[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(`{3,})([a-z]*)\s*$/.exec(lines[i]);
    if (!m) continue;
    const fence = m[1];
    const skip = /check-docs:\s*skip/.test(lines[i - 1] ?? '');
    const body: string[] = [];
    let j = i + 1;
    while (j < lines.length && lines[j] !== fence) body.push(lines[j++]);
    out.push({ lang: m[2], body: body.join('\n'), line: i + 1, skip });
    i = j;
  }
  return out;
}

/** Remove // comments and trailing commas, respecting strings — a comment may itself contain quotes. */
export function stripJsonc(src: string): string {
  let out = '', inString = false, escaped = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

export function checkDocsCommand(files: string[]) {
  let checked = 0, failed = 0;
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    for (const b of extractBlocks(src)) {
      if (b.skip || !b.body.trim()) continue;
      const problems: string[] = [];
      if (b.lang === 'md' && (b.body.includes(':::') || b.body.startsWith('---'))) {
        checked++;
        // Front matter is optional in a fragment; add a stub so the parser does not complain about a
        // missing title when the example is only showing a widget.
        const text = b.body.startsWith('---') ? b.body : `---\ntitle: Example\n---\n\n${b.body}`;
        problems.push(...parseLesson(file, text).problems.filter((p) => p.level === 'error').map((p) => p.message));
      } else if ((b.lang === 'json' || b.lang === 'jsonc') && b.body.includes('formatVersion')) {
        checked++;
        const stripped = stripJsonc(b.body);
        try {
          const m = JSON.parse(stripped);
          // A manifest.json.in is written with `"contentHashes": {}` — the build fills it. Documentation
          // shows the source form, so stand one in rather than reporting an error an author cannot fix.
          if (m.contentHashes && Object.keys(m.contentHashes).length === 0) m.contentHashes = { 'lessons/01.md': 'sha256:' + '0'.repeat(64) };
          problems.push(...validateManifest(m));
        } catch (e) { problems.push(`not valid JSON after stripping comments: ${(e as Error).message}`); }
      } else continue;

      if (problems.length) {
        failed++;
        console.log(`  FAIL  ${file}:${b.line}`);
        for (const p of problems.slice(0, 6)) console.log(`        ${p}`);
      }
    }
  }
  console.log(`\n${checked} example${checked === 1 ? '' : 's'} checked, ${failed} failing.`);
  process.exit(failed ? 1 : 0);
}
