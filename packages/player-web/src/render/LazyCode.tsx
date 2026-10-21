import { useEffect, useState, type ComponentType } from 'react';

/** Fenced code in prose: the Lezer grammars live in the CodeMirror chunk, loaded only when a lesson has code. */
export function LazyCode({ code, lang }: { code: string; lang?: string }) {
  const [C, setC] = useState<ComponentType<{ code: string; lang?: string }> | null>(null);
  useEffect(() => { let live = true; import('./highlight.tsx').then((m) => live && setC(() => m.Code)); return () => { live = false; }; }, []);
  return C ? <C code={code} lang={lang} /> : <pre className={`code ${lang ? 'lang-' + lang : ''}`}><code>{code}</code></pre>;
}
