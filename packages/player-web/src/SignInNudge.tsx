import { useState } from 'react';
import { useAccount } from './lib/account.ts';
import { useEntitlements } from './lib/entitlements.ts';
import { signInWith } from './Account.tsx';
import { freePreview } from './lib/preview.ts';

const KEY = 'tome.signinNudge.dismissedAt';
const dismissedAt = () => { try { return Number(localStorage.getItem(KEY) ?? 0); } catch { return 0; } };

/**
 * Buying never needs an account. Afterwards, though, a purchase that lives only on this install is one reinstall
 * away from needing "Restore purchases" — so offer a one-tap sign-in that moves it to an account. "Not now"
 * hides the offer until the next purchase.
 */
export function SignInNudge() {
  const acct = useAccount();
  const owned = useEntitlements().filter((e) => !e.revokedAt).length;
  const [hiddenAt, setHiddenAt] = useState(dismissedAt);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (freePreview) return null; // nothing to sign in to yet
  if (done) return <div className="nudge ok" role="status">Signed in. Your courses are on your account now, and follow you to your other devices.</div>;
  if (acct || owned === 0 || owned <= hiddenAt) return null;
  const go = async (p: 'apple' | 'google') => {
    setBusy(true); setMsg(null);
    try { await signInWith(p); setDone(true); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const later = () => { try { localStorage.setItem(KEY, String(owned)); } catch { /* fine: hidden for this visit */ } setHiddenAt(owned); };
  return (
    <aside className="nudge" aria-label="Keep your courses">
      <strong>Keep {owned === 1 ? 'your course' : `your ${owned} courses`} safe</strong>
      <p>{owned === 1 ? 'It is' : 'They are'} tied to this device for now. Sign in and {owned === 1 ? 'it follows' : 'they follow'} you to your other devices, and {owned === 1 ? 'comes' : 'come'} straight back if you reinstall.</p>
      <div className="row">
        <button className="btn small primary" disabled={busy} onClick={() => go('google')}>Continue with Google</button>
        <button className="btn small" disabled={busy} onClick={() => go('apple')}>Continue with Apple</button>
        <button className="btn small ghost" onClick={later}>Not now</button>
      </div>
      {msg && <p className="small" role="alert">{msg}</p>}
    </aside>
  );
}
