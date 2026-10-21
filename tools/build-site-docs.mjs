#!/usr/bin/env node
/**
 * Turns docs/AUTHORING.md and docs/SPEC.md into pages of the website (SITE_DIR, default ./site):
 *   authors/guide/index.html   — the authoring guide
 *   authors/format/index.html  — the format specification
 *
 * The Markdown files stay the source of truth (their examples are checked by `npm run check-docs`); run
 * `npm run site` after changing them and commit the result. `npm test` fails if the pages are out of date.
 *
 *   node tools/build-site-docs.mjs          write the pages
 *   node tools/build-site-docs.mjs --check  exit 1 if the pages differ from what would be written
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The website is its own repository. Point SITE_DIR at your checkout of it (default: a site/ folder in this one).
const SITE = process.env.SITE_DIR ?? join(ROOT, 'site');
if (!existsSync(SITE)) { console.log(`site: no website folder at ${SITE}, so nothing to build or check (set SITE_DIR to your website checkout)`); process.exit(0); }
const check = process.argv.includes('--check');

const PAGES = [
  {
    src: 'docs/AUTHORING.md', out: 'authors/guide/index.html', title: 'Tome authoring guide', nav: 'guide',
    description: 'How to write, check, sign and share a Tome course: a tutorial that takes about an hour.',
    eyebrow: 'Authoring guide', tocDepth: 3,
  },
  {
    src: 'docs/SPEC.md', out: 'authors/format/index.html', title: 'Tome course format', nav: 'format',
    description: 'The open .course format: bundle, manifest, signature, lessons and every widget, specified.',
    eyebrow: 'Format specification', tocDepth: 2,
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slugify = (text) => plain(text).toLowerCase().replace(/[`'"’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

function render(page) {
  let md = readFileSync(join(ROOT, page.src), 'utf8');
  // The website leaves out what is not public yet (buying and selling courses). In the Markdown:
  //   <!-- not-on-site --> … <!-- /not-on-site -->   kept in the repository docs, dropped from the site
  //   <!-- site-only … -->                            shown on the site only (a comment everywhere else)
  md = md
    .replace(/<!-- not-on-site -->[\s\S]*?<!-- \/not-on-site -->\n?/g, '')
    .replace(/<!-- site-only\n([\s\S]*?)\n-->/g, '$1')
    // The manifest example's issuedTo object (personal copies, SPEC §3.4) and references to that section.
    .replace(/^[ \t]*"issuedTo": \{[\s\S]*?^[ \t]*\}\n/m, '')
    .replace(/ \(§3\.4\)\./g, '.');
  // Cross-references between the two documents become links between the two pages (outside code only).
  md = md.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((part, i) => (i % 2 ? part : part
    .replace(/\*\*SPEC\.md\*\*/g, '**[SPEC.md](/authors/format/)**')
    .replace(/(?<![\[\/\w])SPEC\.md(?!\])/g, '[SPEC.md](/authors/format/)')
    .replace(/(?<![\[\/\w])AUTHORING\.md(?!\])/g, '[AUTHORING.md](/authors/guide/)'))).join('');

  const toc = [];
  const used = new Map();
  let title = page.title;
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(text, depth) {
        if (depth === 1) { title = plain(text); return ''; } // the page header shows the document title
        let id = slugify(text); const n = used.get(id) ?? 0; used.set(id, n + 1); if (n) id += `-${n}`;
        if (depth <= page.tocDepth) toc.push({ depth, id, text: plain(text) });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
      },
      table(header, body) { return `<div class="table"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`; },
      link(href, linkTitle, text) {
        const external = /^https?:\/\//.test(href ?? '');
        return `<a href="${esc(href ?? '')}"${linkTitle ? ` title="${esc(linkTitle)}"` : ''}${external ? ' rel="noopener"' : ''}>${text}</a>`;
      },
    },
  });
  const body = marked.parse(md);

  const tocHtml = toc.map((t) => `<li class="d${t.depth}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('\n');
  const navLink = (key, href, label) => `<a href="${href}"${page.nav === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(page.description)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="authors">
<!-- Generated by tools/build-site-docs.mjs from ${page.src}. Edit the Markdown, then run npm run site. -->

<header class="wrap nav">
  <a class="brand" href="/authors/"><img src="/favicon.svg" alt="" width="28" height="28">Tome <span class="sub">for authors</span></a>
  <nav class="nav-links" aria-label="Authors">
    ${navLink('guide', '/authors/guide/', 'Guide')}
    ${navLink('format', '/authors/format/', 'Format')}
    <a class="hide-sm" href="/">For learners</a>
  </nav>
</header>

<div class="wrap docs">
  <aside class="docs-toc" aria-label="On this page">
    <p class="toc-title">On this page</p>
    <ol>
${tocHtml}
    </ol>
  </aside>
  <details class="docs-toc-sm">
    <summary>On this page</summary>
    <ol>
${tocHtml}
    </ol>
  </details>
  <main class="docs-body">
    <p class="eyebrow">${esc(page.eyebrow)}</p>
    <h1>${esc(title)}</h1>
${body}
  </main>
</div>

<footer class="wrap foot">
  <span>© 2026 Tome</span>
  <nav aria-label="Footer">
    <a href="/authors/">For authors</a>
    <a href="/">For learners</a>
    <a href="/privacy/">Privacy</a>
    <a href="mailto:hello@tome.courses">hello@tome.courses</a>
  </nav>
</footer>

</body>
</html>
`;
}

let stale = 0;
for (const page of PAGES) {
  const html = render(page);
  const out = join(SITE, page.out);
  if (check) {
    if (!existsSync(out) || readFileSync(out, 'utf8') !== html) { console.error(`${page.out} is out of date: run npm run site`); stale++; }
    continue;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`wrote ${page.out}`);
}
if (check && !stale) console.log('site: author pages match docs/');
process.exit(stale ? 1 : 0);
