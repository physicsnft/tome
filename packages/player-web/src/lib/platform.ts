/** Where the player is running. The web build and the Android/iOS shell are the same code; this is the one switch. */
const cap = (globalThis as any).Capacitor;
export const isNative: boolean = typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform();
export const platform: 'web' | 'android' | 'ios' = isNative ? cap.getPlatform() : 'web';
