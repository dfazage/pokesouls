"""Textures de murs pixel art : face (4 variantes + porte) et dessus (4 variantes) par thème, avec jumeau émissif.
Les tuiles se répètent verticalement (RepeatWrapping) et horizontalement de variante à variante : le rendu est périodique."""
import numpy as np
from tilekit import Tile, Look, hexrgb, mix
from floors_a import jit

S = 24

# couleurs copiées de THEMES (js/maps.js) : wallA, wallB, face, accent, accent2
WALL = {
    'lab': ('#2c3452', '#2a3150', '#1c2038', (80, 220, 200), (200, 140, 255)),
    'ice': ('#5b7fa8', '#56799f', '#33507a', (190, 240, 255), (140, 200, 255)),
    'plant': ('#444458', '#40405a', '#27273a', (255, 232, 80), (120, 230, 255)),
    'lava': ('#5a3430', '#56302c', '#321a18', (255, 130, 50), (255, 200, 90)),
    'rock': ('#5e5248', '#5a4e44', '#38302a', (255, 200, 110), (200, 170, 120)),
    'bell': ('#6e675c', '#675f55', '#3a342e', (255, 206, 96), (130, 200, 255)),
    'ember': ('#4a3a34', '#46362f', '#251a16', (255, 140, 60), (255, 205, 110)),
    'mirror': ('#9fb4bc', '#98aeb6', '#6a8088', (150, 225, 255), (255, 190, 210)),
    'storm': ('#3c5868', '#385464', '#1a2c38', (110, 220, 245), (80, 170, 230)),
    'ilex': ('#27494a', '#244446', '#142a2c', (255, 225, 130), (160, 255, 200)),
    'mystic': ('#27494a', '#244446', '#142a2c', (255, 170, 230), (160, 255, 220)),
}
SHADOW = {'lab': (12, 12, 36), 'ice': (14, 30, 80), 'plant': (16, 14, 30), 'lava': (30, 6, 8), 'rock': (24, 16, 18), 'bell': (28, 20, 32), 'ember': (30, 10, 10),
          'mirror': (26, 56, 84), 'storm': (4, 20, 44), 'ilex': (8, 26, 24), 'mystic': (6, 24, 32)}
LIGHT = {'lab': (200, 220, 255), 'ice': (240, 250, 255), 'lava': (255, 190, 140), 'mirror': (255, 252, 245), 'mystic': (210, 255, 235)}
MOSS = (70, 112, 62); MOSSL = (118, 164, 88)


def rgb(h): return hexrgb(h)


def partition(total, lo, hi, rng):
    out = []; left = total
    while left > hi + lo:
        w = int(rng.randint(lo, hi + 1)); out.append(w); left -= w
    if left > hi: out += [left // 2, left - left // 2]
    else: out.append(left)
    return out


def masonry(t, rows, rng, var=0.14, gap=-0.85, gk=0.5, rough=0.0, lo=7, hi=13):
    """Rangées d'appareil ; rows = [(y0, y1)] ; largeurs aléatoires périodiques ; joints creux en bas et à gauche de chaque bloc."""
    t.H[:] = 0.0
    for (y0, y1) in rows:
        parts = partition(S, lo, hi, rng); off = int(rng.randint(0, S)); x = off
        for w in parts:
            xa = x % S; xb = xa + w
            for xx0, xx1 in ((xa, min(S, xb)), (0, xb - S)) if xb > S else ((xa, xb),):
                if xx1 <= xx0: continue
                bm = t.m_rect(xx0, y0, xx1, y1); t.C[bm] *= 1.0 + (rng.rand() - 0.5) * var * 2
                t.H[bm] = 0.0 + (rng.rand() - 0.5) * 0.1
                if rough: t.H[bm] += (rng.rand(*t.H[bm].shape) - 0.5) * rough
            t.gap(xa % S, y0, xa % S + 1, y1, gap, gk)
            x += w
        t.gap(0, y1 - 1, S, y1, gap, gk)


def new(base, seed, i, mott=6, grain=3):
    t = Tile(S, S, seed=seed * 131 + i, base=jit(base, seed * 131 + i)); t.mottle(mott, 5.0, 1); t.grain(grain, 2); return t


def rivet(t, x, y):
    for dx in (0, 1):
        for dy in (0, 1): t.px(x + dx, y + dy, h=0.7)
    m = t.m_rect(x, y, x + 2, y + 2); t.C[m] = np.clip(t.C[m] * 1.35 + 8, 0, 255)


def side_base(key, A, B, F):
    return tuple(a * 0.62 + f * 0.38 for a, f in zip(A, F))


# ============================================================ FACES
def lab_side(base, ac, ac2, vi, seed):
    rng = np.random.RandomState(seed * 10 + vi); t = new(base, seed, vi)
    t.H[:] = 0.0
    t.plate(0, 0, 23, 12, 0, 0.25); t.plate(0, 12, 23, 24, 0.02, 0.25); t.gap(0, 11, S, 12, -0.8, 0.5); t.gap(S - 1, 0, S, S, -0.8, 0.5)
    for x, y in ((2, 2), (20, 2), (2, 14), (20, 14)): rivet(t, x, y)
    if vi == 1:   # écran
        t.rect(4, 4, 20, 19, h=-0.4, c=(16, 20, 42)); t.rect(5, 5, 19, 18, h=-0.1, c=(24, 32, 62)); t.rect(6, 11, 18, 13, h=0.2, c=ac, e=ac, ea=1.0)
        t.rect(6, 7, 11, 8, c=mix(ac, (20, 20, 40), 0.5), e=ac, ea=0.5); t.rect(6, 15, 14, 16, c=mix(ac, (20, 20, 40), 0.5), e=ac, ea=0.5)
    elif vi == 2:   # aération
        t.rect(5, 5, 19, 19, h=-0.6, c=(10, 12, 24))
        for i in range(5): t.rect(6, 7 + int(i * 2.6), 18, 8 + int(i * 2.6), h=0.1, c=(70, 80, 112))
    elif vi == 3:   # voyants
        for i in range(4):
            c = ac2 if i % 2 else ac; t.rect(4 + i * 5, 9, 7 + i * 5, 14, h=-0.4, c=(14, 16, 30)); t.rect(5 + i * 5, 10, 7 + i * 5, 13, h=0.3, c=c, e=c, ea=1.0)
    return t


def plant_side(base, ac, ac2, vi, seed):
    t = new(base, seed, vi); t.H[:] = 0.0
    t.plate(0, 0, 23, 24, 0, 0.25); t.gap(S - 1, 0, S, S, -0.8, 0.5)
    for x, y in ((2, 2), (20, 2), (2, 20), (20, 20)): rivet(t, x, y)
    if vi == 1:   # tuyau horizontal
        t.rect(0, 8, 24, 16, h=0.7, c=(110, 114, 140)); t.rect(0, 8, 24, 10, h=0.9, c=(190, 196, 220)); t.rect(0, 14, 24, 16, h=0.2, c=(60, 62, 84))
        for x in (3, 11, 19): t.rect(x, 7, x + 2, 17, h=1.0, c=(150, 154, 180))
    elif vi == 2:   # bande jaune et noire + boîtier
        for i in range(-4, 14):
            c = (232, 192, 32) if i % 2 else (32, 28, 16); t.poly([(2 + i * 3, 17), (5 + i * 3, 17), (9 + i * 3, 21), (6 + i * 3, 21)], c=c, h=0.2)
        t.rect(9, 4, 15, 12, h=-0.3, c=(18, 18, 30)); t.rect(11, 6, 13, 8, c=ac, e=ac, ea=0.9, h=0.2)
    elif vi == 3:   # câbles qui pendent
        for i in range(3):
            pts = [(0, 6 + i * 5), (6, 4 + i * 5), (14, 9 + i * 5), (23, 6 + i * 5)]; t.line(pts, wd=2, c=(20, 20, 30), h=0.9); t.line([(p[0], p[1] - 1) for p in pts], c=(90, 94, 120), h=1.1)
        t.line([(2, 6), (10, 7), (18, 8), (22, 7)], c=ac, e=ac, ea=0.7, h=0.5)
    return t


def ice_side(base, ac, ac2, vi, seed):
    rng = np.random.RandomState(seed * 10 + vi); t = new(base, seed, vi, 9, 3)
    masonry(t, [(0, 12), (12, 24)], rng, var=0.10, gap=-0.55, gk=0.8, lo=9, hi=15)
    t.C[t.H < -0.3] = mix(t.C[t.H < -0.3], (225, 245, 255), 0.55)   # joints regelés
    t.scatter(10, area=(0, 0, 24, 24), c=(238, 250, 255), h=0.3)
    if vi == 1: t.crack([(3, 1), (9, 9), (7, 15), (15, 23)], depth=-0.7, k=0.9, e=ac, ea=0.7)
    if vi == 2: t.ell(12, 12, 8, 5, c=(246, 252, 255), h=0.4); t.ell(10, 10, 4, 2, c=(255, 255, 255), h=0.6)
    if vi == 3:
        for i in range(4):
            x = 3 + i * 6; L = 6 + (i % 2) * 4; t.poly([(x, 0), (x + 3, 0), (x + 1.5, L)], c=(200, 236, 252), h=0.9); t.line([(x + 1, 0), (x + 1, L - 2)], c=(250, 255, 255), h=1.1)
    return t


def lava_side(base, ac, ac2, vi, seed):
    rng = np.random.RandomState(seed * 10 + vi); t = new(base, seed, vi, 8, 4); t.C *= 0.8
    masonry(t, [(0, 12), (12, 24)], rng, var=0.12, gap=-0.9, gk=0.45, rough=0.15, lo=8, hi=14)
    cr = [[(3, 1), (9, 8), (7, 14), (14, 23)], [(14, 0), (17, 9), (12, 15), (19, 24)], [(0, 10), (8, 13), (15, 12), (24, 17)], [(6, 0), (5, 7), (12, 9), (10, 24)]][vi]
    m = t.crack(cr, depth=-0.8, k=0.4, wd=2, e=ac, ea=0.95); t.set(t.m_line(cr), e=ac2, ea=0.8, c=ac2)
    return t


def rock_side(base, ac, ac2, vi, seed):
    rng = np.random.RandomState(seed * 10 + vi); t = new(base, seed, vi, 8, 4)
    masonry(t, [(0, 8), (8, 16), (16, 24)] if vi % 2 else [(0, 12), (12, 24)], rng, var=0.14, gap=-0.85, gk=0.5, rough=0.2, lo=6, hi=12)
    for i in range(3): t.line([(0, 3 + i * 8), (23, 4 + i * 8)], c=mix(t.C[2, 2], (30, 22, 18), 0.3), h=-0.1)
    t.scatter(4, area=(1, 1, 22, 22), c=(32, 26, 22), h=-0.4)
    if vi == 3: t.scatter(4, area=(2, 2, 22, 22), c=ac, e=ac, ea=0.5, h=0.5)
    return t


def stone_garden_side(base, ac, ac2, vi, seed, moss=1.0, vine=False, glow=None, wet=False, ember=False, sea=False):
    rng = np.random.RandomState(seed * 10 + vi); t = new(base, seed, vi, 7, 3)
    masonry(t, [(0, 8), (8, 16), (16, 24)], rng, var=0.12, gap=-0.8, gk=0.5, rough=0.1, lo=7, hi=12)
    if moss:
        t.ell(4 + rng.randint(0, 14), 21, 4, 2.2, c=MOSS, h=0.2)
        t.set(t.m_noise(0.7, 2.0, 5) & t.m_rect(0, 14, S, S), c=MOSSL, h=0.3)
    if wet:
        for x in (4, 11, 18): t.line([(x, 2), (x + (x % 2), 18)], c=mix(t.C[2, 2], (60, 100, 120), 0.4), h=-0.2)
    if ember: t.set(t.m_noise(0.5, 3, 3), c=mix(t.C[2, 2], (10, 8, 8), 0.65)); t.scatter(3, area=(2, 8, 22, 22), c=(255, 150, 60), e=(255, 140, 50), ea=0.8, h=0.4)
    if sea:
        t.scatter(8, area=(1, 4, 23, 23), c=(214, 226, 220), h=0.7)
        if vi == 2: t.line([(4, 12), (12, 12), (12, 6)], c=ac, e=ac, ea=0.55, h=-0.3)
    if vine:
        for x in (6, 17): t.line([(x, 0), (x - 2, 8), (x + 1, 16), (x - 1, 24)], c=(50, 120, 76), h=0.7)
        t.scatter(6, area=(3, 2, 20, 22), c=(110, 180, 100), h=0.8)
    if glow is not None and vi != 0:
        t.line([(9 + vi * 2, 0), (5, 8), (13, 14), (9, 24)], c=(50, 130, 80), h=0.6); c = ac if vi % 2 else ac2
        t.rect(9, 12, 11, 14, c=c, e=c, ea=1.0, h=0.6)
    return t


def bell_side(base, ac, ac2, vi, seed):
    t = stone_garden_side(base, ac, ac2, vi, seed)
    if vi == 1:   # poteau laqué
        t.rect(8, 0, 16, S, h=0.5, c=(106, 42, 34)); t.rect(8, 0, 10, S, h=0.7, c=(138, 58, 44)); t.rect(6, 2, 18, 5, h=0.9, c=(42, 20, 16))
    elif vi == 3:   # ex-voto
        t.rect(10, 9, 14, 15, h=0.7, c=(200, 160, 80), e=(255, 200, 110), ea=0.45); t.rect(11, 6, 13, 8, h=0.4, c=(58, 36, 24))
    return t


FACES = {
    'lab': lab_side, 'plant': plant_side, 'ice': ice_side, 'lava': lava_side, 'rock': rock_side, 'bell': bell_side,
    'ember': lambda b, a, a2, v, s: stone_garden_side(b, a, a2, v, s, moss=0, ember=True),
    'mirror': lambda b, a, a2, v, s: stone_garden_side(b, a, a2, v, s, wet=True),
    'storm': lambda b, a, a2, v, s: stone_garden_side(b, a, a2, v, s, moss=0, sea=True),
    'ilex': lambda b, a, a2, v, s: stone_garden_side(b, a, a2, v, s, vine=True),
    'mystic': lambda b, a, a2, v, s: stone_garden_side(b, a, a2, v, s, glow=True),
}


# ============================================================ DESSUS
def top_tile(key, B, A, ac, ac2, vi, seed):
    rng = np.random.RandomState(seed * 20 + vi); base = B if vi % 2 == 0 else A
    t = new(base, seed + 50, vi, 6, 3); t.H[:] = 0.0
    for j in range(2):
        for i in range(2):
            m = t.m_rect(i * 12, j * 12, i * 12 + 12, j * 12 + 12); t.C[m] *= 1.0 + (rng.rand() - 0.5) * 0.18; t.plate(i * 12, j * 12, i * 12 + 12, j * 12 + 12, 0.0, 0.2); t.gap(i * 12 + 11, j * 12, i * 12 + 12, j * 12 + 12, -0.8, 0.55); t.gap(i * 12, j * 12 + 11, i * 12 + 12, j * 12 + 12, -0.8, 0.55)
    if key == 'ice': t.scatter(6, area=(1, 1, 23, 23), c=(240, 250, 255), h=0.3)
    if key == 'lava': t.scatter(2, area=(3, 3, 20, 20), c=ac2, e=ac2, ea=0.9, h=0.4)
    if key in ('mystic', 'bell', 'ilex', 'mirror'): 
        mm = t.m_ell(7 + vi * 3, 9 + vi * 2, 6, 3.5) & t.m_noise(0.42, 2.5, 3 + vi); t.set(mm, c=MOSS, h=0.3); t.set(t.m_noise(0.7, 2, 3 + vi) & mm, c=MOSSL, h=0.5)
    if key == 'ember': t.set(t.m_noise(0.5, 3, 3 + vi), c=mix(t.C[2, 2], (10, 8, 8), 0.6))
    if key == 'storm': t.scatter(5, area=(1, 1, 23, 23), c=(210, 226, 220), h=0.6)
    if key == 'plant' and vi == 2:
        t.rect(8, 8, 16, 16, h=-0.4, c=(24, 24, 36)); t.rect(11, 11, 13, 13, c=(255, 210, 74), e=(255, 210, 74), ea=1.0, h=0.3)
    if key == 'lab' and vi == 1: t.rect(4, 11, 20, 13, c=ac, e=ac, ea=1.0, h=0.1)
    return t


# ============================================================ PORTE
def door_tile(key):
    t = Tile(S, S, seed=991, base=(60, 69, 104)); t.H[:] = 0.0
    t.plate(0, 0, 24, 24, 0, 0.3); t.rect(3, 3, 21, 22, h=-0.45, c=(35, 42, 74)); t.rect(3, 3, 21, 4, h=-0.25, c=(47, 56, 96)); t.rect(3, 21, 21, 22, h=-0.8, c=(16, 20, 42))
    for x, y in ((1, 1), (21, 1), (1, 21), (21, 21)): t.px(x, y, h=0.8, c=(120, 130, 170))
    c = (198, 144, 255); t.rect(5, 11, 19, 13, c=c, e=c, ea=0.9, h=0.0); t.rect(11, 5, 13, 19, c=c, e=c, ea=0.9, h=0.0)
    return t


def build_wall_tiles():
    """Renvoie {clé: [(face0..3), porte, (dessus0..3)]} = 9 tuiles (rgba, émissif) par thème."""
    out = {}
    for key, (a, b, f, ac, ac2) in WALL.items():
        A = rgb(a); B = rgb(b); F = rgb(f); base = side_base(key, A, B, F)
        look = Look(shadow=SHADOW.get(key, (22, 20, 44)), light=LIGHT.get(key, (255, 238, 205)), dither=0.45)
        seed = sum(ord(c) for c in key)
        tiles = []
        for vi in range(4): tiles.append(FACES[key](base, ac, ac2, vi, seed).render(look))
        tiles.append(door_tile(key).render(look))
        for vi in range(4): tiles.append(top_tile(key, B, A, ac, ac2, vi, seed).render(look))
        out[key] = tiles
    return out
