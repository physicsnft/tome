import { Fragment, type ReactNode, useMemo } from 'react';
import { highlightTree, classHighlighter } from '@lezer/highlight';
import { pythonLanguage } from '@codemirror/lang-python';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import type { Parser } from '@lezer/common';

const parsers: Record<string, Parser> = { python: pythonLanguage.parser, py: pythonLanguage.parser, javascript: javascriptLanguage.parser, js: javascriptLanguage.parser };

/** Static syntax highlighting for fenced code blocks and solutions. Same Lezer grammar as the editor. */
export function highlight(code: string, lang?: string): ReactNode {
  const parser = lang ? parsers[lang.toLowerCase()] : undefined;
  if (!parser) return code;
  const out: ReactNode[] = [];
  let pos = 0;
  highlightTree(parser.parse(code), classHighlighter, (from, to, cls) => {
    if (from > pos) out.push(code.slice(pos, from));
    out.push(<span key={from} className={cls}>{code.slice(from, to)}</span>);
    pos = to;
  });
  if (pos < code.length) out.push(code.slice(pos));
  return out.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}

export function Code({ code, lang }: { code: string; lang?: string }) {
  const nodes = useMemo(() => highlight(code, lang), [code, lang]);
  return <pre className={`code ${lang ? 'lang-' + lang : ''}`}><code>{nodes}</code></pre>;
}

