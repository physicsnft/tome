# Tome

Interactive courses you keep. A Tome course is one signed `.course` file: lessons in Markdown, exercises,
pictures and sounds. It opens offline, on any device, for as long as you like, and the format is open.

- **Use it:** [app.tome.courses](https://app.tome.courses) (installable on phones and computers)
- **About it:** [tome.courses](https://tome.courses)
- **Write a course:** the [authoring guide](https://tome.courses/authors/guide/) and the [format specification](https://tome.courses/authors/format/)

## What is in this repository

```
packages/
  core/         the format: lesson parser, schemas, validation, signing and checking of bundles
  player-web/   the Tome app (React + Vite); android/ is the same app packaged with Capacitor
  cli/          @tome-courses/cli, the `tome` command for authors: new, preview, validate, build, sign, verify
  server/       a small stand-in server for accounts and personal copies, for local development only
docs/           SPEC.md (the course format) and AUTHORING.md (the authoring guide)
scripts/        tests, and the scripts that sign the store's courses and keep its catalog up to date
tools/          generators for the sample courses' pictures and sounds
```

## Run it

You need Node 22.

```
npm install
npm run dev            # the app at http://localhost:5173, with the sample courses
npm test               # builds everything and runs all checks
```

To build the free-preview version that runs at app.tome.courses: `npm run build:app-preview`. The result is in
`packages/player-web/dist`, ready for any static host. For the Android app, see
[packages/player-web/ANDROID.md](packages/player-web/ANDROID.md).

## Signing courses

The app opens a course from the store only if it is signed with a key the app trusts
(`packages/player-web/public/trusted-keys.json`). The sample courses in this repository are signed with a
development key. To publish your own build:

```
npm run build:cli
npx tome keygen keys/platform.json my-platform-key
npm run sign-store -- keys/platform.json
```

`sign-store` signs every course in the catalog and makes the app trust only your key. **Never commit a
private key**: the `keys/` folder is in `.gitignore`, and so are Android keystores.

## The website

The website at tome.courses lives in its own repository. Its author pages are generated from `docs/` in this
one: with the website checked out next to this repository, run `SITE_DIR=../tome-website npm run site`.

## Licence

The code is licensed under the [Apache License 2.0](LICENSE). The format specification and the authoring
guide are [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and the sample courses are
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); see [LICENSE-CONTENT.md](LICENSE-CONTENT.md).
