import { useEffect, useRef, useState } from 'react';
import { Md } from '../render/Inline.tsx';
import { useWidgetState } from '../lib/progress.ts';
import { deleteAttachment, download, getAttachment, putAttachment } from '../lib/attachments.ts';
import { Frame, Feedback } from './common.tsx';
import { AudioClip, type MediaDef } from './Media.tsx';
import type { WidgetProps } from './index.tsx';

interface Def { id: string; prompt: string; model?: MediaDef; maxSeconds?: number; rubric?: string[]; explanation?: string }
type Saved = { hasRecording: boolean; ticks: boolean[]; skipped?: boolean };

export function Record({ def, courseId, assetUrl }: WidgetProps<Def>) {
  const st = useWidgetState<Saved>(courseId, def.id);
  const [url, setUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [ticks, setTicks] = useState<boolean[]>(st.data?.ticks ?? (def.rubric ?? []).map(() => false));
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const max = Math.min(def.maxSeconds ?? 30, 120);

  useEffect(() => { getAttachment(courseId, def.id, 'recording').then((b) => b && setUrl(URL.createObjectURL(b))); }, [courseId, def.id]);
  useEffect(() => { if (!recording) return; const t = setInterval(() => setSeconds((s) => { if (s + 1 >= max) stop(); return s + 1; }), 1000); return () => clearInterval(t); }, [recording]);

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType });
        await putAttachment(courseId, def.id, 'recording', blob);
        setUrl(URL.createObjectURL(blob)); st.save({ hasRecording: true, ticks });
      };
      r.start(); rec.current = r; setSeconds(0); setRecording(true);
    } catch (e) { setErr('Microphone unavailable. You can still listen to the model and press Done.'); }
  };
  const stop = () => { rec.current?.stop(); setRecording(false); };
  const remove = async () => { await deleteAttachment(courseId, def.id, 'recording'); setUrl(null); st.save({ hasRecording: false, ticks }, false); };
  const done = (skipped = false) => st.save({ hasRecording: !!url, ticks, skipped }, true);

  return (
    <Frame kind="Speak" complete={st.complete}>
      <div className="prompt"><Md src={def.prompt} block /></div>
      {def.model && <div className="model-row"><span className="eyebrow">Model</span><AudioClip media={def.model} assetUrl={assetUrl} complete /></div>}
      <div className="rec">
        {!recording ? <button type="button" className="btn primary" onClick={start} disabled={st.complete}>{url ? 'Record again' : 'Record'}</button>
          : <button type="button" className="btn danger" onClick={stop}>■ Stop ({max - seconds}s)</button>}
        {url && <audio controls src={url} className="rec-audio" />}
        {url && !st.complete && <button type="button" className="btn ghost small" onClick={remove}>Delete</button>}
        {url && <button type="button" className="btn ghost small" onClick={async () => { const b = await getAttachment(courseId, def.id, 'recording'); if (b) download(b, `${def.id}.${b.type.includes('mp4') ? 'm4a' : 'webm'}`); }}>Export</button>}
      </div>
      {err && <p className="dim small">{err}</p>}
      {def.rubric && (
        <ul className="rubric">{def.rubric.map((r, i) => <li key={i}><label><input type="checkbox" checked={ticks[i]} disabled={st.complete} onChange={(e) => { const t = [...ticks]; t[i] = e.target.checked; setTicks(t); }} /> <Md src={r} /></label></li>)}</ul>
      )}
      {!st.complete && <div className="row"><button className="btn primary" onClick={() => done()} disabled={!url && !err}>Done</button><button className="btn ghost small" onClick={() => done(true)}>Skip — I can't record on this device</button></div>}
      {st.complete && st.data?.skipped && <p className="dim small">Skipped.</p>}
      {st.complete && def.explanation && <Feedback ok why={def.explanation}>Done.</Feedback>}
    </Frame>
  );
}
