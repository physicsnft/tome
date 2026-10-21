// Personal copies (SPEC §3.4): issuing, verifying, tampering, and who counts as the owner.
import { readFileSync, readdirSync } from 'node:fs';
import { issueCopy, copyStatus, unpackBundle, packBundle, verifyBundle, generateKeyPair, signBundle, readManifest, validateManifest, verifyAuthorSignature, verifySignature } from '../packages/core/src/index.ts';

let failed = 0;
const ok = (c: boolean, m: string) => { if (!c) { failed++; console.error('FAIL', m); } };
const k = generateKeyPair(); const trusted = [{ keyId: 'test', publicKey: k.publicKey }];
const base = signBundle(unpackBundle(new Uint8Array(readFileSync('packages/player-web/public/bundles/' + readdirSync('packages/player-web/public/bundles').find((f) => f.startsWith('courses.tome.chess-tactics-'))!))), k.privateKey, 'test');
const to = { order: 'web_o1', subject: 'acct_1', issuedAt: '2026-10-20T08:30:00Z' };
const copy = unpackBundle(issueCopy(base, to, k.privateKey, 'test'));
const v = verifyBundle(copy, trusted);
ok(v.signature.ok && v.hashes.length === 0, 'a personal copy verifies');
ok(v.manifest.issuedTo?.order === 'web_o1', 'the copy carries its order');
ok(!JSON.stringify(v.manifest.issuedTo).includes('@'), 'no email address in a copy');
ok(JSON.stringify(readManifest(base).contentHashes) === JSON.stringify(v.manifest.contentHashes), 'content hashes are untouched');
const m = JSON.parse(new TextDecoder().decode(copy['manifest.json'])); m.issuedTo.order = 'web_other';
const edited = { ...copy, 'manifest.json': new TextEncoder().encode(JSON.stringify(m)) };
ok(!verifyBundle(unpackBundle(packBundle(edited)), trusted).signature.ok, 'changing the order breaks the signature');
ok(copyStatus(v.manifest, ['acct_1'], false) === 'mine', 'the buyer owns it');
ok(copyStatus(v.manifest, ['acct_2', 'anon_x'], false) === 'other', 'someone else does not');
ok(copyStatus(v.manifest, ['acct_2'], true) === 'mine', 'an entitlement makes it yours');
ok(copyStatus(readManifest(base), [], false) === 'unlicensed', 'a copy without issuedTo opens as before');
const withEmail = { ...v.manifest, issuedTo: { ...to, name: 'ana@example.com' } };
ok(validateManifest(withEmail).length > 0, 'the schema refuses an email address as the name');
// Courses from outside the store (§4)
const author = generateKeyPair();
const shared = signBundle(unpackBundle(packBundle(base)), author.privateKey, 'author-test');
const a = verifyAuthorSignature(shared);
ok(!verifySignature(shared, trusted).ok && !!a && a.fingerprint.length === 19, "an author's own signature checks out, with a fingerprint, and is not trusted");
const edited2 = { ...shared, 'manifest.json': new TextEncoder().encode(new TextDecoder().decode(shared['manifest.json']).replace('"title"', '"title" ')) };
ok(!verifyAuthorSignature(edited2), "editing an author-signed course breaks its signature");
const fake = signBundle(unpackBundle(packBundle(base)), author.privateKey, 'test');
ok(!verifySignature(fake, trusted).ok && verifyAuthorSignature(fake)?.keyId === 'test', 'a forged platform key id is caught by the pinned key (the player then refuses it)');
console.log(failed ? `${failed} license checks failed` : 'license: personal copies verify, carry their order and no email, and break when altered');
process.exitCode = failed ? 1 : 0;
