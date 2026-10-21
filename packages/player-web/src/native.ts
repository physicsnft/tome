/**
 * What the Android (and later iOS) shell adds on top of the web player. Loaded only inside the app, so the
 * web build never pulls in a native plugin.
 *
 * - Opening a .course file: tapping one in Files, Downloads, Gmail or a chat app launches Tome with the
 *   file's URI (an intent filter in AndroidManifest.xml; "Share to Tome" is turned into the same thing in
 *   MainActivity.java). It is verified and installed exactly like a store download.
 * - The system back button walks back through the screens the learner visited, closes an open picture or
 *   popover first, and leaves the app from the library — what Android users expect.
 * - The launch screen stays up until the library has rendered, so there is no white flash.
 */
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { importCourse, reportImportError } from './lib/importCourse.ts';

/** Bytes of a file the OS handed us. content:// and file:// URIs are both served to the WebView by Capacitor. */
async function readUri(uri: string): Promise<Uint8Array> {
  const res = await fetch(Capacitor.convertFileSrc(uri));
  if (!res.ok) throw new Error(`could not read the file (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** A readable name for messages. Content URIs are often opaque ("…/document/1234"), so fall back gracefully. */
function nameOf(uri: string) {
  const last = decodeURIComponent(uri.split('/').pop() ?? '');
  return /\.course$/i.test(last) ? last.replace(/^.*:/, '') : 'the course file';
}

let lastOpened = '';
async function open(uri: string | undefined) {
  if (!uri || uri === lastOpened) return; // a cold start reports the same URI twice (launch URL + event)
  lastOpened = uri;
  location.hash = ''; // results are shown in the library
  try { await importCourse(await readUri(uri), nameOf(uri)); }
  catch (e) { reportImportError(nameOf(uri), `Tome could not read ${nameOf(uri)}: ${(e as Error).message}.`); }
}

const overlayOpen = () => document.querySelector('.lightbox, .acct-pop, .theme-pop, .review-modal');

export function initNative() {
  App.addListener('appUrlOpen', ({ url }) => open(url));
  App.getLaunchUrl().then((r) => open(r?.url));

  App.addListener('backButton', () => {
    if (overlayOpen()) { dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return; }
    const atRoot = !location.hash || location.hash === '#' || location.hash === '#/';
    if (!atRoot) { history.length > 1 ? history.back() : (location.hash = ''); return; }
    App.minimizeApp(); // leaving from the library, like any Android app; the process and its state survive
  });
}

/** Called once the first screen has painted. */
export const appReady = () => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
