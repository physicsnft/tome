/**
 * Colours for drawn content (plots, simulations, geometry, board marks). They are CSS variables, so the same
 * course reads correctly in light and dark mode: the dark theme brightens each one (styles.css, :root tokens).
 */
export const NAMED: Record<string, string> = {
  primary: 'var(--ink-primary)', secondary: 'var(--ink-secondary)', accent: 'var(--accent)', muted: 'var(--muted)',
  red: 'var(--c-red)', green: 'var(--c-green)', blue: 'var(--c-blue)', orange: 'var(--c-orange)',
};
export const SERIES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
