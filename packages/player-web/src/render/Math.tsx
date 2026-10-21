import { useEffect, useState } from 'react';

// KaTeX (≈260 kB) loads on first use; lessons without math never pay for it.
type Katex = { renderToString: (tex: string, o?: Record<string, unknown>) => string };
let katexP: Promise<Katex> | null = null;
// mhchem adds \ce{} and \pu{} for chemical equations and units; it loads with KaTeX, on first use only.
const loadKatex = () => (katexP ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')])
  .then(([m]) => import('katex/dist/contrib/mhchem.mjs').then(() => (m.default ?? m) as Katex)));

export function Tex({ src, display = false }: { src: string; display?: boolean }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadKatex().then((k) => { if (!live) return; try { setHtml(k.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false })); } catch { setHtml(`<code>${src}</code>`); } });
    return () => { live = false; };
  }, [src, display]);
  if (html === null) return display ? <div className="math-block math-pending"><code>{src}</code></div> : <code className="math-pending">{src}</code>;
  return display ? <div className="math-block" dangerouslySetInnerHTML={{ __html: html }} /> : <span dangerouslySetInnerHTML={{ __html: html }} />;
}
