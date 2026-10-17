"""Petits décors posés au sol (débris, flaques, os, pétales, câbles…) : sprites plats avec ombre de contact, tamponnés au bake du sol.
Chaque peintre prend une palette ; la liste par thème est en bas (DECALS). Les « runs » (câbles continus) sont des tuiles de 24 px bout à bout."""
import numpy as np
from tilekit import Tile, Look, hexrgb, mix

MOSS = (70, 112, 62); MOSSL = (118, 164, 88)


def D(w, h, seed):
    return Tile(w, h, seed=seed, opaque=False, wrap=False)


def solid(t, m, **k):
    k.setdefault('a', 1.0); return t.set(m, **k)


def disc(t, cx, cy, rx, ry, c, h=0.5, **k): return solid(t, t.m_ell(cx, cy, rx, ry), c=c, h=h, **k)


def finish(t, look, shadow=True, sh=0.34, soft=False):
    """Rendu + ombre de contact (1 px bas-droite) sous les pixels opaques."""
    img, em = t.render(look)
    a = np.array(img); op = a[..., 3] > 0
    if shadow:
        sdw = np.zeros_like(op); sdw[1:, 1:] |= op[:-1, :-1]; sdw[1:, :] |= op[:-1, :]; sdw &= ~op
        a[sdw, :3] = (6, 6, 12); a[sdw, 3] = int(255 * sh)
    return Image_from(a), em


def Image_from(a):
    from PIL import Image
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


# ---------------------------------------------------------------- peintres génériques
def pebbles(pal, seed, n=4, w=14, h=9):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(n):
        x, y, s = r.uniform(2, w - 2), r.uniform(2, h - 2), r.uniform(1.2, 2.4)
        disc(t, x, y, s, s * 0.78, mix(pal, (255, 245, 225), r.uniform(0, 0.25)), h=0.8); t.px(int(x - 1), int(y - 1), c=mix(pal, (255, 250, 240), 0.5), h=1.0, a=1.0)
    return t


def bone(pal, seed, w=14, h=7):
    t = D(w, h, seed); c = pal
    t.line([(3, 3), (w - 4, 4)], wd=2, c=c, h=0.7, a=1.0)
    for (x, y) in ((2, 2), (2, 5), (w - 3, 3), (w - 3, 6)): disc(t, x, y, 1.6, 1.4, c, h=0.9)
    t.px(5, 2, c=mix(c, (255, 255, 255), 0.4), h=1.0, a=1.0)
    return t


def skull(pal, seed, w=11, h=10):
    t = D(w, h, seed); disc(t, 5.5, 4.5, 4.6, 4, pal, h=0.9); solid(t, t.m_rect(3, 7, 8, 10), c=pal, h=0.7)
    for x in (3, 6): solid(t, t.m_rect(x, 3, x + 2, 6), c=(24, 20, 24), h=-0.6)
    solid(t, t.m_rect(5, 6, 6, 7), c=(40, 34, 36), h=-0.4)
    for x in (4, 6): t.px(x, 9, c=(36, 30, 34), h=-0.3, a=1.0)
    return t


def puddle(col, seed, w=18, h=10, rip=False, glow=None, spec=(225, 240, 250)):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2, w / 2 - 1, h / 2 - 1) & ~t.m_noise(0.72, 2.0, 3) | t.m_ell(w / 2, h / 2, w / 2 - 3, h / 2 - 2)
    solid(t, m, c=col, h=-0.25)
    if glow is not None: t.E[m] = hexrgb(glow); t.EA[m] = 0.22
    solid(t, t.m_ell(w * 0.34, h * 0.4, w * 0.16, 1.0) & m, c=spec, h=-0.1)
    if rip:
        a = np.linspace(0, 6.28, 36); t.line([(w / 2 + np.cos(q) * w * 0.22, h / 2 + np.sin(q) * h * 0.26) for q in a], c=mix(col, (255, 255, 255), 0.45), h=-0.1)
    return t


def petals(cols, seed, w=16, h=10, n=6):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(n):
        x, y = r.randint(2, w - 3), r.randint(2, h - 3); c = cols[r.randint(len(cols))]
        solid(t, t.m_ell(x, y, 1.8, 1.1), c=c, h=0.4); t.px(x, y, c=mix(c, (255, 255, 255), 0.4), h=0.6, a=1.0)
    return t


def mushroom(cap, seed, glow=None, n=3, w=14, h=12):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for k in range(n):
        x = 3 + k * (w - 6) / max(1, n - 1) + r.uniform(-1, 1); y = h - 3 - r.randint(0, 3); s = 2.4 - k * 0.3
        solid(t, t.m_rect(int(x), int(y), int(x) + 1, int(y) + 3), c=(228, 220, 206), h=0.4)
        cp = disc(t, x + 0.5, y, s, s * 0.7, cap, h=0.9)
        if glow is not None: t.E[cp] = hexrgb(glow); t.EA[cp] = 0.5
        t.px(int(x), int(y) - 1, c=mix(cap, (255, 255, 255), 0.5), h=1.0, a=1.0, e=glow, ea=1.0 if glow is not None else None) if glow is not None else t.px(int(x), int(y) - 1, c=mix(cap, (255, 255, 255), 0.5), h=1.0, a=1.0)
    return t


def fern(seed, w=16, h=14, c1=(56, 110, 62), c2=(110, 170, 90)):
    t = D(w, h, seed); x0 = w // 2
    for k, ang in enumerate((-1.2, -0.6, 0, 0.6, 1.2)):
        L = 9 - abs(k - 2) * 1.5; pts = [(x0, h - 2), (x0 + np.sin(ang) * L * 0.5, h - 2 - np.cos(ang) * L * 0.6), (x0 + np.sin(ang) * L, h - 2 - np.cos(ang) * L)]
        t.line(pts, c=c1 if k % 2 else c2, h=0.7, a=1.0)
        for q in range(1, 4): t.px(int(x0 + np.sin(ang) * L * q / 4 + 1), int(h - 2 - np.cos(ang) * L * q / 4), c=c2, h=0.8, a=1.0)
    return t


def flowers(cols, seed, w=16, h=12, n=4):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(n):
        x, y = int(r.randint(2, w - 2)), int(r.randint(3, h - 2)); c = cols[r.randint(len(cols))]
        t.line([(x, y), (x, y + 3)], c=(70, 130, 64), h=0.4, a=1.0)
        for dx, dy in ((0, -1), (1, 0), (-1, 0), (0, 1)): t.px(x + dx, y + dy, c=c, h=0.8, a=1.0)
        t.px(x, y, c=(255, 214, 90), h=1.0, a=1.0)
    return t


def moss_clump(seed, w=14, h=9):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 1.5) & ~t.m_noise(0.78, 2.0, 5)
    solid(t, m, c=MOSS, h=0.6); solid(t, t.m_noise(0.62, 1.8, 7) & m, c=MOSSL, h=0.9); return t


def leaf(col, seed, w=9, h=7):
    t = D(w, h, seed); solid(t, t.m_poly([(1, 4), (4, 1), (7, 3), (5, 6)]), c=col, h=0.6); t.line([(1, 5), (7, 2)], c=mix(col, (30, 20, 10), 0.4), h=0.4, a=1.0); return t


def paper(seed, w=11, h=9, ink=(60, 70, 100), tint=(236, 234, 224)):
    t = D(w, h, seed); r = np.random.RandomState(seed); ang = r.uniform(-0.3, 0.3)
    pts = [(2 + np.sin(ang) * 2, 1), (w - 2, 1 + np.sin(ang) * 3), (w - 1, h - 2), (1, h - 1)]; solid(t, t.m_poly(pts), c=tint, h=0.4)
    for yy in range(3, h - 2, 2): t.line([(3, yy), (w - 4, yy + (1 if ang > 0 else 0))], c=ink, h=0.45, a=1.0)
    t.px(w - 2, h - 2, c=mix(tint, (160, 150, 130), 0.5), h=0.2, a=1.0)
    return t


def shards(cols, seed, w=14, h=10, n=5, glint=None):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(n):
        x, y = r.uniform(2, w - 3), r.uniform(2, h - 3); s = r.uniform(1.5, 3.0); a = r.uniform(0, 6.28); c = cols[r.randint(len(cols))]
        pts = [(x + np.cos(a) * s, y + np.sin(a) * s * 0.7), (x + np.cos(a + 2.2) * s * 0.6, y + np.sin(a + 2.2) * s * 0.5), (x + np.cos(a + 4.1) * s * 0.9, y + np.sin(a + 4.1) * s * 0.7)]
        solid(t, t.m_poly(pts), c=c, h=0.9, a=0.95); t.px(int(x), int(y), c=mix(c, (255, 255, 255), 0.7), h=1.1, a=1.0, e=glint, ea=0.8 if glint is not None else 0)
    return t


def scorch(seed, w=16, h=12, col=(18, 16, 18), spark=None):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2, w / 2 - 1, h / 2 - 1) & ~t.m_noise(0.7, 2.2, 4); solid(t, m, c=col, h=-0.2, a=0.85)
    r = np.random.RandomState(seed)
    for a in (0.2, 1.4, 2.6, 4.0, 5.2): t.line([(w / 2, h / 2), (w / 2 + np.cos(a) * w * 0.5, h / 2 + np.sin(a) * h * 0.5)], c=col, h=-0.2, a=0.7)
    if spark:
        for _ in range(3): t.px(int(r.randint(3, w - 3)), int(r.randint(3, h - 3)), c=(255, 220, 120), h=0.8, a=1.0, e=spark, ea=0.9)
    return t


def ash(seed, w=16, h=9, c=(112, 106, 100)):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 1.5) & ~t.m_noise(0.74, 2.0, 2); solid(t, m, c=c, h=0.5); solid(t, t.m_noise(0.6, 1.8, 3) & m, c=mix(c, (200, 195, 185), 0.5), h=0.8)
    solid(t, t.m_noise(0.72, 1.8, 9) & m, c=mix(c, (30, 26, 24), 0.6), h=0.3); return t


def snow(seed, w=18, h=9):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 1.5) & ~t.m_noise(0.76, 2.0, 2); solid(t, m, c=(232, 244, 252), h=0.9)
    solid(t, t.m_ell(w * 0.35, h * 0.35, w * 0.2, 1.4) & m, c=(255, 255, 255), h=1.1); solid(t, t.m_noise(0.7, 2.0, 6) & m, c=(190, 214, 236), h=0.6); return t


def frostpatch(seed, w=18, h=14):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2, w / 2 - 1, h / 2 - 1) & ~t.m_noise(0.65, 2.0, 2); solid(t, m, c=(214, 236, 252), h=0.2, a=0.55)
    for a in range(0, 360, 60): ar = np.radians(a); t.line([(w / 2, h / 2), (w / 2 + np.cos(ar) * 6, h / 2 + np.sin(ar) * 5)], c=(240, 250, 255), h=0.6, a=0.9)
    return t


def icechunk(seed, w=12, h=10):
    t = D(w, h, seed); solid(t, t.m_poly([(1, 8), (3, 2), (7, 1), (10, 5), (9, 9)]), c=(160, 214, 244), h=1.0); solid(t, t.m_poly([(3, 2), (7, 1), (6, 5)]), c=(228, 246, 255), h=1.2)
    t.px(4, 4, c=(255, 255, 255), h=1.3, a=1.0, e=(190, 245, 255), ea=0.5); return t


def footprints(seed, col=(80, 100, 130), w=10, h=14, a=0.5):
    t = D(w, h, seed)
    for (x, y) in ((3, 3), (7, 9)): solid(t, t.m_ell(x, y, 1.8, 2.6), c=col, h=-0.4, a=a); solid(t, t.m_ell(x, y - 3.4, 1.2, 0.9), c=col, h=-0.4, a=a)
    return t


def cable(seed, cols, w=24, h=6, kind='mid'):
    """Segment de câble de 24 px à brancher bout à bout : câble gainé, collier tous les 12 px ; kind=end : disparaît dans un orifice."""
    t = D(w, h, seed); c = cols[0]; x0 = 0 if kind != 'endL' else 6; x1 = w if kind != 'endR' else w - 6
    t.line([(x0, 3), (x1, 3)], wd=3, c=c, h=1.0, a=1.0); t.line([(x0, 2), (x1, 2)], c=mix(c, (255, 255, 255), 0.35), h=1.2, a=1.0)
    for x in (6, 18):
        if x0 <= x < x1: solid(t, t.m_rect(x, 1, x + 2, 5), c=(60, 64, 80), h=1.3)
    if kind == 'endL': solid(t, t.m_rect(3, 1, 6, 5), c=(50, 52, 66), h=1.0); t.px(4, 3, c=(8, 8, 14), h=-0.5, a=1.0)
    if kind == 'endR': solid(t, t.m_rect(w - 6, 1, w - 3, 5), c=(50, 52, 66), h=1.0); t.px(w - 5, 3, c=(8, 8, 14), h=-0.5, a=1.0)
    return t


def rotate(t, k=1):
    """Rotation de 90° d'un décor (tuile peinte)."""
    for name in ('H', 'C', 'A', 'E', 'EA', 'dv'): setattr(t, name, np.rot90(getattr(t, name), k).copy())
    t.w, t.h = t.h, t.w; t.X, t.Y = np.meshgrid(np.arange(t.w), np.arange(t.h)); return t


def coin(seed, col=(200, 170, 80), w=6, h=6):
    t = D(w, h, seed); disc(t, 3, 3, 2.4, 2.2, col, h=1.0); solid(t, t.m_rect(3, 2, 4, 4), c=(40, 30, 20), h=-0.2); t.px(2, 2, c=(255, 240, 180), h=1.3, a=1.0); return t


def sandal(seed, w=12, h=8):
    t = D(w, h, seed); solid(t, t.m_poly([(1, 5), (2, 2), (8, 2), (11, 4), (9, 7), (3, 7)]), c=(190, 160, 96), h=0.7)
    for x in (3, 5, 7): t.line([(x, 2), (x, 7)], c=(140, 112, 66), h=0.5, a=1.0)
    t.line([(3, 2), (6, 0), (8, 2)], c=(120, 40, 36), h=1.0, a=1.0); return t


def tilefrag(seed, col=(88, 92, 96), w=12, h=9):
    t = D(w, h, seed); solid(t, t.m_poly([(1, 6), (3, 2), (10, 1), (11, 5), (6, 8)]), c=col, h=0.8)
    for x in (4, 6, 8): t.line([(x, 2), (x - 1, 7)], c=mix(col, (20, 20, 24), 0.4), h=0.4, a=1.0)
    t.line([(3, 2), (10, 1)], c=mix(col, (230, 230, 240), 0.35), h=1.1, a=1.0); return t


def beam(seed, w=18, h=7, burnt=True):
    t = D(w, h, seed); c = (46, 34, 30) if burnt else (110, 78, 50)
    solid(t, t.m_poly([(1, 3), (4, 1), (w - 2, 2), (w - 1, 5), (3, 6)]), c=c, h=0.9); t.line([(3, 3), (w - 3, 3)], c=mix(c, (10, 8, 8), 0.5), h=0.5, a=1.0)
    if burnt:
        for x in (4, 9, 14): t.px(x, 2, c=(255, 150, 60), h=1.1, a=1.0, e=(255, 140, 50), ea=0.8)
    return t


def embers(seed, w=14, h=10, n=5):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(n): x, y = int(r.randint(1, w - 1)), int(r.randint(1, h - 1)); t.px(x, y, c=(255, 150, 60), h=0.9, a=1.0, e=(255, 130, 50), ea=0.95); t.px(x + 1, y, c=(60, 40, 36), h=0.4, a=1.0)
    return t


def shell(seed, col=(240, 214, 196), w=9, h=8, spiral=False):
    t = D(w, h, seed)
    if spiral:
        disc(t, 4, 4, 3.4, 3, col, h=1.0); t.line([(4 + np.cos(a) * r_, 4 + np.sin(a) * r_) for a, r_ in zip(np.linspace(0, 9, 24), np.linspace(0.5, 3, 24))], c=mix(col, (150, 100, 90), 0.5), h=0.7, a=1.0)
    else:
        solid(t, t.m_poly([(0, 6), (1, 3), (4, 0), (7, 3), (8, 6), (4, 7)]), c=col, h=1.0)
        for x in (2, 4, 6): t.line([(4, 6), (x, 2)], c=mix(col, (160, 110, 100), 0.45), h=0.7, a=1.0)
    t.px(2, 3, c=(255, 252, 245), h=1.3, a=1.0); return t


def starfish(seed, col=(230, 130, 90), w=11, h=11):
    t = D(w, h, seed)
    for a in np.linspace(-1.57, 4.7, 5, endpoint=False): t.line([(5.5, 5.5), (5.5 + np.cos(a) * 4.6, 5.5 + np.sin(a) * 4.6)], wd=2, c=col, h=0.9, a=1.0)
    disc(t, 5.5, 5.5, 1.8, 1.8, mix(col, (255, 220, 190), 0.3), h=1.2)
    for a in np.linspace(-1.57, 4.7, 5, endpoint=False): t.px(int(5.5 + np.cos(a) * 3.3), int(5.5 + np.sin(a) * 3.3), c=(255, 230, 200), h=1.3, a=1.0)
    return t


def driftwood(seed, w=18, h=8):
    t = D(w, h, seed); c = (136, 112, 88); solid(t, t.m_poly([(1, 5), (3, 2), (w - 3, 2), (w - 1, 4), (w - 4, 7), (4, 7)]), c=c, h=0.9)
    t.line([(3, 4), (w - 4, 4)], c=mix(c, (40, 30, 20), 0.35), h=0.5, a=1.0); t.line([(4, 3), (w - 5, 3)], c=mix(c, (230, 220, 200), 0.3), h=1.1, a=1.0)
    t.px(w - 6, 5, c=(40, 30, 24), h=-0.2, a=1.0); return t


def seaweed(seed, w=14, h=12):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for k in range(5):
        x = 2 + k * 2.2; hh = r.randint(5, 9); pts = [(x, h - 2 - i, ) for i in range(hh)]
        t.line([(x + np.sin(i * 0.9 + k) * 1.3, h - 2 - i) for i in range(hh)], c=(46, 120, 90) if k % 2 else (80, 166, 120), h=0.7, a=1.0)
    return t


def coralbit(seed, w=12, h=12, cols=((226, 122, 112), (244, 176, 146))):
    t = D(w, h, seed)
    for k, x in enumerate((3, 6, 9)): t.rect(x, 4 - k % 2 * 2 + 3, x + 2, h - 2, h=0.9, c=cols[k % 2], a=1.0); t.px(x, 3 - k % 2 * 2 + 3, c=mix(cols[k % 2], (255, 255, 255), 0.4), h=1.1, a=1.0)
    return t


def rope(seed, w=14, h=10):
    t = D(w, h, seed)
    for k in range(3): solid(t, t.m_ell(w / 2, h / 2, 5.5 - k * 1.5, 3.5 - k), c=(150, 124, 86) if k % 2 == 0 else (110, 90, 62), h=0.8 + 0.1 * k)
    solid(t, t.m_ell(w / 2, h / 2, 1.2, 0.8), c=(30, 24, 18), h=-0.3); t.line([(w - 4, h - 3), (w - 1, h - 1)], c=(150, 124, 86), h=0.8, a=1.0); return t


def ofuda(seed, w=6, h=11, burnt=False):
    t = D(w, h, seed); c = (230, 226, 210) if not burnt else (70, 56, 48); solid(t, t.m_rect(1, 1, 5, 10), c=c, h=0.5)
    for y in (3, 5, 7): t.line([(2, y), (4, y)], c=(190, 40, 36) if not burnt else (140, 50, 30), h=0.6, a=1.0)
    t.line([(3, 1), (3, 9)], c=(190, 40, 36) if not burnt else (140, 50, 30), h=0.6, a=1.0); return t


def ema(seed, w=10, h=9):
    t = D(w, h, seed); solid(t, t.m_poly([(1, 3), (5, 0), (9, 3), (9, 8), (1, 8)]), c=(190, 150, 96), h=0.8)
    t.line([(3, 4), (7, 4), (5, 7)], c=(150, 40, 36), h=0.6, a=1.0); t.px(5, 1, c=(60, 40, 30), h=0.2, a=1.0); return t


def pottery(seed, w=14, h=9):
    t = D(w, h, seed)
    for pts, c in (([(1, 5), (3, 1), (6, 4), (4, 7)], (222, 210, 190)), ([(7, 6), (9, 2), (12, 5), (10, 8)], (206, 192, 172)), ([(5, 6), (6, 4), (8, 6)], (188, 70, 60))):
        solid(t, t.m_poly(pts), c=c, h=0.9); t.line([pts[0], pts[1]], c=mix(c, (255, 255, 255), 0.5), h=1.2, a=1.0)
    return t


def needles(seed, w=14, h=9):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(11): x, y = int(r.randint(1, w - 3)), int(r.randint(1, h - 1)); t.line([(x, y), (x + 2, y + int(r.randint(-1, 2)))], c=(96, 110, 60) if r.rand() < 0.6 else (140, 120, 66), h=0.5, a=1.0)
    return t


def acorns(seed, w=10, h=8):
    t = D(w, h, seed)
    for (x, y) in ((3, 4), (7, 3)): disc(t, x, y + 0.5, 1.6, 1.8, (150, 96, 50), h=0.9); solid(t, t.m_rect(x - 1, y - 2, x + 2, y), c=(90, 66, 40), h=1.0); t.px(x - 1, y + 1, c=(210, 160, 100), h=1.2, a=1.0)
    return t


def steppers(seed, col, w=16, h=12):
    t = D(w, h, seed)
    for (x, y, s) in ((4, 4, 3.4), (11, 8, 3.8)): disc(t, x, y + 1, s + 0.6, s * 0.7 + 0.5, mix(col, (10, 8, 8), 0.5), h=0.3); disc(t, x, y, s, s * 0.7, col, h=1.0); t.px(int(x - 1), int(y - 1), c=mix(col, (255, 250, 240), 0.35), h=1.2, a=1.0)
    solid(t, t.m_ell(5, 3.5, 2, 1) & ~t.m_noise(0.55, 1.5, 3), c=MOSS, h=1.2)
    return t


def reeds(seed, w=12, h=14):
    t = D(w, h, seed)
    for k, x in enumerate((3, 5, 7, 9)): t.line([(x, h - 1), (x + (k % 2) * 2 - 1, 2 + k % 3)], c=(96, 140, 80) if k % 2 else (140, 170, 100), h=0.8, a=1.0); disc(t, x + (k % 2) * 2 - 1, 2 + k % 3, 0.9, 1.6, (120, 84, 56), h=1.0)
    return t


def lotus(seed, w=16, h=11, bloom=False):
    t = D(w, h, seed); disc(t, 8, 6, 6.5, 4, (58, 126, 96), h=0.4); solid(t, t.m_poly([(8, 6), (15, 3), (15, 5)]), a=0.0)
    t.line([(8, 6), (8, 2)], c=(40, 100, 78), h=0.3, a=1.0); t.line([(8, 6), (13, 8)], c=(40, 100, 78), h=0.3, a=1.0); disc(t, 5, 4.5, 2, 1, (130, 200, 150), h=0.7)
    if bloom:
        for dx, dy in ((0, -1), (-1, 0), (1, 0)): disc(t, 8 + dx * 2, 5 + dy * 1.5, 1.5, 1.8, (250, 190, 214), h=1.2)
        t.px(8, 5, c=(255, 224, 120), h=1.4, a=1.0)
    return t


def kernel_scale(seed, w=9, h=5):
    t = D(w, h, seed); solid(t, t.m_poly([(0, 2), (3, 0), (7, 1), (8, 3), (3, 4)]), c=(246, 150, 70), h=0.9); t.px(2, 2, c=(40, 30, 30), h=1.0, a=1.0); t.px(5, 1, c=(255, 220, 160), h=1.2, a=1.0); return t


def webs(seed, w=14, h=14):
    t = D(w, h, seed); c = (214, 218, 226)
    for a in np.linspace(0, 1.57, 5): t.line([(0, 0), (np.cos(a) * 13, np.sin(a) * 13)], c=c, h=0.2, a=0.75)
    for r in (4, 7, 10): t.line([(np.cos(a) * r, np.sin(a) * r) for a in np.linspace(0, 1.57, 8)], c=c, h=0.2, a=0.7)
    return t


def claws(seed, w=12, h=12, col=(30, 26, 26)):
    t = D(w, h, seed)
    for k in range(3): t.line([(2 + k * 3, 1), (4 + k * 3, 10)], c=col, h=-0.5, a=0.8)
    return t


def sandpile(seed, w=18, h=9):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 1.5) & ~t.m_noise(0.76, 2.0, 4); solid(t, m, c=(190, 164, 112), h=0.7); solid(t, t.m_ell(w * 0.4, h * 0.38, w * 0.22, 1.2) & m, c=(226, 202, 150), h=1.0); return t


def rubble(pal, seed, w=14, h=10):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(4):
        x, y, s = r.uniform(3, w - 3), r.uniform(3, h - 3), r.uniform(1.6, 3.0)
        solid(t, t.m_poly([(x - s, y + s * .6), (x - s * .6, y - s * .6), (x + s * .4, y - s * .8), (x + s, y + s * .4)]), c=mix(pal, (230, 220, 200), r.uniform(0, .25)), h=1.0)
    return t


def charcoal(seed, w=12, h=9):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(4):
        x, y, s = r.uniform(2, w - 3), r.uniform(2, h - 3), r.uniform(1.2, 2.2); solid(t, t.m_poly([(x - s, y + s * .5), (x, y - s * .7), (x + s, y + s * .3)]), c=(36, 32, 32), h=1.0)
        t.px(int(x), int(y), c=(90, 70, 60), h=1.2, a=1.0, e=(255, 120, 50) if r.rand() < 0.4 else None, ea=0.7 if r.rand() < 0.4 else 0)
    return t


def lavasplat(seed, w=14, h=10):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2, w / 2 - 1, h / 2 - 1.5) & ~t.m_noise(0.72, 2.0, 2); solid(t, m, c=(36, 24, 24), h=0.6)
    solid(t, t.m_ell(w / 2, h / 2, w / 4, h / 5), c=(255, 140, 50), h=0.3, e=(255, 130, 50), ea=0.55); return t


def biogoo(seed, w=14, h=10, col=(90, 200, 120), glow=(120, 255, 160)):
    t = D(w, h, seed); m = t.m_ell(w / 2, h / 2, w / 2 - 1, h / 2 - 1.5) & ~t.m_noise(0.7, 2.0, 2); solid(t, m, c=col, h=0.3, a=0.8, e=glow, ea=0.2)
    solid(t, t.m_ell(w * 0.36, h * 0.38, 2, 1), c=mix(col, (255, 255, 255), 0.6), h=0.6); return t


def mug(seed, w=9, h=8):
    t = D(w, h, seed); solid(t, t.m_ell(4, 4, 3, 2.4), c=(220, 220, 228), h=1.0); solid(t, t.m_ell(4, 4, 2, 1.5), c=(70, 40, 28), h=0.2); t.line([(7, 3), (8, 4), (7, 5)], c=(200, 200, 210), h=1.0, a=1.0)
    solid(t, t.m_ell(3, 7, 3, 0.9), c=(90, 56, 40), h=-0.2, a=0.6); return t


def keycard(seed, w=8, h=6):
    t = D(w, h, seed); solid(t, t.m_rect(0, 1, 7, 5), c=(230, 230, 240), h=0.8); solid(t, t.m_rect(0, 1, 7, 2), c=(60, 120, 220), h=0.9); t.px(5, 3, c=(80, 255, 160), h=1.0, a=1.0, e=(80, 255, 160), ea=0.9); return t


def clipboard(seed, w=9, h=11):
    t = D(w, h, seed); solid(t, t.m_rect(1, 1, 8, 10), c=(140, 100, 60), h=0.7); solid(t, t.m_rect(2, 2, 7, 9), c=(236, 234, 226), h=0.9)
    solid(t, t.m_rect(3, 0, 6, 2), c=(150, 150, 160), h=1.2)
    for y in (4, 6): t.line([(3, y), (6, y)], c=(70, 80, 110), h=0.95, a=1.0)
    return t


def cone(seed, w=9, h=11):
    t = D(w, h, seed); solid(t, t.m_poly([(4, 1), (6, 1), (8, 9), (2, 9)]), c=(240, 116, 40), h=1.0); solid(t, t.m_rect(3, 4, 7, 6), c=(240, 240, 240), h=1.1); solid(t, t.m_rect(1, 9, 9, 11), c=(60, 60, 70), h=0.7); return t


def wrench(seed, w=14, h=6):
    t = D(w, h, seed); t.line([(3, 3), (11, 3)], wd=2, c=(150, 154, 168), h=1.0, a=1.0); disc(t, 2, 3, 2.2, 2.4, (150, 154, 168), h=1.0); solid(t, t.m_rect(0, 2, 2, 4), c=(0, 0, 0), a=0.0, h=0.0)
    t.px(2, 3, c=(30, 30, 40), h=-0.4, a=1.0); t.px(12, 2, c=(220, 224, 236), h=1.2, a=1.0); return t


def bolts(seed, w=12, h=8):
    t = D(w, h, seed); r = np.random.RandomState(seed)
    for _ in range(4): x, y = int(r.randint(1, w - 2)), int(r.randint(1, h - 2)); disc(t, x + 0.5, y + 0.5, 1.4, 1.4, (150, 150, 164), h=1.0); t.px(x, y, c=(230, 232, 240), h=1.3, a=1.0)
    return t


def coil(seed, cols, w=14, h=10):
    t = D(w, h, seed)
    for k in range(3): t.line([(w / 2 + np.cos(a) * (5.5 - k * 1.4), h / 2 + np.sin(a) * (3.6 - k * 0.9)) for a in np.linspace(0, 6.3, 22)], wd=2, c=cols[k % len(cols)], h=0.9 + 0.1 * k, a=1.0)
    return t


def oilsplat(seed, w=18, h=11): return puddle((14, 14, 20), seed, w, h, spec=(120, 130, 190))


def panel_debris(seed, w=14, h=10):
    t = D(w, h, seed); solid(t, t.m_poly([(1, 7), (4, 1), (11, 2), (13, 7), (6, 9)]), c=(88, 96, 124), h=1.0); t.line([(4, 1), (11, 2)], c=(180, 190, 220), h=1.3, a=1.0)
    t.px(7, 5, c=(30, 34, 50), h=-0.2, a=1.0); t.px(10, 6, c=(200, 180, 90), h=1.2, a=1.0); return t


def butterfly(seed, w=9, h=7):
    t = D(w, h, seed); disc(t, 2.5, 3, 2.2, 2.6, (150, 190, 250), h=0.7); disc(t, 6.5, 3, 2.2, 2.6, (150, 190, 250), h=0.7); solid(t, t.m_rect(4, 2, 5, 6), c=(30, 30, 50), h=1.0); return t


# ---------------------------------------------------------------- catalogue par thème
# (nom, peintre(seed), poids, près des murs : 0 partout / 1 de préférence / 2 seulement)
def catalog():
    BONE = (222, 212, 192); ST = (112, 100, 90)
    C = {}
    C['lab'] = [
        ('paper1', lambda s: paper(s), 3, 0), ('paper2', lambda s: paper(s + 1, tint=(226, 236, 240), ink=(40, 110, 130)), 2, 0),
        ('shards', lambda s: shards([(170, 220, 236), (210, 240, 250), (120, 190, 214)], s, glint=(150, 240, 240)), 3, 0),
        ('vial', lambda s: puddle((60, 160, 160), s, 12, 8, glow=(80, 220, 200)), 1.5, 0), ('goo1', lambda s: biogoo(s), 1.5, 0), ('goo2', lambda s: biogoo(s + 4, col=(120, 90, 200), glow=(190, 140, 255)), 1, 0),
        ('footprints', lambda s: footprints(s, col=(60, 140, 140), a=0.45), 1.5, 0), ('keycard', lambda s: keycard(s), 0.7, 0), ('clipboard', lambda s: clipboard(s), 1, 0), ('mug', lambda s: mug(s), 0.8, 0),
        ('debris', lambda s: panel_debris(s), 2, 1), ('bolts', lambda s: bolts(s), 2, 0), ('scorch', lambda s: scorch(s, spark=(255, 200, 90)), 1.5, 0), ('cables', lambda s: coil(s, [(30, 30, 40), (200, 90, 50)]), 1, 1)]
    C['plant'] = [
        ('oil1', lambda s: oilsplat(s), 2.5, 0), ('oil2', lambda s: oilsplat(s + 3, 14, 9), 2, 0), ('scrap', lambda s: panel_debris(s), 2, 1), ('bolts', lambda s: bolts(s), 2, 0), ('wrench', lambda s: wrench(s), 0.8, 0),
        ('cone', lambda s: cone(s), 0.8, 1), ('coil', lambda s: coil(s, [(30, 30, 40), (232, 190, 40), (180, 60, 40)]), 1.5, 1), ('sparks', lambda s: scorch(s, spark=(255, 232, 80)), 1.5, 0),
        ('puddle', lambda s: puddle((70, 100, 150), s, 16, 9), 1.5, 0), ('paper', lambda s: paper(s, tint=(230, 226, 200), ink=(90, 80, 50)), 1, 0), ('coal', lambda s: charcoal(s), 1, 0)]
    C['ice'] = [
        ('drift1', lambda s: snow(s), 3, 1), ('drift2', lambda s: snow(s + 2, 14, 8), 2.5, 1), ('chunk', lambda s: icechunk(s), 2, 0), ('chunk2', lambda s: icechunk(s + 5, 9, 8), 1.5, 0),
        ('foot', lambda s: footprints(s), 1.5, 0), ('frost', lambda s: frostpatch(s), 2.5, 0), ('pebbles', lambda s: pebbles((120, 130, 150), s, 3), 1.2, 0), ('shards', lambda s: shards([(200, 236, 252), (150, 206, 240)], s, glint=(190, 245, 255)), 1.5, 0)]
    C['lava'] = [
        ('ash1', lambda s: ash(s), 3, 0), ('ash2', lambda s: ash(s + 2, 12, 8, (90, 84, 82)), 2, 0), ('charcoal', lambda s: charcoal(s), 2, 0), ('bone', lambda s: bone(BONE, s), 1.2, 0), ('femur', lambda s: bone((200, 190, 170), s + 3, 12, 6), 0.8, 0),
        ('skull', lambda s: skull((210, 200, 180), s), 0.5, 1), ('splat', lambda s: lavasplat(s), 1.8, 0), ('embers', lambda s: embers(s), 2, 0), ('rubble', lambda s: rubble((90, 60, 54), s), 2, 1), ('scorch', lambda s: scorch(s, col=(14, 10, 10)), 1.5, 0)]
    C['rock'] = [
        ('pebbles1', lambda s: pebbles(ST, s, 4), 3, 0), ('pebbles2', lambda s: pebbles((130, 116, 100), s + 2, 3, 11, 8), 2.5, 0), ('bone', lambda s: bone(BONE, s), 1.2, 0), ('skull', lambda s: skull(BONE, s), 0.5, 1),
        ('sand', lambda s: sandpile(s), 2, 0), ('rubble', lambda s: rubble(ST, s), 2.5, 1), ('web', lambda s: webs(s), 1.2, 2), ('claws', lambda s: claws(s), 0.8, 0), ('crystals', lambda s: shards([(255, 200, 110), (240, 170, 80)], s, glint=(255, 210, 120)), 0.8, 0)]
    C['mystic'] = [
        ('shroom1', lambda s: mushroom((255, 170, 230), s, glow=(255, 170, 230)), 2.5, 0), ('shroom2', lambda s: mushroom((160, 255, 220), s + 1, glow=(160, 255, 220), n=2), 2, 0), ('fern1', lambda s: fern(s), 2.5, 1), ('fern2', lambda s: fern(s + 2, 12, 11), 2, 1),
        ('petals', lambda s: petals([(255, 190, 235), (240, 160, 220)], s), 1.5, 0), ('flowers', lambda s: flowers([(255, 200, 240), (170, 230, 255)], s), 1.8, 0), ('moss', lambda s: moss_clump(s), 3, 1), ('pebbles', lambda s: pebbles((80, 110, 100), s, 3), 1.5, 0)]
    GARD = lambda: [('moss', lambda s: moss_clump(s), 2, 1)]
    C['bell'] = [
        ('ofuda', lambda s: ofuda(s), 1.5, 0), ('ema', lambda s: ema(s), 0.8, 1), ('coin', lambda s: coin(s), 1, 0), ('sandal', lambda s: sandal(s), 0.7, 0), ('pottery', lambda s: pottery(s), 1.5, 0),
        ('puddle', lambda s: puddle((92, 112, 140), s, 16, 9, rip=True), 2, 0), ('needles', lambda s: needles(s), 2.5, 1), ('pebbles', lambda s: pebbles((130, 122, 108), s, 3), 2, 0), ('steps', lambda s: steppers(s, (140, 132, 118)), 1.2, 0)] + GARD()
    C['ember'] = [
        ('ash1', lambda s: ash(s), 3, 0), ('ash2', lambda s: ash(s + 2, 12, 8, (84, 78, 76)), 2, 0), ('beam1', lambda s: beam(s), 2, 1), ('beam2', lambda s: beam(s + 4, 14, 6), 1.5, 1), ('tiles', lambda s: tilefrag(s), 2.5, 1),
        ('embers', lambda s: embers(s), 2.5, 0), ('ofuda', lambda s: ofuda(s, burnt=True), 1, 0), ('scorch', lambda s: scorch(s, spark=(255, 150, 60)), 2, 0), ('charcoal', lambda s: charcoal(s), 1.5, 0), ('pottery', lambda s: pottery(s), 0.8, 0)]
    C['mirror'] = [
        ('puddle1', lambda s: puddle((130, 190, 214), s, 18, 10, rip=True, glow=(130, 225, 255)), 3, 0), ('puddle2', lambda s: puddle((130, 190, 214), s + 2, 12, 8, rip=True), 2, 0),
        ('petals1', lambda s: petals([(250, 190, 212), (255, 222, 232), (232, 160, 184)], s), 3, 0), ('petals2', lambda s: petals([(250, 190, 212), (255, 222, 232)], s + 1, 12, 8, 4), 2, 0),
        ('lotus', lambda s: lotus(s, bloom=s % 2 == 0), 1.2, 0), ('reeds', lambda s: reeds(s), 1.5, 2), ('scale', lambda s: kernel_scale(s), 0.6, 0), ('steps', lambda s: steppers(s, (150, 168, 176)), 1.2, 0), ('foot', lambda s: footprints(s, col=(70, 120, 150)), 1.2, 0)]
    C['storm'] = [
        ('seaweed1', lambda s: seaweed(s), 3, 0), ('seaweed2', lambda s: seaweed(s + 3, 10, 10), 2, 0), ('shell1', lambda s: shell(s), 2, 0), ('shell2', lambda s: shell(s + 1, (222, 196, 214), spiral=True), 2, 0),
        ('starfish', lambda s: starfish(s), 1, 0), ('driftwood', lambda s: driftwood(s), 1.8, 1), ('coral', lambda s: coralbit(s), 1.5, 0), ('rope', lambda s: rope(s), 0.8, 1),
        ('fishbones', lambda s: bone((214, 214, 206), s, 12, 6), 0.8, 0), ('puddle', lambda s: puddle((40, 96, 120), s, 16, 9, rip=True), 2, 0), ('pebbles', lambda s: pebbles((100, 116, 120), s, 3), 2, 0)]
    C['ilex'] = [
        ('flowers1', lambda s: flowers([(246, 240, 224), (242, 200, 90), (176, 150, 230)], s), 3, 0), ('flowers2', lambda s: flowers([(240, 160, 190), (246, 240, 224)], s + 2, 12, 10, 3), 2.5, 0),
        ('shroom', lambda s: mushroom((196, 56, 52), s, n=2), 1.5, 1), ('fern', lambda s: fern(s), 2.5, 1), ('acorns', lambda s: acorns(s), 1.2, 0), ('steps', lambda s: steppers(s, (140, 140, 124)), 1.5, 0),
        ('ofuda', lambda s: ofuda(s), 0.6, 0), ('clump', lambda s: moss_clump(s), 2, 1), ('petals', lambda s: petals([(246, 240, 224), (246, 220, 232)], s), 1.2, 0), ('leaf', lambda s: leaf((120, 160, 70), s), 2, 0)]
    return C


RUNS = {'lab': [((30, 30, 40),), ((200, 90, 50),), ((60, 120, 210),)], 'plant': [((30, 30, 40),), ((232, 190, 40),)]}
