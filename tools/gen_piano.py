"""
Tiny piano soundfont for offline playback: one synthesised sample per octave (C2..C6).
The player pitch-shifts up to ±6 semitones from the nearest sample. Additive synthesis with
slight inharmonicity + a hammer thump; not a sampled Steinway, but it is small, ours to ship,
and free of licence questions.
"""
import numpy as np, subprocess, os
SR = 44100
def note(midi, seconds=3.0):
    f0 = 440.0 * 2 ** ((midi - 69) / 12)
    t = np.linspace(0, seconds, int(SR * seconds), endpoint=False)
    B = 0.0004  # inharmonicity coefficient
    y = np.zeros_like(t)
    n_harm = max(6, min(28, int(SR / 2 / f0)))
    for n in range(1, n_harm + 1):
        fn = f0 * n * np.sqrt(1 + B * n * n)
        if fn > SR / 2 - 100: break
        amp = 1.0 / (n ** 1.35)
        decay = np.exp(-t * (1.1 + 0.55 * n + f0 / 900))     # higher partials die first
        y += amp * decay * np.sin(2 * np.pi * fn * t + np.random.rand() * 6.283)
    # hammer noise
    thump = np.random.randn(len(t)) * np.exp(-t * 220) * 0.20
    y = y + thump
    attack = np.clip(t / 0.004, 0, 1)
    y *= attack
    y *= np.exp(-t * (0.55 + f0 / 4000))                      # body decay
    tail = np.clip((seconds - t) / 0.15, 0, 1)                # avoid a click at the end
    y *= tail
    y /= np.max(np.abs(y)) + 1e-9
    return (y * 0.82 * 32767).astype(np.int16)

os.makedirs('/tmp/sf', exist_ok=True)
names = {36: 'C2', 48: 'C3', 60: 'C4', 72: 'C5', 84: 'C6'}
for midi, name in names.items():
    raw = f'/tmp/sf/{name}.raw'
    note(midi, 3.0 if midi < 72 else 2.0).tofile(raw)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', raw,
                    '-c:a', 'libopus', '-b:a', '40k', f'{name}.ogg'], check=True)
print('wrote', list(names.values()))
