import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { storageReady } from './lib/storage.ts';
// Fonts ship with the app (offline-first, no third-party requests from the player).
import '@fontsource-variable/literata/opsz.css';
import '@fontsource-variable/literata/opsz-italic.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles.css';
import './lib/theme.ts'; // keeps light/dark current (index.html set it before paint)
// Pick the storage backend (IndexedDB on web, filesystem in the native shell) before the library renders.
import { isNative } from './lib/platform.ts';
if (isNative) document.documentElement.classList.add('native');
// The native shell's extras (open .course files, back button, launch screen) load only inside the app.
const native = isNative ? import('./native.ts').then((m) => { m.initNative(); return m; }) : null;
// Offline web app (sw.js, generated at build time). Not in the native app, whose files are on the device anyway,
// and not in `tome preview`, which must always show the files on disk.
if (!isNative && import.meta.env.PROD && 'serviceWorker' in navigator && !(window as any).__TOME_PREVIEW__) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
// The installed web app on a computer: double-clicking a .course file opens it in Tome.
if (!isNative) import('./fileLaunch.ts').then((m) => m.initFileLaunch());
storageReady.then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
  requestAnimationFrame(() => native?.then((m) => m.appReady()));
});
