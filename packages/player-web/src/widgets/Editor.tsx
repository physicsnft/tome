import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, highlightSpecialChars } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { classHighlighter } from '@lezer/highlight';
import { closeBrackets } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';

const theme = EditorView.theme({
  '&': { backgroundColor: '#1b2030', color: '#e7e9f0', fontSize: '0.86rem' },
  '.cm-content': { fontFamily: 'var(--mono)', padding: '0.7rem 0', caretColor: '#fff' },
  '.cm-gutters': { backgroundColor: '#1b2030', color: '#5c647a', border: 'none', paddingLeft: '0.4rem' },
  '.cm-activeLine': { backgroundColor: '#252b3d' }, '.cm-activeLineGutter': { backgroundColor: '#252b3d' },
  '&.cm-focused': { outline: 'none', boxShadow: 'inset 0 0 0 2px var(--ink-primary)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#3b4a7a !important' },
  '.cm-matchingBracket': { backgroundColor: '#3b4a7a', outline: 'none' },
}, { dark: true });

export function Editor({ value, onChange, language, readOnly = false }: { value: string; onChange: (v: string) => void; language: 'python' | 'javascript'; readOnly?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange); cb.current = onChange;

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), highlightSpecialChars(), history(), drawSelection(), indentOnInput(), bracketMatching(), closeBrackets(), highlightActiveLine(),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          language === 'python' ? python() : javascript(),
          syntaxHighlighting(classHighlighter), theme, EditorState.tabSize.of(4),
          EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((u) => { if (u.docChanged) cb.current(u.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
  }, [language, readOnly]);

  // External resets (e.g. the Reset button) push the new value in without recreating the editor.
  useEffect(() => {
    const v = view.current; if (!v) return;
    const cur = v.state.doc.toString();
    if (cur !== value) v.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [value]);

  return <div ref={host} className="editor" aria-label="Code editor" />;
}
