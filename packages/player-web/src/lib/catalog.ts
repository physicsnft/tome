/** Store catalogue. In the prototype it is a static file; in production, the platform API. */
export interface CatalogEntry { courseId: string; dir: string; title: string; subtitle?: string; priceCents: number; currency: string; bundleUrl: string; cover: string; sizeBytes?: number; version?: string; changelog?: string;
  /** For search and filters. The first tag is the course's subject. */
  authors?: string[]; tags?: string[]; description?: string; level?: string; minutes?: number }

/** True when version a is newer than version b (major.minor.patch; anything after that is ignored). */
export function isNewer(a: string, b: string) {
  const p = (v: string) => v.split(/[.+-]/).slice(0, 3).map((n) => parseInt(n, 10) || 0);
  const x = p(a), y = p(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}
let last: CatalogEntry[] | null = null;
/** The list from the last fetch in this session, so the store can show it at once while it refreshes. */
export const cachedCatalog = () => last;
export async function fetchCatalog(): Promise<CatalogEntry[]> {
  const r = await fetch('/catalog.json');
  const list: CatalogEntry[] = await r.json();
  if (!last) list.forEach((e) => { const img = new Image(); img.decoding = 'async'; img.src = e.cover; }); // warm the covers
  last = list;
  return list;
}
export const formatPrice = (c: number, cur = 'EUR') => new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(c / 100);
