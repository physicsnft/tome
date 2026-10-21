/**
 * Free public preview (PUBLISHING, step A1): every course in the store is free, and nothing talks to a platform
 * server — there are no payments, accounts or sync to talk to yet. Switched on at build time with
 * VITE_FREE_PREVIEW=true (the static host's environment, or the GitHub repository variable for Android).
 */
export const freePreview = (import.meta as any).env?.VITE_FREE_PREVIEW === 'true';

/** A course costs nothing in the preview, or when the catalog lists it at 0. */
export const isFree = (priceCents: number) => freePreview || priceCents === 0;
