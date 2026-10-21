import { useEffect, useState } from 'react';
import { isNative } from './lib/platform.ts';

const KEY = 'tome.installTip.dismissed';
let deferred: any = null; // Chrome / Edge / Android: the browser's own install prompt, saved for our button
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; dispatchEvent(new Event('tome:installable')); });

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const isComputer = () => !/Android|Mobi|iPhone|iPad|iPod/.test(navigator.userAgent) && navigator.maxTouchPoints < 2;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Shown in the library once there is something worth keeping. On iPhone and iPad there is no install prompt, and
 * Safari may clear a website's saved data after a few days unused — but not that of a web app on the Home Screen.
 */
export function InstallTip({ hasCourses }: { hasCourses: boolean }) {
  const [can, setCan] = useState(!!deferred);
  const [hidden, setHidden] = useState(() => { try { return !!localStorage.getItem(KEY); } catch { return false; } });
  useEffect(() => { const f = () => setCan(true); addEventListener('tome:installable', f); return () => removeEventListener('tome:installable', f); }, []);
  if (isNative || standalone() || hidden || !hasCourses || (!can && !isIOS())) return null;
  const dismiss = () => { try { localStorage.setItem(KEY, '1'); } catch { /* hidden for this visit */ } setHidden(true); };
  return (
    <aside className="nudge install-tip" aria-label="Install Tome">
      <strong>Keep Tome on this device</strong>
      {can
        ? (isComputer()
          ? <p>Install Tome as an app: it opens in its own window, works with no connection at all, and opens <code>.course</code> files when you double-click them.</p>
          : <p>Install Tome as an app: it opens from your home screen and works with no connection at all.</p>)
        : <p>Tap <b>Share</b> <svg className="share-glyph" viewBox="0 0 24 24" width="15" height="15" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11v9h12v-9" /></svg>, then <b>Add to Home Screen</b>. Tome then opens like an app and works offline — and Safari will not clear your courses, which it may do for websites left unused for a few days.</p>}
      <div className="row">
        {can && <button className="btn small primary" onClick={async () => { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; setCan(false); dismiss(); }}>Install Tome</button>}
        <button className="btn small ghost" onClick={dismiss}>{can ? 'Not now' : 'Got it'}</button>
      </div>
    </aside>
  );
}
