/** Host side of the Python sandbox: one worker, replaced on timeout. */
export interface RunResult { stdout: string; stderr: string; error: string | null; phase: 'run' | 'test'; timedOut?: boolean }

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (r: any) => void }>();

function spawn() {
  worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => { const p = pending.get(e.data.id); if (p) { pending.delete(e.data.id); p.resolve(e.data); } };
  return worker;
}
const get = () => worker ?? spawn();

export function warmup() { const id = ++seq; get().postMessage({ id, kind: 'warmup' }); return new Promise((resolve) => pending.set(id, { resolve })); }

export function runPython(code: string, stdin: string, test: string | undefined, timeoutMs: number): Promise<RunResult> {
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      worker?.terminate(); worker = null; // kill the runaway interpreter; next call respawns and reloads
      for (const [k, p] of pending) { pending.delete(k); p.resolve({ stdout: '', stderr: '', error: 'Cancelled', phase: 'run' }); }
      resolve({ stdout: '', stderr: '', error: `Stopped after ${timeoutMs / 1000}s — is there an infinite loop?`, phase: 'run', timedOut: true });
    }, timeoutMs);
    pending.set(id, { resolve: (r) => { clearTimeout(timer); resolve(r.ok ? r : { stdout: '', stderr: '', error: r.error, phase: 'run' }); } });
    get().postMessage({ id, kind: 'run', code, stdin, test });
  });
}
