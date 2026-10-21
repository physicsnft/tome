/**
 * `tome regions <image>` — draw hotspot regions on an image and get the YAML.
 *
 * Percentage coordinates are fine to write by hand for a diagram you drew yourself, and miserable for a
 * photograph. This opens a one-page local editor: click to place circles, drag for rects, click-click-…-Enter
 * for polygons. The YAML updates live and can be copied straight into a `:::widget type="hotspot"` block.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export function regionsCommand(imagePath: string, assetPath: string | undefined, port = 4380) {
  const file = resolve(imagePath);
  if (!existsSync(file)) { console.error(`No such image: ${file}`); process.exit(1); }
  const mime = MIME[extname(file).toLowerCase()];
  if (!mime) { console.error(`Not an image Tome supports: ${basename(file)}`); process.exit(1); }
  // The path the course will use; guessed from the file location unless given.
  const asset = assetPath ?? (file.includes('/assets/') ? 'assets/' + file.split('/assets/')[1] : `assets/images/${basename(file)}`);

  const server = createServer((req, res) => {
    if (req.url === '/image') { res.writeHead(200, { 'content-type': mime }); return res.end(readFileSync(file)); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page(asset));
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Region editor: http://127.0.0.1:${port}`);
    console.log(`Image: ${basename(file)}   asset path: ${asset}`);
    console.log('Ctrl-C when you are done.');
  });
}

const page = (asset: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Tome — regions</title>
<style>
 :root { --ink:#1b2030; --rule:#e3e6ec; --primary:#2b4acb; }
 body { margin:0; font:15px/1.5 -apple-system,system-ui,sans-serif; color:var(--ink); background:#f7f8fa; }
 header { padding:.7rem 1rem; background:#fff; border-bottom:1px solid var(--rule); display:flex; gap:.8rem; align-items:center; flex-wrap:wrap; }
 button { font:inherit; padding:.3rem .7rem; border:1px solid var(--rule); background:#fff; border-radius:6px; cursor:pointer; }
 button.on { background:var(--ink); color:#fff; border-color:var(--ink); }
 main { display:grid; grid-template-columns:minmax(0,1fr) minmax(22rem,26rem); gap:1rem; padding:1rem; align-items:start; }
 main > div:last-child { min-width:0; }
 .stage { position:relative; background:#fff; border:1px solid var(--rule); border-radius:8px; }
 .stage img { width:100%; display:block; border-radius:8px; }
 svg { position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; }
 .shape { fill:rgba(43,74,203,.18); stroke:var(--primary); stroke-width:.4; }
 .shape.sel { fill:rgba(194,65,12,.22); stroke:#c2410c; }
 textarea { width:100%; height:32rem; font:13px/1.5 ui-monospace,monospace; border:1px solid var(--rule); border-radius:8px; padding:.6rem; }
 ul { list-style:none; padding:0; margin:.4rem 0; } li { display:flex; gap:.4rem; align-items:center; padding:.15rem 0; }
 li input { flex:1; min-width:0; font:inherit; padding:.2rem .4rem; border:1px solid var(--rule); border-radius:4px; }
 .hint { color:#6b7280; font-size:.85rem; }
</style></head><body>
<header>
  <strong>Regions</strong>
  <button id="t-circle" class="on">Circle</button><button id="t-rect">Rect</button><button id="t-polygon">Polygon</button>
  <span class="hint" id="hint">Click to place a circle, then drag to size it.</span>
  <span style="margin-left:auto"></span>
  <button id="undo">Undo</button><button id="copy">Copy YAML</button>
</header>
<main>
  <div class="stage"><img src="/image" alt=""><svg id="ov" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div>
  <div>
    <ul id="list"></ul>
    <textarea id="yaml" readonly></textarea>
    <p class="hint">Coordinates are percentages of the image box, so they survive any resize.</p>
  </div>
</main>
<script>
const asset = ${JSON.stringify(asset)};
let tool = 'circle', regions = [], draft = null, sel = -1;
const ov = document.getElementById('ov'), list = document.getElementById('list'), yaml = document.getElementById('yaml');
const hints = { circle:'Click to place a circle, then drag to size it.', rect:'Drag a rectangle.', polygon:'Click each corner; double-click or Enter to close.' };
for (const t of ['circle','rect','polygon']) document.getElementById('t-'+t).onclick = () => {
  tool = t; draft = null;
  for (const x of ['circle','rect','polygon']) document.getElementById('t-'+x).classList.toggle('on', x===t);
  document.getElementById('hint').textContent = hints[t]; render();
};
const pos = (e) => { const r = ov.getBoundingClientRect(); return [ +(100*(e.clientX-r.left)/r.width).toFixed(1), +(100*(e.clientY-r.top)/r.height).toFixed(1) ]; };
const round = (n) => +n.toFixed(1);
ov.addEventListener('pointerdown', (e) => {
  const [x,y] = pos(e);
  if (tool === 'polygon') { draft = draft ?? { shape:'polygon', at:[] }; draft.at.push(x,y); render(); return; }
  draft = tool === 'circle' ? { shape:'circle', at:[x,y,1] } : { shape:'rect', at:[x,y,0,0] };
  ov.setPointerCapture(e.pointerId); render();
});
ov.addEventListener('pointermove', (e) => {
  if (!draft || tool === 'polygon') return;
  const [x,y] = pos(e);
  if (draft.shape === 'circle') draft.at[2] = round(Math.hypot(x-draft.at[0], y-draft.at[1]));
  else { draft.at[2] = round(Math.abs(x-draft.at[0])); draft.at[3] = round(Math.abs(y-draft.at[1])); draft.at[0] = round(Math.min(x,draft.at[0])); draft.at[1] = round(Math.min(y,draft.at[1])); }
  render();
});
ov.addEventListener('pointerup', () => { if (!draft || tool === 'polygon') return; commit(); });
ov.addEventListener('dblclick', () => { if (tool === 'polygon' && draft && draft.at.length >= 6) commit(); });
addEventListener('keydown', (e) => { if (e.key === 'Enter' && tool === 'polygon' && draft && draft.at.length >= 6) commit(); if (e.key === 'Escape') { draft = null; render(); } });
document.getElementById('undo').onclick = () => { draft ? draft = null : regions.pop(); render(); };
document.getElementById('copy').onclick = async () => { await navigator.clipboard.writeText(yaml.value); };
function commit() {
  const n = regions.length + 1;
  regions.push({ id:'region-'+n, label:'Region '+n, ...draft });
  draft = null; render();
}
function shapeEl(r, i) {
  const cls = 'shape' + (i === sel ? ' sel' : '');
  if (r.shape === 'circle') return \`<circle class="\${cls}" cx="\${r.at[0]}" cy="\${r.at[1]}" r="\${r.at[2]}"/>\`;
  if (r.shape === 'rect') return \`<rect class="\${cls}" x="\${r.at[0]}" y="\${r.at[1]}" width="\${r.at[2]}" height="\${r.at[3]}"/>\`;
  const pts = r.at.reduce((a,v,j) => j%2 ? (a[a.length-1] += ','+v, a) : (a.push(''+v), a), []);
  return \`<polygon class="\${cls}" points="\${pts.join(' ')}"/>\`;
}
// Overlay and list are redrawn separately: rebuilding the list while a name field has focus would
// destroy the input the author is typing into.
function drawOverlay() { ov.innerHTML = regions.map(shapeEl).join('') + (draft ? shapeEl(draft, -2) : ''); }
function render() {
  drawOverlay();
  list.innerHTML = regions.map((r,i) => \`<li><span>\${r.shape[0].toUpperCase()}</span><input data-i="\${i}" data-k="id" value="\${r.id}"><input data-i="\${i}" data-k="label" value="\${r.label}"><button data-del="\${i}">✕</button></li>\`).join('');
  list.querySelectorAll('input').forEach((el) => {
    el.oninput = () => { regions[+el.dataset.i][el.dataset.k] = el.value; writeYaml(); };
    el.onfocus = () => { sel = +el.dataset.i; drawOverlay(); };
    el.onblur = () => { sel = -1; drawOverlay(); };
  });
  list.querySelectorAll('button[data-del]').forEach((el) => el.onclick = () => { regions.splice(+el.dataset.del,1); render(); });
  writeYaml();
}
function writeYaml() {
  const lines = ['image: ' + asset, 'alt: DESCRIBE THE WHOLE IMAGE HERE', 'prompt: |', '  Your question here.', 'regions:'];
  for (const r of regions) {
    lines.push('  - id: ' + r.id, '    label: ' + JSON.stringify(r.label), '    shape: ' + r.shape, '    at: [' + r.at.join(', ') + ']');
  }
  lines.push('answer:', '  kind: click', '  accept: [' + (regions[0]?.id ?? 'region-1') + ']');
  yaml.value = lines.join('\\n');
}
render();
</script></body></html>`;
