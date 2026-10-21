/**
 * §7.5 expression language: a tiny, side-effect-free evaluator.
 * No eval. Numbers, + - * / ^ %, comparisons, if(), whitelisted functions, variables.
 */
type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

const FUNCS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, log: Math.log, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max,
  clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)), sign: Math.sign, step: (edge, x) => (x < edge ? 0 : 1),
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export type Node =
  | { k: 'num'; v: number }
  | { k: 'var'; name: string }
  | { k: 'un'; e: Node }
  | { k: 'bin'; op: string; l: Node; r: Node }
  | { k: 'call'; fn: string; args: Node[] };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)|([a-zA-Z_]\w*)|(<=|>=|==|!=|[-+*/^%<>(),]))/y;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m || m.index !== pos) {
      if (/^\s*$/.test(src.slice(pos))) break;
      throw new Error(`Unexpected character at ${pos}: '${src.slice(pos, pos + 8)}'`);
    }
    pos = re.lastIndex;
    if (m[1] !== undefined) out.push({ t: 'num', v: parseFloat(m[1]) });
    else if (m[2] !== undefined) out.push({ t: 'id', v: m[2] });
    else out.push({ t: 'op', v: m[3] });
  }
  return out;
}

const PREC: Record<string, number> = { '==': 1, '!=': 1, '<': 2, '<=': 2, '>': 2, '>=': 2, '+': 3, '-': 3, '*': 4, '/': 4, '%': 4, '^': 5 };

export function parse(src: string): Node {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const expectOp = (v: string) => { const t = next(); if (!t || t.t !== 'op' || t.v !== v) throw new Error(`Expected '${v}'`); };

  function primary(): Node {
    const t = next();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'id') {
      const p = peek();
      if (p && p.t === 'op' && p.v === '(') {
        next();
        const args: Node[] = [];
        if (!(peek()?.t === 'op' && peek().v === ')')) {
          do args.push(expr(0)); while (peek()?.t === 'op' && peek().v === ',' && next());
        }
        expectOp(')');
        if (t.v !== 'if' && !(t.v in FUNCS)) throw new Error(`Unknown function '${t.v}'`);
        return { k: 'call', fn: t.v, args };
      }
      return { k: 'var', name: t.v };
    }
    if (t.v === '(') { const e = expr(0); expectOp(')'); return e; }
    if (t.v === '-') return { k: 'un', e: expr(6) };
    if (t.v === '+') return expr(6);
    throw new Error(`Unexpected '${t.v}'`);
  }
  function expr(minPrec: number): Node {
    let left = primary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || !(t.v in PREC) || PREC[t.v] < minPrec) return left;
      next();
      const p = PREC[t.v];
      const right = expr(t.v === '^' ? p : p + 1); // ^ is right-assoc
      left = { k: 'bin', op: t.v, l: left, r: right };
    }
  }
  const n = expr(0);
  if (i < toks.length) throw new Error(`Unexpected '${(toks[i] as any).v}'`);
  return n;
}

export function evaluate(n: Node, vars: Record<string, number>): number {
  switch (n.k) {
    case 'num': return n.v;
    case 'var': {
      if (n.name in vars) return vars[n.name];
      if (n.name in CONSTS) return CONSTS[n.name];
      throw new Error(`Unknown variable '${n.name}'`);
    }
    case 'un': return -evaluate(n.e, vars);
    case 'bin': {
      const a = evaluate(n.l, vars), b = evaluate(n.r, vars);
      switch (n.op) {
        case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b;
        case '%': return a % b; case '^': return Math.pow(a, b);
        case '<': return +(a < b); case '<=': return +(a <= b); case '>': return +(a > b); case '>=': return +(a >= b);
        case '==': return +(a === b); case '!=': return +(a !== b);
      }
      throw new Error(n.op);
    }
    case 'call': {
      if (n.fn === 'if') { if (n.args.length !== 3) throw new Error('if() takes 3 arguments'); return evaluate(n.args[0], vars) ? evaluate(n.args[1], vars) : evaluate(n.args[2], vars); }
      return FUNCS[n.fn](...n.args.map((a) => evaluate(a, vars)));
    }
  }
}

/** Static check: parses and verifies all identifiers are known. Returns an error message or null. */
export function check(src: string | number, names: Iterable<string>): string | null {
  if (typeof src === 'number') return null;
  const known = new Set([...names, 'x', ...Object.keys(CONSTS)]);
  try {
    const n = parse(src);
    const walk = (m: Node): void => {
      if (m.k === 'var' && !known.has(m.name)) throw new Error(`Unknown identifier '${m.name}'`);
      if (m.k === 'un') walk(m.e);
      if (m.k === 'bin') { walk(m.l); walk(m.r); }
      if (m.k === 'call') m.args.forEach(walk);
    };
    walk(n);
    return null;
  } catch (e) { return (e as Error).message; }
}

const cache = new Map<string, Node>();
export function evalExpr(src: string | number, vars: Record<string, number>): number {
  if (typeof src === 'number') return src;
  let n = cache.get(src);
  if (!n) { n = parse(src); cache.set(src, n); }
  return evaluate(n, vars);
}
