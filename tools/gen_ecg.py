"""
Synthetic ECG strips for the sample course, drawn as SVG on standard paper (25 mm/s, 10 mm/mV).

Vector rather than raster because `hotspot` regions are percentages of the image box: the coordinates
survive any zoom, so the picture underneath them should too. These traces are generated from a model of
the PQRST shape — none is a recording of a patient.
"""
import os
import numpy as np

MM_PER_S, MM_PER_MV, FS = 25.0, 10.0, 500

def gauss(t, c, w, a): return a * np.exp(-((t - c) ** 2) / (2 * w ** 2))

def beat(t, t0, *, p=0.15, pr=0.16, qrs=0.09, r=1.2, st=0.0, qt=0.38, tw=0.35):
    y = np.zeros_like(t)
    if p: y += gauss(t, t0 + 0.04, 0.022, p)
    q = t0 + pr
    y += gauss(t, q + 0.012, 0.008, -0.12) + gauss(t, q + 0.030, qrs / 5.5, r) + gauss(t, q + 0.052, 0.011, -0.28)
    y[(t > q + 0.06) & (t < q + 0.06 + (qt - 0.20))] += st
    y += gauss(t, q + qt * 0.62, 0.045, tw)
    return y

def strip(seconds=6.0, rr=0.8, jitter=0.0, drop_p=False, seed=1, **kw):
    rng = np.random.default_rng(seed)
    t = np.arange(0, seconds, 1 / FS)
    y = np.zeros_like(t)
    t0 = 0.25
    while t0 < seconds - 0.45:
        y += beat(t, t0, p=0.0 if drop_p else kw.pop('p', 0.15) if False else (0.0 if drop_p else kw.get('p', 0.15)),
                  **{k: v for k, v in kw.items() if k != 'p'})
        t0 += rr * (1 + rng.uniform(-jitter, jitter))
    if drop_p:
        y += 0.045 * np.sin(2 * np.pi * 7.3 * t) * rng.uniform(0.6, 1.4, t.size)
    y += 0.012 * np.sin(2 * np.pi * 0.25 * t)
    return t, y

def svg(path, t, y, seconds, mv_top=1.8, mv_bottom=-1.0):
    """One user unit = one millimetre, so the grid is exact at any rendered size."""
    w, h = seconds * MM_PER_S, (mv_top - mv_bottom) * MM_PER_MV
    pts = ' '.join(f'{x * MM_PER_S:.2f},{(mv_top - v) * MM_PER_MV:.2f}' for x, v in zip(t, y))
    open(path, 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w * 4:.0f}" height="{h * 4:.0f}">
  <defs>
    <pattern id="s" width="1" height="1" patternUnits="userSpaceOnUse">
      <path d="M1 0V1M0 1H1" fill="none" stroke="#f0c2c2" stroke-width="0.12"/>
    </pattern>
    <pattern id="l" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill="url(#s)"/>
      <path d="M5 0V5M0 5H5" fill="none" stroke="#dd8888" stroke-width="0.3"/>
    </pattern>
  </defs>
  <rect width="{w:.0f}" height="{h:.0f}" fill="#fff7f7"/>
  <rect width="{w:.0f}" height="{h:.0f}" fill="url(#l)"/>
  <polyline points="{pts}" fill="none" stroke="#151a26" stroke-width="0.45" stroke-linejoin="round" stroke-linecap="round"/>
</svg>''')

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'packages/player-web/public/courses/ecg/assets/images')
if __name__ == '__main__':
    for name, kw, secs in [
        ('complex-normal', dict(rr=1.6), 1.4),
        ('rhythm-normal', dict(rr=0.8), 6.0),
        ('rhythm-brady', dict(rr=1.30), 6.0),
        ('rhythm-tachy', dict(rr=0.44), 6.0),
        ('rhythm-af', dict(rr=0.72, jitter=0.34, drop_p=True, seed=7), 6.0),
        ('block-first-degree', dict(rr=0.86, pr=0.30), 6.0),
        ('st-elevation', dict(rr=0.80, st=0.32), 6.0),
    ]:
        t, y = strip(seconds=secs, **kw)
        svg(f'{OUT}/{name}.svg', t, y, secs)
    print('7 SVG strips written')
