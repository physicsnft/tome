/**
 * `tome atoms <smiles>` — print the atom order a `molecule` widget's `answer` refers to.
 *
 * Atom indices follow SMILES order (§7.10) and counting them by hand is error-prone past about six atoms,
 * which is exactly where a course starts using interesting molecules.
 */
import SmilesDrawer from 'smiles-drawer';

export function atomsCommand(smiles: string) {
  let tree: any;
  try { tree = (SmilesDrawer as any).Parser.parse(smiles); }
  catch (e) { console.error(`Could not parse SMILES: ${(e as Error).message}`); process.exit(1); }
  const atoms: string[] = [];
  const walk = (n: any): void => {
    if (!n) return;
    if (n.atom) atoms.push(typeof n.atom === 'string' ? n.atom : n.atom.element);
    (n.branches ?? []).forEach(walk);
    walk(n.next);
  };
  walk(tree);
  console.log(smiles);
  console.log(atoms.map((a, i) => `  ${String(i).padStart(2)}  ${a}`).join('\n'));
  console.log(`\n${atoms.length} heavy atoms (hydrogen is implicit). Use these indices in answer.accept.`);
}
