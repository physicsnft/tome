# @tome-courses/cli

Create, validate, preview and sign [Tome](https://example.invalid/tome) courses.

```
npx @tome-courses/cli new my-first-course
cd my-first-course
npx @tome-courses/cli preview .
```

The preview opens the real player with your course in it and reloads whenever you save.

If you are typing `npx @tome-courses/cli` too often:

```
npm install -g @tome-courses/cli    # then just: tome new my-course
```

## Commands

| | |
|---|---|
| `tome new <dir>` | scaffold a course that already validates |
| `tome preview <dir\|bundle.course> [port]` | serve the player with a course, reloading on save |
| `tome validate <dir>` | check a course — run this constantly |
| `tome build <dir> --out <dir>` | write content hashes and produce a `.course` bundle |
| `tome keygen <key.json>` | create an Ed25519 signing key |
| `tome sign <bundle> <key.json>` | sign a bundle |
| `tome verify <bundle> [keys.json]` | check hashes and signature the way a player does |
| `tome unpack <bundle> <dir>` | turn a received bundle into an editable directory |
| `tome regions <image>` | draw hotspot regions in a browser, copy the YAML |
| `tome atoms <smiles>` | list a molecule's atom indices |
| `tome check-docs <file.md…>` | validate the examples in your own documentation |

## Versioning

The CLI's major and minor version track the course format: `@tome-courses/cli@1.0.x` speaks format `1.0`. If you are targeting a format version, install the matching CLI.

## Documentation

- **AUTHORING.md** — a tutorial: one course, end to end, about an hour.
- **SPEC.md** — the reference: every field of every widget.

## From a checkout

```
npm install
npm run build:cli            # builds the player and bundles the CLI
npx tome validate .          # works anywhere inside the repo
npm link -w @tome-courses/cli   # optional: puts `tome` on your PATH
```

Requires Node 20 or newer.
