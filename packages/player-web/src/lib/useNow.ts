import { useEffect, useState } from 'react';

/**
 * The current time, as React state. "Due" depends on the clock, and nothing else re-renders when only
 * time passes — so a tab left open overnight, or a phone app resumed in the morning, showed yesterday's
 * counts. Ticks every minute, and immediately whenever the page becomes visible again.
 */
export function useNow(everyMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, everyMs);
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    addEventListener('focus', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); removeEventListener('focus', tick); };
  }, [everyMs]);
  return now;
}
