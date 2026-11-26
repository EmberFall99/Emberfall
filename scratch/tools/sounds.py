"""Synthesised sound effects + music for Emberfall (all generated, no samples)."""
import numpy as np, io, wave
from scipy.signal import butter, lfilter
R = 22050
rng = np.random.default_rng(7)

def t(d): return np.arange(int(R * d)) / R
def noise(d): return rng.uniform(-1, 1, int(R * d))
def lp(x, f, o=2): b, a = butter(o, f / (R / 2)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (R / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (R / 2), hi / (R / 2)], 'band'); return lfilter(b, a, x)
def env(n, a, d, shape=3):
    e = np.ones(n); ai = max(1, int(a * R)); e[:ai] = np.linspace(0, 1, ai)
    tail = np.linspace(1, 0, n - ai) ** shape; e[ai:] = tail; return e
def fade(x, s=0.01):
    k = int(R * s); x = x.copy(); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k); return x
def wav(x, peak=0.85):
    x = np.asarray(x, float); x = x / (np.max(np.abs(x)) + 1e-9) * peak
    b = io.BytesIO()
    with wave.open(b, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    return b.getvalue(), len(x)

def whoosh(d, lo, hi):
    n = noise(d); tt = t(d); out = np.zeros_like(n)
    for i, f in enumerate(np.linspace(lo, hi, 6)):
        seg = slice(int(i * len(n) / 6), int((i + 1) * len(n) / 6))
        out[seg] = bp(n, f * .7, f * 1.3)[seg]
    return out * np.sin(np.pi * tt / d) ** 2

def swing(): return wav(whoosh(.2, 600, 2400))
def heavy(): return wav(whoosh(.32, 300, 1400) + 0.3 * lp(noise(.32), 200) * env(int(R * .32), .1, .2))
def hit():
    d = .22; tt = t(d)
    x = lp(noise(d), 2500) * env(len(tt), .002, .03, 6) * 1.5
    x += np.sin(2 * np.pi * (140 - 200 * tt) * tt) * env(len(tt), .002, .2, 3)
    x += 0.25 * np.sin(2 * np.pi * 1350 * tt) * np.exp(-tt * 30)
    return wav(x)
def roll(): d = .3; return wav(lp(noise(d), 700) * np.sin(np.pi * t(d) / d) ** 1.5 + 0.2 * whoosh(d, 200, 600), .6)
def hurt():
    d = .3; tt = t(d); f = 130 - 60 * tt
    saw = 2 * ((np.cumsum(f) / R) % 1) - 1
    return wav(lp(saw, 900) * env(len(tt), .01, .29, 2) + lp(noise(d), 300) * env(len(tt), .002, .08, 4))
def heal():
    d = .9; tt = t(d); x = np.zeros_like(tt)
    for i, f in enumerate([523, 659, 784, 1047, 1319]):
        s = (tt - i * .08).clip(0); x += np.sin(2 * np.pi * f * tt) * np.exp(-s * 5) * (tt > i * .08)
    return wav(x * env(len(tt), .02, .88, 1) + 0.15 * bp(noise(d), 3000, 6000) * env(len(tt), .3, .6, 2), .6)
def toll():
    d = 3.2; tt = t(d); x = np.zeros_like(tt)
    for f, a, k in [(73, 1, 1.0), (146.5, .6, 1.4), (175, .4, 2), (220, .35, 1.8), (293, .25, 2.5), (392, .15, 3)]:
        x += a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * k)
    x += 0.4 * lp(noise(d), 400) * np.exp(-tt * 12)
    return wav(x)
def bones():
    d = .7; x = np.zeros(int(R * d))
    for _ in range(14):
        p = rng.integers(0, len(x) - 1500); n = 400
        x[p:p + n] += bp(noise(n / R), 1200, 4000) * np.exp(-np.arange(n) / 60) * rng.uniform(.4, 1)
    return wav(x, .7)
def slam():
    d = 1.0; tt = t(d)
    x = np.sin(2 * np.pi * (70 * np.exp(-tt * 3)) * tt * 1.5) * np.exp(-tt * 3.5)
    x += lp(noise(d), 600) * np.exp(-tt * 6) * 1.2 + 0.4 * bp(noise(d), 1500, 4000) * np.exp(-tt * 25)
    return wav(np.tanh(x * 2))
def roar():
    d = 1.6; tt = t(d); f = 62 + 8 * np.sin(2 * np.pi * 5 * tt)
    saw = 2 * ((np.cumsum(f) / R) % 1) - 1
    x = lp(saw, 500) + 0.8 * bp(noise(d), 120, 900)
    return wav(np.tanh(2.5 * x) * env(len(tt), .25, 1.3, 1.5))
def kindle():
    d = 1.4; tt = t(d)
    x = whoosh(d, 150, 900) * 1.4
    for _ in range(40):
        p = rng.integers(0, len(tt) - 300); x[p:p + 200] += hp(noise(200 / R), 2000) * .4 * np.exp(-np.arange(200) / 30)
    x += .25 * np.sin(2 * np.pi * 220 * tt) * np.sin(np.pi * tt / d) ** 2
    return wav(x, .7)
def souls():
    d = .8; tt = t(d); x = np.zeros_like(tt)
    for i, f in enumerate([880, 1175, 1568, 1760]):
        x += np.sin(2 * np.pi * f * tt) * np.exp(-((tt - i * .06).clip(0)) * 6) * (tt > i * .06)
    return wav(x + 0.2 * bp(noise(d), 4000, 8000) * env(len(tt), .05, .7), .55)
def victory():
    d = 4.0; tt = t(d); x = np.zeros_like(tt)
    for f in [146.8, 220, 293.7, 370, 440, 587]:
        for det in (-.6, .6):
            ph = (np.cumsum(np.full_like(tt, f + det)) / R) % 1
            x += lp(2 * ph - 1, 1500) * .3
    return wav(x * env(len(tt), 1.2, 2.8, 1.2), .7)

def ambient():
    d = 12.0; tt = t(d)
    x = np.zeros_like(tt)
    for f, a in [(55, .7), (82.4, .45), (110, .3), (164.8, .12)]:
        ph = (np.cumsum(np.full_like(tt, f)) / R) % 1
        x += a * lp(2 * ph - 1, 300) * (0.75 + 0.25 * np.sin(2 * np.pi * tt / d * 2 + f))
    wind = bp(noise(d), 300, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / d * 3)) * .35
    x = x + wind
    # loop crossfade
    k = int(R * 1.0); x[:k] = x[:k] * np.linspace(0, 1, k) + x[-k:] * np.linspace(1, 0, k); x = x[:-k]
    return wav(x, .45)

def boss_theme():
    bpm = 132; beat = 60 / bpm; bars = 4; d = beat * 4 * bars; tt = t(d); x = np.zeros_like(tt)
    def put(sig, at):
        i = int(at * R); j = min(len(x), i + len(sig)); x[i:j] += sig[:j - i]
    def drum(f=55, dec=10, lev=1):
        u = t(.5); return lev * (np.sin(2 * np.pi * f * u * (1 + np.exp(-u * 30))) * np.exp(-u * dec) + .3 * lp(noise(.5), 800) * np.exp(-u * 30))
    riff = [146.8, 146.8, 174.6, 146.8, 220, 207.7, 174.6, 155.6]
    for b in range(bars * 4):
        put(drum(), b * beat)
        if b % 2 == 1: put(drum(90, 18, .6), b * beat + beat / 2)
    for i in range(bars * 8):
        f = riff[i % 8] / (2 if (i // 8) % 2 else 1)
        u = t(beat / 2); ph = (np.cumsum(np.full_like(u, f)) / R) % 1
        put(lp(2 * ph - 1, 1100) * env(len(u), .005, beat / 2 - .005, 1.5) * .35, i * beat / 2)
    for f in (73.4, 110):
        ph = (np.cumsum(np.full_like(tt, f)) / R) % 1
        x += .18 * lp(2 * ph - 1, 250)
    return wav(np.tanh(x * 1.3), .55)

ALL = dict(swing=swing, heavy=heavy, hit=hit, roll=roll, hurt=hurt, heal=heal, toll=toll, bones=bones,
           slam=slam, roar=roar, kindle=kindle, souls=souls, victory=victory, ambient=ambient, boss_theme=boss_theme)
