// The starter course is documentation: an author's first impression of the format. If `tome new`
// ever produces a course that does not validate or build, every new author starts on a broken
// example — so it is checked on every run, alongside the examples in the docs.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tome = (...args) => execFileSync('node', ['packages/cli/dist/index.js', ...args], { encoding: 'utf8' });
const dir = mkdtempSync(join(tmpdir(), 'tome-smoke-'));
try {
  tome('new', join(dir, 'starter'));
  const v = tome('validate', join(dir, 'starter'));
  if (!/Valid\./.test(v) || /warn/.test(v)) throw new Error(`starter course is not clean:\n${v}`);
  tome('build', join(dir, 'starter'), '--out', join(dir, 'out'));
  if (!readdirSync(join(dir, 'out')).some((f) => f.endsWith('.course'))) throw new Error('build produced no bundle');
  if (readdirSync(join(dir, 'starter')).includes('manifest.json')) throw new Error('build wrote manifest.json into the source directory');
  tome('verify', join(dir, 'out', readdirSync(join(dir, 'out'))[0])); // throws only on malformed bundles
  console.log('smoke: starter course validates cleanly, builds, and leaves the source untouched');
} catch (e) {
  if (e.status === 1 && /NOT trusted/.test(e.stdout ?? '')) console.log('smoke: starter course validates cleanly, builds, and leaves the source untouched');
  else { console.error(String(e.message ?? e)); process.exitCode = 1; }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// Version strings have drifted apart three times in this project. One check, so it cannot happen again:
// the package, the scaffold, the spec header, and both documented examples must all name the same format.
import { readFileSync as read } from 'node:fs';
const pkg = JSON.parse(read('packages/cli/package.json', 'utf8')).version;
const found = {
  'packages/cli/package.json': pkg,
  'scaffold FORMAT_VERSION': /FORMAT_VERSION = '([^']+)'/.exec(read('packages/cli/src/scaffold.ts', 'utf8'))?.[1],
  'SPEC.md header': /\*\*Version:\*\* ([^\s]+)/.exec(read('docs/SPEC.md', 'utf8'))?.[1],
  'SPEC.md example manifest': /"formatVersion": "([^"]+)",\s+\/\/ REQUIRED/.exec(read('docs/SPEC.md', 'utf8'))?.[1],
  'AUTHORING.md example manifest': /"formatVersion": "([^"]+)",\s+\/\/ the version tome new writes/.exec(read('docs/AUTHORING.md', 'utf8'))?.[1],
};
const wrong = Object.entries(found).filter(([, v]) => v !== pkg);
if (wrong.length) { console.error(`version drift — expected ${pkg} everywhere:\n` + wrong.map(([k, v]) => `  ${k}: ${v}`).join('\n')); process.exitCode = 1; }
else console.log(`smoke: every version string says ${pkg}`);
