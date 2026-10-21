# Maintaining Tome

How to change the app, the courses and the website, and how to put each change online.

**Contents**

1. [The pieces and where they live](#1-the-pieces-and-where-they-live)
2. [One-time setup on your computer](#2-one-time-setup-on-your-computer)
3. [One-time setup: let Netlify publish from GitHub](#3-one-time-setup-let-netlify-publish-from-github)
4. [Change the app](#4-change-the-app)
5. [Change a course](#5-change-a-course)
6. [Add a course to the store](#6-add-a-course-to-the-store)
7. [Take a course out of the store](#7-take-a-course-out-of-the-store)
8. [Change the website](#8-change-the-website)
9. [When something does not show up](#9-when-something-does-not-show-up)
10. [Your signing key](#10-your-signing-key)
11. [Command reference](#11-command-reference)

---

## 1. The pieces and where they live

| Piece | Source | Live at | Netlify project |
|---|---|---|---|
| The app (and the store's courses) | GitHub `tome` (public) | `app.tome.courses` | the app project |
| The website | GitHub `tome-website` (private) | `tome.courses` | the website project |
| The authoring guide and format pages on the website | `docs/AUTHORING.md` and `docs/SPEC.md` in `tome`, turned into pages of `tome-website` | `tome.courses/authors/…` | the website project |
| Your signing key | `tome/keys/platform-2026.json` on your computer, plus your password manager | nowhere else, ever | — |

Two rules hold everything together:

- **A course in the store must be signed with your key.** You sign on your computer with `npm run sign-store`, and commit the signed files. Netlify never sees the key.
- **Every course change needs a new version number.** That is how learners' apps notice there is something new and offer *Update available*.

---

## 2. One-time setup on your computer

1. Install **Node.js 22** (nodejs.org) and **git** (git-scm.com).
2. Put both repositories side by side in one folder, so they look like this:

   ```
   Projects/
     tome/            ← public repository
     tome-website/    ← private repository
   ```

   ```
   git clone https://github.com/<you>/tome.git
   git clone https://github.com/<you>/tome-website.git
   ```

3. In `tome`, install and build the tools:

   ```
   cd tome
   npm install
   npm run build:cli
   ```

4. Copy your signing key from your password manager to `tome/keys/platform-2026.json`. The `keys/` folder is
   ignored by git, so it can never be committed by accident.

5. Check everything works: `npm test`. It takes a minute or two and should end without errors.

> **Windows:** where this guide writes `SITE_DIR=../tome-website npm run site`, type
> `$env:SITE_DIR="../tome-website"; npm run site` in PowerShell, or `set SITE_DIR=..\tome-website&& npm run site`
> in the Command Prompt.

---

## 3. One-time setup: let Netlify publish from GitHub

Connect each Netlify project to its repository once. From then on, **every `git push` to `main` updates the
live site by itself**, usually within two minutes. No more dragging folders.

**The website project** (tome.courses):

1. In Netlify, open the website project → *Project configuration → Build & deploy → Continuous deployment →
   Link repository*.
2. Choose GitHub, allow Netlify to see `tome-website`, and pick it.
3. Settings: **Build command:** leave empty. **Publish directory:** `.` (a single dot: the repository itself).
4. Save. Netlify publishes the current state of the repository right away.

**The app project** (app.tome.courses):

1. Same steps, but link the `tome` repository.
2. Settings: **Build command:** `npm run build:app-preview`. **Publish directory:** `packages/player-web/dist`.
3. Under *Environment variables*, add `NODE_VERSION` = `22`.
4. Save. The first build takes a few minutes; later ones about two.

The app's build does not need your key: the courses are already signed when you push them.

If a build fails, Netlify keeps the previous version online and shows the error under *Deploys*. Paste that
error to whoever helps you.

**Without GitHub (the old way):** build on your computer and drag the folder onto the project under *Deploys*:
for the app, `packages/player-web/dist` after `npm run build:app-preview`; for the website, a copy of
`tome-website` **without** its hidden `.git` folder.

---

## 4. Change the app

The app's code is in `tome/packages/player-web/src`.

1. Start the app on your computer:

   ```
   npm run dev
   ```

   Open the address it prints (http://localhost:5173). It reloads whenever you save a file. To see the phone
   layout, open your browser's developer tools and switch to a phone view.
2. Make your change and check it in the browser.
3. Run the checks: `npm test`.
4. Publish:

   ```
   git add .
   git commit -m "Say in a few words what changed"
   git push
   ```

   Netlify builds and publishes the new app.

**After publishing**, open the app once and close it, then open it again. The app works offline, so it keeps
the previous version until it has quietly loaded the new one; the second visit shows it. Every learner gets the
new version the same way, without doing anything.

**The Android app** (once it is on Google Play) is updated separately: raise `versionCode` in
`packages/player-web/android/app/build.gradle`, build a new App Bundle and upload it. The publishing manual
describes it step by step.

---

## 5. Change a course

Each course is a folder in `tome/packages/player-web/public/courses/`, for example `chess/`. Lessons are the
Markdown files in `lessons/`, pictures and sounds are in `assets/`, and `manifest.json` describes the course. The
authoring guide explains the lesson format.

1. **Preview while you work.** In `tome`:

   ```
   npx tome preview packages/player-web/public/courses/chess
   ```

   It opens the course in the player and reloads when you save. Mistakes show on the page and in the terminal.
2. **Check it:** `npx tome validate packages/player-web/public/courses/chess`.
3. **Raise the version** in the course's `manifest.json`, and write one sentence for learners in `changelog`:

   ```json
   "version": "0.1.4",
   "changelog": "Two new puzzles in the lesson on pins.",
   ```

   Raise the last number for corrections, the middle one for new material. Without a new version, learners who
   already have the course never get the change.
4. **Sign:**

   ```
   npm run sign-store -- keys/platform-2026.json
   ```

   This builds, signs and checks every store course, and updates the store's list: file names, sizes, versions,
   the changelog sentences and cover fingerprints. You never edit those by hand.
5. **Check and publish:**

   ```
   npm test
   git add .
   git commit -m "Chess 0.1.4: two new puzzles"
   git push
   ```

Learners who have the course now see **Update available** with your sentence in their library. Updating keeps
their progress, as long as you did not rename lesson or exercise ids.

**A new cover:** replace `assets/images/cover.png` (600 × 800 pixels), raise the version, and sign. The website
shows covers too; see [section 8](#8-change-the-website).

---

## 6. Add a course to the store

1. **Create it** in the courses folder:

   ```
   npx tome new packages/player-web/public/courses/knots
   ```

2. **Fill in the manifest** (`manifest.json.in` in a new course):
   - `id`: `courses.tome.` plus a short name, for example `courses.tome.knots`. It can never change.
   - `version`: start with `0.1.0`.
   - `authors`: `[{ "name": "Tome" }]`, or the real author.
   - `tags`: **the first tag is the subject** the store filters by, so use a plain word (`crafts`), then any
     others for search.
3. **Write and preview it** as in [section 5](#5-change-a-course).
4. **List it in the store.** Add an entry to `packages/player-web/public/catalog.json`. Only these fields are
   yours; `sign-store` fills in the rest:

   ```json
   {
     "courseId": "courses.tome.knots",
     "dir": "knots",
     "title": "Knots That Hold",
     "subtitle": "Six knots for camping, sailing and the garden",
     "priceCents": 0,
     "currency": "EUR"
   }
   ```

   The store shows courses in the order of this list.
5. **Sign, check and publish** as in steps 4 and 5 of [section 5](#5-change-a-course).
6. **Add it to the website** if you want it on the home page's shelf: [section 8](#8-change-the-website).

---

## 7. Take a course out of the store

1. Remove its entry from `packages/player-web/public/catalog.json`.
2. Delete its file from `packages/player-web/public/bundles/` (for example `courses.tome.knots-0.1.0.course`).
3. Keep its folder in `courses/` if you want to work on it later. Without a catalog entry it is not in the store.
4. `npm test`, then commit and push.
5. Take it off the website's shelf too ([section 8](#8-change-the-website)).

People who already have the course keep it. They just cannot download it any more.

---

## 8. Change the website

The website is plain HTML and CSS in `tome-website`. There is nothing to build.

| To change | Edit |
|---|---|
| The home page | `index.html` |
| The page for authors | `authors/index.html` |
| The privacy policy | `privacy/index.html`; also change the "Last updated" date at the top |
| Colours, fonts, spacing | `styles.css` |
| The authoring guide or the format pages | **not** in `tome-website`: edit `docs/AUTHORING.md` or `docs/SPEC.md` in `tome`, then regenerate (below) |

**Look at it before publishing.** In `tome-website`:

```
npx serve .
```

and open the address it prints.

**After changing a picture, or the guide or format docs**, run this in `tome`:

```
SITE_DIR=../tome-website npm run site
```

It regenerates the guide and format pages from `docs/`, and gives every picture on the hand-written pages a
fingerprint (`?v=…`), so visitors never see an old cached picture. Run it whenever a picture changes.

**Course covers on the home page** are in `images/covers/` (`chess.webp` and so on), and each course is one
`<li>` in `index.html` under *The first shelf*. For a new course, copy an existing `<li>`, change the texts, and
put its cover in `images/covers/`. A `.png` or `.webp` copy of the course's own cover works; around 320 pixels
wide keeps the page light. Then run the `npm run site` command above.

**Publish:**

```
git add .
git commit -m "Say in a few words what changed"
git push
```

Netlify publishes the website, usually within a minute.

When the author guide changed, commit and push **both** repositories: `tome` for the docs and `tome-website` for
the regenerated pages.

---

## 9. When something does not show up

| What you see | Why, and what to do |
|---|---|
| The app still looks old after publishing | It works offline and keeps the previous version until the new one is loaded. Open it, close it, open it again. |
| A course change does not reach your library | Did you raise its `version` and run `sign-store`? Then the library shows *Update available*. Tap *Update*. |
| An old picture on the website | Run `SITE_DIR=../tome-website npm run site`, then commit and push. |
| Netlify did not update | Look at the project's *Deploys* page. A failed build shows its error there, and the previous version stays online. |
| `sign-store` stops with "did not verify" | The course has an error. Run `npx tome validate` on its folder to see it. |
| `npm test` fails | Read the first error in the output; it names the file. Fix it before pushing. |
| "This site is private" | The Netlify project's *Visitor access* is set to private. See *Project configuration → General → Visitor access*. |

---

## 10. Your signing key

`keys/platform-2026.json` is what makes your courses trusted. Anyone who has it can publish courses your app
trusts.

- **Keep it in two places only:** your computer (in `tome/keys/`, which git ignores) and your password manager,
  plus an offline copy if you like.
- **Never** send it by email or chat, upload it, or commit it. Before every commit, `git status` must not list
  `keys/`.
- **If you lose it:** you can no longer update the store's courses. Make a new key, run `sign-store` with it, and
  publish a new version of the app. Courses people already have keep working, because the app checks a course
  only when it installs it.
- **If someone else gets it:** do the same, immediately. The new app version stops trusting the old key.

---

## 11. Command reference

All commands run in the `tome` folder unless it says otherwise.

| Command | What it does |
|---|---|
| `npm install` | Installs everything the project needs. Once, and again after pulling big changes. |
| `npm run build:cli` | Builds the `tome` command. Once, and again after its code changes. |
| `npm run dev` | The app on your computer, reloading as you edit. |
| `npm test` | Builds everything and runs every check. Run it before every push. |
| `npm run build:app-preview` | Builds the app as it runs online, into `packages/player-web/dist`. Netlify does this for you. |
| `npx tome preview <course folder>` | A course in the player, reloading as you edit. |
| `npx tome validate <course folder>` | Checks a course for mistakes. |
| `npx tome new <folder>` | Starts a new course. |
| `npm run sign-store -- keys/platform-2026.json` | Signs every store course with your key and updates the store's list. |
| `SITE_DIR=../tome-website npm run site` | Regenerates the website's guide and format pages, and fingerprints its pictures. |
| `npx serve .` (in `tome-website`) | The website on your computer. |
| `git add .` → `git commit -m "…"` → `git push` | Saves your change and publishes it, once Netlify is linked to GitHub. |
