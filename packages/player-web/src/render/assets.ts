import { createContext } from 'react';

/**
 * How a relative asset path becomes a URL the browser can load. Lessons pass it explicitly; widget text
 * (options, flashcards, prompts, explanations) is rendered by <Md> deep inside a widget, which never
 * received it — so an image inside a widget kept its bare relative path and never loaded.
 */
export const AssetUrlContext = createContext<((path: string) => string) | null>(null);
