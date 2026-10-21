/** Platform API client. Every call is optional: the player works fully offline and only syncs when it can. */
export const API = (import.meta as any).env?.VITE_API ?? 'http://127.0.0.1:8787';

export class Offline extends Error {}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; session?: string | null } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: opts.method ?? 'GET',
      headers: { 'content-type': 'application/json', ...(opts.session ? { authorization: `Bearer ${opts.session}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch { throw new Offline('The platform is unreachable. Everything you own still works.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error ?? `Request failed (${res.status})`);
  return data as T;
}
