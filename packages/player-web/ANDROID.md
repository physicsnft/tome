# Tome for Android — prototype

The app is the web player, packaged with [Capacitor](https://capacitorjs.com). Everything a learner sees is the
same code as the web version. The Android project in `android/` adds the parts a browser cannot do.

## Try it on a phone

There are two ways. Both produce a debug APK that installs on any Android 7.0+ phone.

### A. Let GitHub build it (no Android tools needed)

1. Push this repository to GitHub.
2. Open the **Actions** tab, choose **Android APK**, and press **Run workflow**. It also runs on every push to `main`.
3. After about five minutes, open the finished run and download **tome-android-debug** under *Artifacts*.
   Unzip it to get `app-debug.apk`.
4. Copy the APK to the phone, for example by email, Google Drive or a USB cable, and tap it. Android asks once
   to allow installs from that app.

### B. Build it with Android Studio

1. Install [Android Studio](https://developer.android.com/studio) and Node.js 22.
2. In the repository folder, run:

   ```bash
   npm install
   npm run android        # builds the player, copies it into android/, opens Android Studio
   ```

3. In Android Studio, pick a phone (a real one with USB debugging on, or an emulator) and press ▶ **Run**.

After changing the player, run `npm run android:sync` and press ▶ again.

## What to try

- **Store → Buy.** No payment is taken. The prototype says so, adds the course to your library and downloads it.
  The signature check is the real one.
- **Open a lesson.** It works in flight mode. Python exercises run on the phone; nothing is sent anywhere.
- **Contents.** On a phone the lesson list folds into the bar above the lesson.
- **The back button.** It goes back through the screens you visited and closes an enlarged picture or the
  sign-in panel first. From the library, it leaves the app.
- **Open a .course file.** Send yourself one of the sample `.course` files, then tap it in Gmail, Files or
  Downloads, or use *Share → Tome*. The file is checked before it is added. A file that is not a course, or has
  been changed, is refused with the reason. An unsigned author draft can be opened only after you confirm it.
- **Library → "Add a .course file…"** does the same from inside the app.
- **Speaking exercises** in the Spanish course ask for the microphone the first time, not at install.
- **Dark mode** follows the phone's setting. The ☀/☾ button in the top bar can also force light or dark; the status bar switches with it. The launch screen follows the phone's setting.

## How it fits together

| Concern | Where |
|---|---|
| App id, launch screen, system bars | `capacitor.config.ts` |
| Opening and sharing `.course` files | intent filters in `android/app/src/main/AndroidManifest.xml`; *Share* is converted to *Open* in `MainActivity.java`; the web side handles it in `src/native.ts` → `src/lib/importCourse.ts` |
| Back button, hiding the launch screen | `src/native.ts` (loaded only inside the app) |
| Courses on the device | `src/lib/storage.ts`: app-private files on Android, IndexedDB on the web |
| Phone layout (bottom tabs, folding contents, system-bar insets) | `src/styles.css`, the *Phone layout* section |
| Icon and launch screen images | `android/app/src/main/res/` (regenerate from `tools/gen_android_icons.py`) |

## Not in the prototype yet

- **Real payments.** Google Play Billing, via RevenueCat as planned in `NATIVE.md`. The demo grant is in
  `Store.tsx` and is clearly labelled.
- **Personal copies.** Without the store server, the app downloads the master copy of a course, which carries no buyer's name. Run against `packages/server`, every download is a personal copy, as specified in SPEC §3.4.
- **Sign-in and sync.** The account server is not deployed, so *Sign in* reports that it cannot be reached.
  Everything on the device keeps working, by design.
- **A release build.** Play Store upload needs a signing key (`./gradlew bundleRelease` with a keystore). The
  debug APK is signed with Android's debug key, which is fine for testing and not for the store.
- **Its own file type.** Android identifies files by MIME type, and most apps hand a `.course` over as a generic
  binary. So Tome offers itself for those too, and politely refuses anything that is not a course. Serving
  courses as `application/vnd.tome.course` from the store fixes this for downloads.
