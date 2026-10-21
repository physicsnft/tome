import { useState, type ReactNode } from 'react';
import { listeningMedia } from '@tome/core';
import { GroupCtx } from '../lib/progress.ts';
import { AudioClip } from './Media.tsx';

/** `:::listening` — one clip, one play limit, one transcript, shared by the widgets inside (§6.1). */
export function ListeningGroup({ attrs, assetUrl, complete, transcript, children }: { attrs: Record<string, any>; assetUrl: (p: string) => string; complete: boolean; transcript: ReactNode; children: ReactNode }) {
  const media = listeningMedia(attrs);
  const [attempt, setAttempt] = useState(0);
  const [showT, setShowT] = useState(false);
  if (!media) return <div className="placeholder">Listening group without audio</div>;
  return (
    <section className={`listening ${complete ? 'is-complete' : ''}`}>
      <header className="listening-head">
        <span className="eyebrow">Listen</span>
        <AudioClip media={media} assetUrl={assetUrl} complete={complete} attemptKey={attempt} />
      </header>
      <GroupCtx.Provider value={{ onSave: (ok) => { if (!ok) setAttempt((a) => a + 1); } }}>{children}</GroupCtx.Provider>
      {transcript && (complete ? <div className="listening-transcript"><button type="button" className="btn ghost small" onClick={() => setShowT(!showT)}>{showT ? 'Hide transcript' : 'Show transcript'}</button>{showT && <div className="transcript">{transcript}</div>}</div> : <p className="dim small">Transcript unlocks when you have answered every question above.</p>)}
    </section>
  );
}
