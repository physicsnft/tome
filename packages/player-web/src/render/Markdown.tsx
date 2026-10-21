import { Fragment, type ReactNode } from 'react';
import { Tex } from './Math.tsx';
import { LazyCode as Code } from './LazyCode.tsx';
import type { ParsedLesson } from '@tome/core';
import type { LoadedCourse } from '../lib/course.ts';
import { ListeningGroup } from '../widgets/Listening.tsx';
import { ZoomableImage } from './Zoom.tsx';

export interface RenderCtx {
  course: LoadedCourse;
  lesson: ParsedLesson;
  renderWidget: (index: number) => ReactNode;
  renderCheckpoint: (index: number, children: ReactNode) => ReactNode;
  onNavigate: (lessonId: string, anchor?: string) => void;
  isComplete: (widgetIndex: number) => boolean;
}

const slug = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
const textOf = (n: any): string => (n.value ?? (n.children ?? []).map(textOf).join(''));

let checkpointCounter = 0;
/** Inline slots: `\u2063N\u2063` tokens in text nodes are replaced by React nodes (used by fill-blank so emphasis can span a blank). */
export let slots: ReactNode[] | null = null;
/** Asset resolver for Markdown rendered without a lesson context (widget text). Set by <Md>. */
let currentAssetUrl: ((p: string) => string) | null = null;
export function withAssetUrl<T>(f: ((p: string) => string) | null, fn: () => T): T { const prev = currentAssetUrl; currentAssetUrl = f; try { return fn(); } finally { currentAssetUrl = prev; } }
export function withSlots<T>(s: ReactNode[] | null, f: () => T): T { const prev = slots; slots = s; try { return f(); } finally { slots = prev; } }
const SLOT = /\u2063(\d+)\u2063/;
function textWithSlots(v: string): ReactNode {
  if (!slots || !SLOT.test(v)) return v;
  return v.split(/(\u2063\d+\u2063)/).map((part, i) => { const m = SLOT.exec(part); return m ? <Fragment key={i}>{slots![Number(m[1])]}</Fragment> : part; });
}
export function resetCounters() { checkpointCounter = 0; }

export function renderNodes(nodes: any[], ctx: RenderCtx | null): ReactNode[] {
  return nodes.map((n, i) => <Fragment key={i}>{renderNode(n, ctx)}</Fragment>);
}

function renderNode(n: any, ctx: RenderCtx | null): ReactNode {
  const kids = () => renderNodes(n.children ?? [], ctx);
  switch (n.type) {
    case 'paragraph': {
      const t = n.children.length === 1 && n.children[0].type === 'text' ? /^@@widget:(\d+)@@$/.exec(n.children[0].value) : null;
      if (t && ctx) return ctx.renderWidget(Number(t[1]));
      return <p>{kids()}</p>;
    }
    case 'heading': { const Tag = `h${n.depth}` as any; return <Tag id={slug(textOf(n))}>{kids()}</Tag>; }
    case 'text': return textWithSlots(n.value);
    case 'emphasis': return <em>{kids()}</em>;
    case 'strong': return <strong>{kids()}</strong>;
    case 'delete': return <del>{kids()}</del>;
    case 'inlineCode': return <code>{n.value}</code>;
    case 'code': return <Code code={n.value} lang={n.lang ?? undefined} />;
    case 'inlineMath': return <Tex src={n.value} />;
    case 'math': return <Tex src={n.value} display />;
    case 'break': return <br />;
    case 'thematicBreak': return <hr />;
    case 'blockquote': return <blockquote>{kids()}</blockquote>;
    case 'list': return n.ordered ? <ol start={n.start ?? 1}>{kids()}</ol> : <ul>{kids()}</ul>;
    case 'listItem': return <li className={n.checked != null ? 'task' : ''}>{n.checked != null && <input type="checkbox" checked={n.checked} readOnly />}{n.children.map((c: any, i: number) => c.type === 'paragraph' && n.spread === false ? <Fragment key={i}>{renderNodes(c.children, ctx)}</Fragment> : <Fragment key={i}>{renderNode(c, ctx)}</Fragment>)}</li>;
    case 'table': {
      const [head, ...rows] = n.children;
      const cell = (c: any, j: number, Tag: 'th' | 'td') => <Tag key={j} style={{ textAlign: n.align?.[j] ?? undefined }}>{renderNodes(c.children, ctx)}</Tag>;
      return <div className="table-wrap"><table><thead><tr>{head.children.map((c: any, j: number) => cell(c, j, 'th'))}</tr></thead><tbody>{rows.map((r: any, i: number) => <tr key={i}>{r.children.map((c: any, j: number) => cell(c, j, 'td'))}</tr>)}</tbody></table></div>;
    }
    case 'link': {
      const url: string = n.url;
      if (url.startsWith('lesson:') && ctx) {
        const [id, anchor] = url.slice(7).split('#');
        return <a href={`#${url}`} onClick={(e) => { e.preventDefault(); ctx.onNavigate(id, anchor); }}>{kids()}</a>;
      }
      if (url.startsWith('#')) return <a href={url}>{kids()}</a>;
      return <a href={url} target="_blank" rel="noopener noreferrer">{kids()}</a>;
    }
    case 'image': {
      const resolve = ctx ? ctx.course.assetUrl : currentAssetUrl;
      const src = resolve ? resolve(n.url) : n.url;
      // Prose images can be opened full-size; images inside widgets (an option, a flashcard) must stay
      // plain, or tapping one would zoom instead of selecting it.
      return ctx ? <ZoomableImage src={src} alt={n.alt ?? ''} title={n.title ?? undefined} />
                 : <img src={src} alt={n.alt ?? ''} title={n.title ?? undefined} />;
    }
    case 'containerDirective': return renderDirective(n, ctx);
    case 'leafDirective': case 'textDirective': return <span className="placeholder">Unsupported directive ::{n.name}</span>;
    case 'yaml': return null;
    default: return <div className="placeholder">Unsupported block: {n.type}</div>;
  }
}

function renderDirective(n: any, ctx: RenderCtx | null): ReactNode {
  const a = n.attributes ?? {};
  const kids = () => renderNodes(n.children ?? [], ctx);
  switch (n.name) {
    case 'note': case 'tip': case 'warning': case 'important':
      return <aside className={`callout callout-${n.name}`}><div className="callout-title">{a.title ?? n.name}</div>{kids()}</aside>;
    case 'details': return <details className="details"><summary>{a.summary ?? 'Details'}</summary><div>{kids()}</div></details>;
    case 'checkpoint': return ctx ? ctx.renderCheckpoint(checkpointCounter++, kids()) : null;
    case 'figure': return <figure>{kids()}{a.credit && <p className="credit">{String(a.credit)}</p>}</figure>;
    case 'columns': return <div className="columns">{kids()}</div>;
    case 'column': return <div className="column">{kids()}</div>;
    case 'video': return ctx ? <figure><video controls src={ctx.course.assetUrl(a.src)} poster={a.poster ? ctx.course.assetUrl(a.poster) : undefined} />{kids()}</figure> : null;
    case 'audio': return ctx ? <figure><audio controls src={ctx.course.assetUrl(a.src)} />{kids()}</figure> : null;
    case 'listening': {
      if (!ctx) return null;
      const widgetIdx = (n.children ?? []).map((c: any) => c.type === 'paragraph' ? /^@@widget:(\d+)@@$/.exec(c.children?.[0]?.value ?? '')?.[1] : null).filter(Boolean).map(Number);
      const transcript = (n.children ?? []).find((c: any) => c.type === 'containerDirective' && c.name === 'transcript');
      const body = (n.children ?? []).filter((c: any) => c !== transcript);
      return <ListeningGroup attrs={a} assetUrl={ctx.course.assetUrl} complete={widgetIdx.every((i: number) => ctx.isComplete(i))} transcript={transcript ? renderNodes(transcript.children, ctx) : null}>{renderNodes(body, ctx)}</ListeningGroup>;
    }
    case 'transcript': return null;
    case 'lottie': return <div className="placeholder">Animation (lottie) not implemented in prototype</div>;
    default: return <div className="placeholder">This content requires a newer app version (:::{n.name})</div>;
  }
}
