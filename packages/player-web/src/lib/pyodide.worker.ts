/// <reference lib="webworker" />
/**
 * Python sandbox worker. Pyodide is served from the app's own origin (/pyodide/, copied at build time),
 * so code exercises work offline and the bundle is pinned, not whatever a CDN serves.
 * Each run uses a fresh globals dict. Infinite loops are handled by the host terminating the worker.
 */
const PYODIDE = new URL('/pyodide/', self.location.origin).href;
let py: any;

const HELPERS = `
def assert_equal(actual, expected, message=None):
    if actual != expected:
        raise AssertionError(message or f"expected {expected!r}, got {actual!r}")
`;

async function ready() {
  if (!py) {
    // Module workers can't importScripts(); use the ESM build via dynamic import instead.
    const mod = await import(/* @vite-ignore */ PYODIDE + 'pyodide.mjs');
    py = await mod.loadPyodide({ indexURL: PYODIDE });
  }
  return py;
}

/** Run `code` with stdin; returns captured stdout/stderr and error. If `test` is given, run it in the same scope afterwards with __stdout__ set. */
async function run(code: string, stdin: string, test?: string) {
  const p = await ready();
  let out = '', err = '';
  p.setStdout({ batched: (s: string) => (out += s + '\n') });
  p.setStderr({ batched: (s: string) => (err += s + '\n') });
  const lines = stdin.split('\n');
  p.setStdin({ stdin: () => (lines.length ? lines.shift() + '\n' : null) });
  const g = p.globals.get('dict')();
  g.set('__name__', '__main__');
  let error: string | null = null, phase: 'run' | 'test' = 'run';
  try {
    await p.runPythonAsync(code, { globals: g });
    if (test) {
      phase = 'test';
      g.set('__stdout__', out);
      await p.runPythonAsync(HELPERS, { globals: g });
      await p.runPythonAsync(test, { globals: g });
    }
  } catch (e: any) {
    error = String(e.message ?? e).split('\n').filter((l: string) => !/^\s*File "<exec>"|^\s*\^+\s*$|^Traceback|pyodide|^\s*$|_pyodide|runPython|eval_code|coroutine|File "\/lib\//.test(l)).join('\n').trim();
  } finally { g.destroy(); }
  return { stdout: out, stderr: err, error, phase };
}

self.onmessage = async (e: MessageEvent) => {
  const { id, kind, code, stdin, test } = e.data;
  try {
    if (kind === 'warmup') { await ready(); self.postMessage({ id, ok: true }); return; }
    const r = await run(code, stdin ?? '', test);
    self.postMessage({ id, ok: true, ...r });
  } catch (err: any) { self.postMessage({ id, ok: false, error: String(err?.message ?? err) }); }
};
