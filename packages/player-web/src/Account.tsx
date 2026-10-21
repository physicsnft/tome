import { useEffect, useState } from 'react';
import { account, claimAnonymous, oauth, requestLink, setDisplayName, signOut, useAccount, verifyLink } from './lib/account.ts';
import { downloadReceipt, refresh, reloadCache } from './lib/entitlements.ts';
import { syncProgress } from './lib/sync.ts';

/** One-tap sign-in (Apple / Google, faked in the prototype). Any purchases made on this install move to the account. */
export async function signInWith(p: 'apple' | 'google', email?: string) {
  await oauth(p, email || `${p}-demo-subject`, email || undefined);
  reloadCache(); await refresh(); await syncProgress();
}

/**
 * Sign-in exists for one reason: to carry what you own, and how far you got, between devices.
 * It is never required to open a course that is already on this device.
 */
export function AccountBar() {
  const acct = useAccount();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const after = async () => { reloadCache(); await refresh(); await syncProgress(); setOpen(false); setMsg(null); setPending(null); };

  const start = async () => {
    setBusy(true); setMsg(null);
    try { const r = await requestLink(email); setPending(r.token); setMsg('Check your email for a sign-in link. (Prototype: it is filled in below.)'); }
    catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const verify = async () => { setBusy(true); try { await verifyLink(pending!); await after(); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); } };
  const tapProvider = async (p: 'apple' | 'google') => {
    setBusy(true);
    try { await signInWith(p, email); setOpen(false); setMsg(null); setPending(null); }
    catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const restore = async () => { setBusy(true); try { const r = await claimAnonymous(); await refresh(); setMsg(r.claimed ? `Restored ${r.claimed} purchase${r.claimed === 1 ? '' : 's'} made on this device.` : 'Nothing left to restore on this device.'); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); } };
  const out = () => { signOut(); reloadCache(); setOpen(false); };
  // Escape (and the Android back button, which sends one) closes the panel.
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open]);

  if (!acct) return (
    <span className="acct">
      <button className="btn small" onClick={() => setOpen(!open)}>Sign in</button>
      {open && (
        <div className="acct-pop">
          <p className="dim small">Sign in to carry your courses and your progress to your other devices. Anything already downloaded here keeps working either way.</p>
          <div className="row"><button className="btn small" disabled={busy} onClick={() => tapProvider('apple')}>Continue with Apple</button><button className="btn small" disabled={busy} onClick={() => tapProvider('google')}>Continue with Google</button></div>
          <div className="or">or</div>
          <div className="row"><input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn primary small" disabled={busy || !email.includes('@')} onClick={start}>Email me a link</button></div>
          {pending && <div className="row"><input className="input" value={pending} onChange={(e) => setPending(e.target.value)} aria-label="Sign-in token" /><button className="btn primary small" onClick={verify} disabled={busy}>Sign in</button></div>}
          {msg && <p className="small">{msg}</p>}
        </div>
      )}
    </span>
  );

  return (
    <span className="acct">
      <button className="btn small" onClick={() => setOpen(!open)}>{acct.account.email ?? acct.account.id}</button>
      {open && (
        <div className="acct-pop">
          <p className="small">Signed in as <strong>{acct.account.email ?? acct.account.id}</strong>. Your library and progress follow you.</p>
          <div className="row"><button className="btn small" onClick={restore} disabled={busy}>Restore purchases</button><button className="btn small" onClick={() => downloadReceipt()}>Export receipt</button></div>
          <p className="dim small">The receipt is a signed proof of what you own. Keep it: it stays verifiable even if this service disappears.</p>
          <NameOnCopies current={acct.account.displayName} />
          <button className="btn ghost small" onClick={out}>Sign out</button>
          {msg && <p className="small">{msg}</p>}
        </div>
      )}
    </span>
  );
}

export const currentAccount = account;

/**
 * Opt-in: a name printed on the courses you download from now on. Off by default — then a copy says only
 * "your personal copy · order …". Your email address is never put in a copy.
 */
function NameOnCopies({ current }: { current?: string }) {
  const [on, setOn] = useState(!!current);
  const [name, setName] = useState(current ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (value: string) => {
    setBusy(true); setMsg(null);
    try { await setDisplayName(value); setMsg(value ? `Courses you download from now on will say “Licensed to ${value}”.` : 'Your courses will show only the order number.'); }
    catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const bad = name.includes('@');
  return (
    <fieldset className="copies-name">
      <label className="row"><input type="checkbox" checked={on} onChange={(e) => { setOn(e.target.checked); if (!e.target.checked && current) { setName(''); save(''); } }} /> <span>Put my name on my courses</span></label>
      <p className="dim small">Off, a course you buy says only “your personal copy” and its order number. On, it says “Licensed to …” with a name you choose — never your email address.</p>
      {on && (
        <div className="row">
          <input className="input" maxLength={60} placeholder="e.g. Ana" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name on your courses" aria-invalid={bad} />
          <button className="btn small primary" disabled={busy || !name.trim() || bad || name.trim() === current} onClick={() => save(name.trim())}>Save</button>
        </div>
      )}
      {bad && <p className="small" role="alert">A name, not an email address.</p>}
      {msg && <p className="small" role="status">{msg}{msg.startsWith('Courses') ? ' Courses already on your devices keep what they say; remove one and download it again to update it.' : ''}</p>}
    </fieldset>
  );
}
