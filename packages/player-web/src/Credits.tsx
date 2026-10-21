import { useState } from 'react';
import type { Credit } from '@tome/core';

/**
 * Course credits (§3.3). Attribution that only lives in the manifest and is never shown does not
 * discharge the obligation, so every course gets a reachable credits view — including the courses
 * that simply assert the work is their own.
 */
export function Credits({ credits, assetsByAuthor, authors }: { credits?: Credit[]; assetsByAuthor?: boolean; authors: { name: string }[] }) {
  const [open, setOpen] = useState(false);
  const list = credits ?? [];
  if (!list.length && !assetsByAuthor) return null;
  return (
    <section className="credits">
      <button type="button" className="linklike" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide credits' : 'Credits and sources'}
      </button>
      {open && (
        <div className="credits-body">
          {assetsByAuthor && <p className="dim small">All images, audio and video in this course are the work of {authors.map((a) => a.name).join(', ')}{list.length ? ', except those listed below' : ''}.</p>}
          {!!list.length && (
            <ul>
              {list.map((c) => (
                <li key={c.asset}>
                  <strong>{c.title ?? c.asset.split('/').pop()}</strong> — {c.creator}
                  {c.license && <> · {c.license}</>}
                  {c.modified && <> · {c.modified}</>}
                  {/* Informative only: never fetched by the player (§8.2). */}
                  {c.source && <div className="dim small src">{c.source}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
