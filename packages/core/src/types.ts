import type { Root } from 'mdast';

export interface Manifest {
  formatVersion: string;
  id: string;
  version: string;
  title: string;
  subtitle?: string;
  description: string;
  language: string;
  authors: { name: string; id?: string }[];
  tags?: string[];
  level?: string;
  estimatedMinutes?: number;
  cover: string;
  structure: { id: string; title: string; lessons: string[] }[];
  contentHashes: Record<string, string>;
  license?: string;
  bestOn?: string[];
  uses?: string[];
  assetsByAuthor?: boolean;
  credits?: Credit[];
  /** Added by the store to a purchased copy (§3.4). Never written by authors. */
  issuedTo?: IssuedTo;
}

/**
 * Whom a purchased copy was issued to (§3.4). `order` is what traces a copy: it leads to a payment. `subject` is the
 * opaque account (or anonymous install) id. `name` is only a display name the buyer chose — never an email address.
 */
export interface IssuedTo { order: string; subject: string; issuedAt: string; name?: string }

/** Attribution for one asset (§3.3). `source` is informative and never fetched. */
export interface Credit { asset: string; title?: string; creator: string; source?: string; license?: string; modified?: string }

export interface FrontMatter { title: string; estimatedMinutes?: number; summary?: string }

/** Any widget body after YAML parsing, with directive attributes merged in. */
export interface WidgetDef {
  type: string;
  id: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface ParsedLesson {
  id: string;
  path: string;
  frontMatter: FrontMatter;
  /** mdast root. Widget positions are paragraphs whose single text child is `@@widget:N@@`. */
  tree: Root;
  widgets: WidgetDef[];
  problems: Problem[];
}

export interface Problem { level: 'error' | 'warning'; message: string; line?: number }

/** Types that are graded by default. `score` is graded only when it carries an `answer` — see isGraded(). */
export const GRADED_TYPES = new Set(['multiple-choice', 'numeric-input', 'free-text', 'fill-blank', 'ordering', 'matching', 'code-exercise', 'dictation', 'record', 'sketch', 'board', 'score', 'keyboard', 'hotspot', 'table-input', 'molecule', 'simulation']);

/** Whether a widget instance counts toward a checkpoint by default. */
const ANSWER_OPTIONAL = new Set(['score', 'molecule', 'simulation', 'hotspot']);
export const isGraded = (w: { type: string; answer?: unknown }) => (ANSWER_OPTIONAL.has(w.type) ? w.answer !== undefined : GRADED_TYPES.has(w.type));
export const KNOWN_DIRECTIVES = new Set(['note', 'tip', 'warning', 'important', 'video', 'audio', 'lottie', 'figure', 'details', 'checkpoint', 'widget', 'columns', 'column', 'listening', 'transcript']);
