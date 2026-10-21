import { Component, lazy, Suspense, useEffect, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import type { WidgetDef } from '@tome/core';
import { MultipleChoice } from './MultipleChoice.tsx';
import { NumericInput } from './NumericInput.tsx';
import { FillBlank } from './FillBlank.tsx';
import { FreeText } from './FreeText.tsx';
import { Flashcards } from './Flashcards.tsx';
import { Ordering } from './Ordering.tsx';
import { Matching } from './Matching.tsx';
import { Dictation } from './Dictation.tsx';

// Heavy or rarely-needed widgets load on demand: CodeMirror, canvas, SVG-heavy ones. Keeps the initial bundle small on slow networks.
const CodeExercise = lazy(() => import('./CodeExercise.tsx').then((m) => ({ default: m.CodeExercise })));
const Sketch = lazy(() => import('./Sketch.tsx').then((m) => ({ default: m.Sketch })));
const Board = lazy(() => import('./Board.tsx').then((m) => ({ default: m.Board })));
const Score = lazy(() => import('./Score.tsx').then((m) => ({ default: m.Score })));
const Keyboard = lazy(() => import('./Keyboard.tsx').then((m) => ({ default: m.Keyboard })));
const Hotspot = lazy(() => import('./Hotspot.tsx').then((m) => ({ default: m.Hotspot })));
const TableInput = lazy(() => import('./TableInput.tsx').then((m) => ({ default: m.TableInput })));
const Molecule = lazy(() => import('./Molecule.tsx').then((m) => ({ default: m.Molecule })));
const Simulation = lazy(() => import('./Simulation.tsx').then((m) => ({ default: m.Simulation })));
const Plot = lazy(() => import('./Plot.tsx').then((m) => ({ default: m.Plot })));
const GeometryWidget = lazy(() => import('./Geometry.tsx').then((m) => ({ default: m.GeometryWidget })));
const SliderExplore = lazy(() => import('./SliderExplore.tsx').then((m) => ({ default: m.SliderExplore })));
const Record = lazy(() => import('./Record.tsx').then((m) => ({ default: m.Record })));

export interface WidgetProps<T = any> { def: T; courseId: string; courseDir: string; assetUrl: (p: string) => string }

const registry: Record<string, ComponentType<WidgetProps>> = {
  'multiple-choice': MultipleChoice,
  'numeric-input': NumericInput,
  'slider-explore': SliderExplore,
  'geometry': GeometryWidget,
  'code-exercise': CodeExercise,
  'fill-blank': FillBlank,
  'free-text': FreeText,
  'flashcards': Flashcards,
  'ordering': Ordering,
  'matching': Matching,
  'dictation': Dictation,
  'record': Record,
  'sketch': Sketch,
  'board': Board,
  'plot': Plot,
  'score': Score,
  'keyboard': Keyboard,
  'hotspot': Hotspot,
  'table-input': TableInput,
  'molecule': Molecule,
  'simulation': Simulation,
};

/** Rough height per widget type, used for the placeholder so the scrollbar and anchors stay stable before mount. */
const ESTIMATE: Record<string, number> = { 'code-exercise': 520, 'sketch': 560, 'board': 620, 'plot': 420, 'score': 260, 'keyboard': 260, 'hotspot': 480, 'table-input': 300, 'molecule': 380, 'simulation': 480, 'geometry': 380, 'slider-explore': 420, 'flashcards': 220, 'matching': 320, 'ordering': 380, 'record': 260, 'dictation': 200 };

/**
 * Virtualisation: a widget mounts only when it comes within ~1.5 screens of the viewport, and stays mounted afterwards
 * (unmounting would lose in-progress answers). Long lessons with many SVG/canvas widgets stay light on low-end WebViews.
 */
/**
 * One malformed widget must not blank the lesson. This matters most while authoring, when a body is
 * half-typed, but a published course can hit it too — via a field a newer player validates differently.
 */
class WidgetBoundary extends Component<{ id: string; type: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(`Widget '${this.props.id}' failed to render`, error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="widget widget-placeholder">
        <span className="eyebrow">{this.props.type}</span>
        This exercise could not be displayed. The rest of the lesson is unaffected.
        <span className="dim small"> ({this.props.id}: {this.state.error.message})</span>
      </div>
    );
  }
}

export function Widget(p: WidgetProps<WidgetDef>) {
  const C = registry[p.def.type];
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(ref.current); return () => io.disconnect();
  }, [near]);
  if (!C) return <div className="widget widget-placeholder"><span className="eyebrow">{p.def.type}</span>This widget type isn't implemented in the prototype yet.</div>;
  const fallback = <div className="widget widget-pending" style={{ minHeight: ESTIMATE[p.def.type] ?? 180 }} aria-busy="true"><span className="eyebrow">{p.def.type.replace('-', ' ')}</span></div>;
  return <div ref={ref} id={`widget-${p.def.id}`} className="widget-slot"><WidgetBoundary id={p.def.id} type={p.def.type}>{near ? <Suspense fallback={fallback}><C {...p} /></Suspense> : fallback}</WidgetBoundary></div>;
}
