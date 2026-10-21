import { useEffect, useRef, useState } from 'react';
import { Md } from '../render/Inline.tsx';

export type MediaDef = string | { src: string; transcript?: string; transcriptAfter?: 'always' | 'complete' | 'never'; playLimit?: number; speed?: number[] };
export const mediaSrc = (m: MediaDef) => (typeof m === 'string' ? m : m.src);

/**
 * Audio clip with play limit, speed selector and gated transcript (§7.7).
 * `attemptKey` resets the play count (limit is per attempt).
 */
export function AudioClip({ media, assetUrl, complete = false, attemptKey = 0, compact = false }: { media: MediaDef; assetUrl: (p: string) => string; complete?: boolean; attemptKey?: number; compact?: boolean }) {
  const m = typeof media === 'string' ? { src: media } : media;
  const audio = useRef<HTMLAudioElement>(null);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [showT, setShowT] = useState((typeof media === 'string' ? undefined : media.transcriptAfter) === 'always');
  useEffect(() => setPlays(0), [attemptKey]);
  const left = m.playLimit ? m.playLimit - plays : Infinity;
  const speeds = m.speed ?? [1];
  const transcriptMode = m.transcriptAfter ?? 'complete';
  const canShowT = !!m.transcript && (transcriptMode === 'always' || (transcriptMode === 'complete' && (complete || left <= 0)));

  const play = () => {
    const a = audio.current!;
    if (playing) { a.pause(); a.currentTime = 0; setPlaying(false); return; }
    if (left <= 0) return;
    a.playbackRate = rate; a.currentTime = 0; a.play(); setPlaying(true); setPlays((p) => p + 1);
  };
  return (
    <div className={`clip ${compact ? 'compact' : ''}`}>
      <audio ref={audio} src={assetUrl(m.src)} preload="metadata" onEnded={() => setPlaying(false)} />
      <button type="button" className={`play ${playing ? 'on' : ''}`} onClick={play} disabled={left <= 0 && !playing} aria-label={playing ? 'Stop' : 'Play'}>{playing ? '■' : '▶'}</button>
      {!compact && (
        <div className="clip-meta">
          {speeds.length > 1 && <span className="speeds">{speeds.map((s) => <button key={s} type="button" className={`chip ${rate === s ? 'on' : ''}`} onClick={() => setRate(s)}>{s}×</button>)}</span>}
          {m.playLimit && <span className="dim small">{left > 0 ? `${left} of ${m.playLimit} plays left` : 'No plays left'}</span>}
          {canShowT && <button type="button" className="btn ghost small" onClick={() => setShowT(!showT)}>{showT ? 'Hide transcript' : 'Show transcript'}</button>}
        </div>
      )}
      {showT && m.transcript && <div className="transcript"><Md src={m.transcript} block /></div>}
    </div>
  );
}

export type ItemDef = string | { text: string; audio?: MediaDef };
export const itemText = (it: ItemDef) => (typeof it === 'string' ? it : it.text);

/** Inline Markdown text with an optional play button beside it (§7.2 Item). */
export function Item({ item, assetUrl }: { item: ItemDef; assetUrl: (p: string) => string }) {
  if (typeof item === 'string') return <Md src={item} />;
  return <span className="item"><Md src={item.text} />{item.audio && <AudioClip media={item.audio} assetUrl={assetUrl} compact />}</span>;
}
