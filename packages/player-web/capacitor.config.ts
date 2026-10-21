import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native shell. The web player is bundled into the app (webDir), so it launches with no network at all.
 * The shell adds: filesystem storage for course bundles, IAP, share sheet, background audio.
 */
const config: CapacitorConfig = {
  appId: 'courses.tome.app',
  appName: 'Tome',
  webDir: 'dist',
  // No `server.url`: the app must never load its own code from the network — that is the offline promise.
  android: { allowMixedContent: false },
  ios: { limitsNavigationsToAppBoundDomains: true },
  plugins: {
    CapacitorHttp: { enabled: true },
    // The launch screen stays until the library has painted (main.tsx calls SplashScreen.hide()).
    SplashScreen: { launchAutoHide: false, launchShowDuration: 3000, backgroundColor: '#F7F8FA', showSpinner: false },
    // Edge to edge on Android 15+: the bar heights reach the CSS as --safe-area-inset-*; dark icons on the light page.
    SystemBars: { insetsHandling: 'css', style: 'LIGHT' },
  },
};
export default config;
