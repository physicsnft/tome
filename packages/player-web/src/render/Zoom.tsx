import { useEffect, useRef, useState } from 'react';

/**
 * A lesson image that opens full-screen on tap. Detailed source material — a tablet photograph, a long
 * ECG strip, a dense diagram — is unreadable at column width on a phone; this needs no author effort and
 * no format change. Inside the viewer: tap the image to switch between fit-to-screen and actual size,
 * scroll (or drag on touch) to pan, Esc or the button to close. Focus returns to the image afterwards.
 */
export function ZoomableImage({ src, alt, title }: { src: string; alt: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [fullWidth, setFullWidth] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = overflow; trigger.current?.focus(); };
  }, [open]);

  return (
    <>
      <button ref={trigger} type="button" className="zoomable" onClick={() => { setFull(false); setOpen(true); }} aria-label={`Enlarge image: ${alt}`}>
        <img src={src} alt={alt} title={title} />
      </button>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt || 'Image'} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className={`lightbox-stage ${full ? 'full' : 'fit'}`} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <img src={src} alt={alt} style={full && fullWidth ? { width: fullWidth } : undefined}
              onClick={(e) => {
                // At least twice the screen width: a vector has no natural size, and a small raster at
                // "actual size" can be no bigger than the fitted view, which defeats the point.
                const img = e.currentTarget;
                setFullWidth(Math.max(img.naturalWidth, Math.round(innerWidth * 2)));
                setFull(!full);
              }} />
          </div>
          <div className="lightbox-bar">
            <span>{full ? 'Actual size — scroll to look around' : 'Tap the image for actual size'}</span>
            <button ref={close} type="button" className="btn small" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
