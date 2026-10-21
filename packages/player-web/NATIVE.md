# Native shell (Capacitor)

The web player is the app. Capacitor wraps `dist/` and adds the things a browser cannot do.

## Setup

```bash
npm run build                       # produces dist/ incl. /pyodide and fonts — no network needed at runtime
npx cap add ios                     # once, on macOS with Xcode
npx cap sync                        # after every web build
npx cap open ios
```

Android is already set up in `android/` — see **ANDROID.md** for building it (Android Studio, or a GitHub workflow that needs no local tools).

`capacitor.config.ts` deliberately has no `server.url`: the app never loads its own code from the network.

## What the shell adds

| Concern | Plugin | Status |
|---|---|---|
| Course storage | `@capacitor/filesystem` | **done** — `src/lib/storage.ts` picks the filesystem backend on native, IndexedDB on web, behind one interface |
| Entitlement mirror | `@capacitor/preferences` | installed; `entitlements.ts` still uses localStorage (works in the WebView) — move when sync lands |
| Purchases | RevenueCat (`@revenuecat/purchases-capacitor`) | to do — call `grant()` on a successful purchase, nothing else changes |
| Opening `.course` files | intent filters + `@capacitor/app` | **done (Android)** — see ANDROID.md |
| Back button, launch screen, system bars | `@capacitor/app`, `@capacitor/splash-screen`, core `SystemBars` | **done (Android)** — `src/native.ts` |
| Share / export recordings and sketches | `@capacitor/share` | installed; to do — replaces the `download()` helper in `attachments.ts` |
| Background audio | native audio session config | to do — needed so a listening exercise survives a screen lock |
| Downloads | native downloader | to do — `download.ts` streams with `fetch`; swap for a resumable native download for large courses |

## Store review notes

Apple rejects thin web wrappers ("minimum functionality"). What makes this an app rather than a website: offline library, on-device bundle verification, filesystem course storage, microphone recording with local-only storage, IAP. Keep these visible in the review notes.

The player must not offer web purchase links inside the iOS app; the store screen there uses IAP only.

## Cross-platform ownership

An entitlement belongs to an **account**, not a device or a store. `packages/server` is a stub of the platform API that makes this concrete:

- `POST /webhooks/revenuecat` — an IAP grants against whatever `app_user_id` the client set (an account, or this install's anonymous id).
- `POST /auth/verify` / `POST /auth/oauth` — signing in claims the anonymous subject, so a purchase made *before* sign-in is never orphaned.
- `POST /auth/claim` — the "Restore purchases" button, for reinstalls.
- `POST /progress/sync` — last write wins per widget; the high-water mark is per subject.
- `GET /receipt` — a signed, portable proof of ownership.

In the app, set RevenueCat's `app_user_id` to the account id after sign-in and to `anonymousId()` before it; the webhook then does the rest with no client-side entitlement logic.

Storefront rules to respect: iOS uses IAP for in-app purchase. Linking out to web checkout is allowed on the US storefront; in the EU it requires the External Purchase Link entitlement and cannot be offered alongside IAP in the same app. Honouring purchases made elsewhere is allowed everywhere — that is what the account sign-in is for.
