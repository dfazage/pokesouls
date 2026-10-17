"""Familles de sol B : jardins d'Edo (dalles, briques, planches, prairie, gravier d'arène) + variantes de thème (braise, lac, abysses)."""
import numpy as np
from tilekit import Tile, hexrgb, mix
from floors_a import new, frame, S, jit

MOSS = (70, 112, 62); MOSSL = (110, 156, 84)


def slab_base(t, off=7):
    """Grandes dalles : un joint horizontal à mi-hauteur, joints verticaux décalés ; joint de tuile en bas/à droite."""
    frame(t, 0.5)
    t.gap(0, 11, S, 12, k=0.5); t.gap(off, 0, off + 1, 11, k=0.5); t.gap(S - 8 - (off % 5), 12, S - 7 - (off % 5), S, k=0.5)
    t.mottle(5, 5.0, 3)


def slab(base, seed=7, calm=1.0, extra=None, moss=MOSS):
    out = []; n = [0]

    def T(off=7):
        n[0] += 1; t = new(base, seed, n[0], 7, 3); slab_base(t, off); return t

    out.append(('plain', T(7), 4)); out.append(('plain2', T(14), 4))
    t = T(9)   # mousse dans les joints
    for x, y in ((9, 5), (9, 8), (13, 11), (6, 11), (18, 16), (18, 20)): t.ell(x, y, 2.6, 2, c=moss, h=-0.2)
    t.set(t.m_noise(0.66, 2.5, 4), c=MOSSL, h=0.15); t.ell(4, 18, 4, 2.5, c=moss, h=0.1)
    out.append(('moss', t, 3))
    t = T(7); t.crack([(3, 2), (8, 6), (12, 4), (18, 9), (22, 7)], depth=-0.8, k=0.35); t.crack([(8, 6), (9, 10)], depth=-0.6, k=0.4)
    out.append(('crack', t, 2))
    t = T(11)   # herbes folles dans le joint
    for x in (11, 12, 13): t.line([(x, 11), (x + (x - 12), 6 - (x % 2))], c=MOSSL, h=0.5)
    t.line([(17, 18), (18, 14)], c=MOSS, h=0.5); t.line([(18, 18), (20, 15)], c=MOSSL, h=0.5)
    out.append(('weeds', t, 1.2))
    t = T(7)   # usure : centre poli
    t.ell(12, 12, 9, 7, c=mix(t.C[5, 5], (220, 214, 200), 0.18), h=-0.1, dv=0.1)
    out.append(('worn', t, 0.8))
    t = T(12); t.poly([(0, 0), (5, 0), (0, 4)], h=-0.6, c=mix(t.C[3, 3], (20, 16, 14), 0.5)); t.scatter(5, area=(1, 1, 9, 9), c=mix(t.C[3, 3], (230, 220, 200), 0.3), h=0.4)
    out.append(('chip', t, 1.5))
    t = T(7); p = t.m_ell(12, 16, 8, 3.5); t.set(p, h=-0.25, c=mix(t.C[5, 5], (70, 90, 120), 0.45)); t.set(t.m_ell(9, 15, 3, 1), c=(205, 220, 235))
    out.append(('puddle', t, 0.6))
    t = T(7)   # lichen
    for x, y in ((4, 4), (6, 5), (16, 3), (18, 16), (20, 18), (5, 18)): t.ell(x, y, 1.5, 1.2, c=(168, 176, 104), h=0.2)
    out.append(('lichen', t, 0.8))
    t = T(7); t.scatter(6, area=(1, 1, 22, 22), c=(170, 160, 140), h=0.4); t.scatter(5, area=(1, 1, 22, 22), c=(40, 34, 30), h=-0.3)
    out.append(('grit', t, 1))
    t = T(7); t.px(11, 11, c=(232, 184, 84), e=(232, 184, 84), ea=0.7, h=0.8); t.px(12, 11, c=(232, 184, 84), h=0.8); t.px(11, 12, c=(200, 150, 60), h=0.6); t.px(12, 12, c=(200, 150, 60), h=0.6)
    out.append(('nail', t, 0.6))
    if extra: out += extra(T)
    return out


def brick(base, seed=8, calm=1.0, extra=None):
    out = []; n = [0]

    def T(sh=0):
        n[0] += 1; t = new(base, seed, n[0], 5, 3); t.H[:] = 0.0
        for ry in range(4):
            y0 = ry * 6; off = 0 if (ry + sh) % 2 == 0 else 6
            for bx in range(-12, S, 12):
                x0 = bx + off
                if x0 + 12 <= 0 or x0 >= S: continue
                xa, xb = max(0, x0), min(S, x0 + 12)
                bm = t.m_rect(xa, y0, xb, y0 + 6)
                shade = 1.0 + (np.random.RandomState(seed * 1000 + n[0] * 11 + ry * 5 + bx).rand() - 0.5) * 0.22
                t.C[bm] *= shade
        # joints : mortier creux (lignes de 1 px sous chaque rangée et entre briques)
        for ry in range(4):
            y0 = ry * 6; off = 0 if (ry + sh) % 2 == 0 else 6
            t.gap(0, y0 + 5, S, y0 + 6, -0.8, 0.55)
            for bx in range(-12, S, 12):
                x = bx + off
                if 0 <= x < S: t.gap(x, y0, x + 1, y0 + 5, -0.8, 0.55)
        return t

    t = T(); out.append(('plain', t, 5)); out.append(('plain2', T(1), 4))
    t = T(); t.rect(5, 6, 11, 11, h=-0.7, c=mix(t.C[3, 3], (14, 10, 8), 0.65)); t.rect(5, 6, 11, 7, h=-0.9)
    out.append(('missing', t, 1.2))
    t = T(); t.set(t.m_noise(0.5, 3, 2), c=mix(t.C[3, 3], (12, 8, 6), 0.55), dv=-0.05)
    out.append(('soot', t, 2))
    t = T(1); t.ell(3, 5, 4, 3, c=MOSS, h=0.1); t.set(t.m_noise(0.7, 2.0, 5), c=MOSSL, h=0.15); t.ell(18, 20, 4, 2.5, c=MOSS, h=0.1)
    out.append(('moss', t, 2))
    t = T(); t.crack([(2, 2), (6, 5), (5, 9), (10, 12), (9, 16)], depth=-0.8, k=0.35); out.append(('crack', t, 2))
    t = T(1); t.set(t.m_noise(0.6, 4, 6), c=mix(t.C[3, 3], (255, 220, 190), 0.25), dv=0.1); out.append(('worn', t, 1.5))
    t = T(1); t.scatter(8, area=(1, 1, 22, 22), c=mix(t.C[3, 3], (30, 20, 16), 0.5), h=-0.3); out.append(('pitted', t, 1.5))
    if extra: out += extra(T)
    return out


def wood(base, seed=9, calm=1.0, extra=None):
    out = []; n = [0]

    def T(joints=(None, None, None)):
        n[0] += 1; t = new(base, seed, n[0], 5, 3); t.H[:] = 0.0
        for ry in range(3):
            y0 = ry * 8; t.C[t.m_rect(0, y0, S, y0 + 8)] *= 1.0 + (np.random.RandomState(seed * 77 + n[0] * 5 + ry).rand() - 0.5) * 0.2
            t.gap(0, y0 + 7, S, y0 + 8, -0.8, 0.5)
            for k in range(2):   # veines du bois
                yy = y0 + 2 + k * 3; t.line([(0, yy), (8, yy + (k % 2)), (16, yy), (23, yy + (1 - k % 2))], c=mix(t.C[y0 + 2, 2], (30, 20, 12), 0.25), h=0.0)
            if joints[ry] is not None: t.gap(joints[ry], y0, joints[ry] + 1, y0 + 7, -0.8, 0.5)
        return t

    out.append(('plain', T((None, None, None)), 4)); out.append(('joint', T((6, 15, 9)), 4)); out.append(('joint2', T((17, 4, 12)), 4))
    t = T((None, None, None)); t.ell(8, 3.5, 2.2, 1.6, h=-0.4, c=mix(t.C[3, 3], (22, 12, 6), 0.6)); t.ell(8, 3.5, 1, 0.8, h=-0.7, c=(30, 18, 10)); out.append(('knot', t, 2))
    t = T((10, None, 4))
    for ry in range(3):
        for x in (2, 21): t.px(x, ry * 8 + 3, h=0.9, c=(150, 140, 130)); t.px(x + 0, ry * 8 + 4, h=-0.3, dv=-0.3)
    out.append(('nails', t, 3))
    t = T((None, 13, None)); t.set(t.m_noise(0.66, 5.0, 3), c=mix(t.C[3, 3], (30, 20, 14), 0.3)); out.append(('stain', t, 0.8))
    t = T((None, None, 8)); t.crack([(4, 10), (9, 13), (14, 12)], depth=-0.7, k=0.4); t.px(15, 12, h=0.8, c=mix(t.C[3, 3], (230, 200, 160), 0.3)); out.append(('split', t, 1.5))
    t = T((7, 16, 11)); t.rect(0, 8, S, 15, h=0.22); t.rect(0, 15, S, 16, h=-1.0, c=(18, 10, 6)); out.append(('raised', t, 1))
    t = T((12, None, 20)); t.scatter(10, area=(1, 1, 22, 22), c=mix(t.C[3, 3], (230, 210, 170), 0.3), h=0.15); out.append(('scuffed', t, 2))
    if extra: out += extra(T)
    return out


def meadow(base, seed=10, calm=1.0):
    out = []; n = [0]; G = [(56, 96, 46), (74, 120, 56), (96, 146, 66)]

    def T():
        n[0] += 1; t = new(base, seed, n[0], 12, 4); t.H[:] = 0.0; t.mottle(10, 4.0, 9); return t

    def tuft(t, x, y, c=None, h=3):
        c = c or G[(x + y) % 3]
        t.px(x, y, c=c, h=0.5)
        t.px(x, y - 1, c=mix(c, (190, 220, 110), 0.35), h=0.6)
        if h > 2: t.px(x - 1, y - 1, c=c, h=0.5); t.px(x + 1, y - 2, c=mix(c, (190, 220, 110), 0.5), h=0.6)

    def blades(t, k):
        r = np.random.RandomState(seed * 13 + n[0] * 3 + k)
        for _ in range(11 + k): tuft(t, int(r.randint(1, 23)), int(r.randint(3, 23)))

    t = T(); blades(t, 0); out.append(('grass', t, 5))
    t = T(); blades(t, 3); out.append(('grass2', t, 5))
    for nm, cols in (('daisy', (246, 240, 224)), ('buttercup', (242, 200, 90)), ('violet', (176, 150, 230)), ('rose', (240, 160, 190))):
        t = T(); blades(t, 0)
        for x, y in ((6, 8), (15, 15), (19, 6))[: 2 + (nm == 'daisy')]:
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)): t.px(x + dx, y + dy, c=cols, h=0.7)
            t.px(x, y, c=(250, 210, 80) if nm == 'daisy' else (255, 250, 220), h=0.8)
        out.append((nm, t, 1.4))
    t = T(); blades(t, 0)   # trèfle
    for x, y in ((8, 9), (16, 16)):
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)): t.px(x + dx, y + dy, c=(70, 140, 70), h=0.5)
    out.append(('clover', t, 1.5))
    t = T(); blades(t, 0)   # champignons
    for x, y in ((8, 13), (17, 8)):
        t.rect(x, y, x + 1, y + 2, h=0.4, c=(230, 224, 210)); t.ell(x + 0.5, y, 2.2, 1.4, h=0.8, c=(196, 56, 52)); t.px(x, y - 1, c=(250, 240, 230), h=0.9)
    out.append(('mushroom', t, 1))
    t = T(); blades(t, 0); dirt = t.m_ell(12, 13, 7, 4.5) & t.m_noise(0.3, 2.5, 4); t.set(dirt, c=(118, 92, 62), h=-0.2); out.append(('dirt', t, 1.2))
    t = T(); blades(t, 0)   # lucioles
    for x, y in ((6, 9), (17, 14), (12, 5)): t.px(x, y, c=(255, 245, 160), e=(255, 235, 130), ea=0.95, h=0.9); t.px(x + 1, y, e=(255, 235, 130), ea=0.35, c=(255, 245, 160))
    out.append(('fireflies', t, 1))
    t = T(); blades(t, 0); t.ell(7, 8, 2.4, 1.7, h=0.5, c=(150, 146, 136)); t.px(6, 7, c=(200, 196, 186), h=0.7); out.append(('pebble', t, 1.2))
    return out


def gravel(base, seed=11, calm=0.6, ring=False):
    """Gravier ratissé de l'arène : grain fin, quelques cailloux, contraste faible pour que les télégraphes restent lisibles."""
    out = []; n = [0]

    def T():
        n[0] += 1; t = new(base, seed, n[0], 5, 5); t.H[:] = 0.0; return t

    t = T(); t.scatter(26, area=(0, 0, S, S), c=mix(t.C[5, 5], (240, 230, 210), 0.22), h=0.3); t.scatter(18, area=(0, 0, S, S), c=mix(t.C[5, 5], (30, 24, 20), 0.35), h=-0.3); out.append(('fine', t, 5))
    t = T(); t.scatter(22, area=(0, 0, S, S), c=mix(t.C[5, 5], (240, 230, 210), 0.22), h=0.3); t.scatter(14, area=(0, 0, S, S), c=mix(t.C[5, 5], (30, 24, 20), 0.35), h=-0.3)
    t.ell(8, 9, 2.0, 1.5, h=0.5, c=mix(t.C[5, 5], (200, 190, 170), 0.3)); out.append(('stone', t, 2))
    t = T(); t.scatter(20, area=(0, 0, S, S), c=mix(t.C[5, 5], (240, 230, 210), 0.2), h=0.3)
    for k in range(4): t.line([(0, 3 + k * 6), (11, 2 + k * 6), (23, 4 + k * 6)], c=mix(t.C[5, 5], (30, 24, 20), 0.2), h=-0.25)
    out.append(('raked', t, 2))
    return out


# ---------------------------------------------------------------- extras de thème
def ember_extra(T):
    out = []; GL = (255, 140, 60)
    t = T(); m = t.m_ell(12, 12, 9, 6); t.set(m & t.m_noise(0.40, 3, 2), c=mix(t.C[3, 3], (30, 24, 22), 0.55)); out.append(('soot', t, 1.2))
    t = T(); t.crack([(0, 14), (6, 11), (11, 14), (16, 9), (23, 11)], depth=-0.8, k=0.3, wd=2, e=GL, ea=0.95); t.set(t.m_line([(6, 11), (11, 14)]), c=(255, 210, 110), e=(255, 210, 110), ea=1); out.append(('embercrack', t, 2.5))
    t = T(); t.set(t.m_noise(0.5, 3.0, 4), c=(120, 114, 108), h=0.2); t.set(t.m_noise(0.7, 2.0, 6), c=(168, 160, 152), h=0.3); out.append(('ash', t, 2))
    t = T(); t.scatter(5, area=(2, 2, 22, 22), c=(255, 190, 90), e=(255, 160, 60), ea=0.85, h=0.4); t.set(t.m_noise(0.58, 3, 1), c=mix(t.C[3, 3], (10, 8, 8), 0.6)); out.append(('cinders', t, 1.5))
    t = T(); t.ell(12, 12, 6, 4.5, h=-0.4, c=(30, 20, 18)); t.ell(12, 12, 3.5, 2.5, c=(255, 150, 60), e=(255, 140, 50), ea=0.9, h=-0.6); out.append(('hotspot', t, 0.8))
    return out


def mirror_extra(T):
    out = []; WET = (92, 150, 168)
    t = T(); t.set(t.m_noise(0.35, 3.0, 5), c=mix(t.C[3, 3], WET, 0.4), dv=-0.05); t.set(t.m_ell(8, 8, 3, 1.2), c=(220, 245, 252)); out.append(('wet', t, 3))
    t = T()
    for rr, al in ((8, .5), (5, .8), (2, 1.0)):
        a = np.linspace(0, 6.28, 40); pts = [(12 + np.cos(q) * rr, 12 + np.sin(q) * rr * 0.55) for q in a]
        t.line(pts, c=(190, 240, 255), e=(130, 225, 255), ea=0.35 * al, h=-0.15)
    out.append(('ripples', t, 1.8))
    t = T(); t.crack([(4, 8), (11, 12), (14, 9), (21, 16)], depth=-0.4, k=0.8, e=(127, 230, 255), ea=0.9); out.append(('waterveins', t, 1.5))
    t = T(); r = np.random.RandomState(5)
    for _ in range(3):
        x, y = int(r.randint(3, 20)), int(r.randint(3, 20)); t.ell(x, y, 2.2, 1.3, c=(250, 190, 212), h=0.4, e=(255, 170, 205), ea=0.3); t.px(x, y, c=(255, 225, 235), h=0.6)
    out.append(('petals', t, 2))
    t = T(); t.ell(7, 17, 5, 2.5, c=(52, 120, 104), h=0.1); t.set(t.m_line([(4, 16), (10, 16)]), c=(140, 220, 170)); out.append(('algae', t, 1.5))
    t = T(); t.scatter(5, area=(2, 2, 22, 22), c=(225, 248, 255), e=(170, 235, 250), ea=0.8, h=0.4); out.append(('dew', t, 1.5))
    return out


def storm_extra(T):
    out = []; ABY = (70, 200, 230)
    t = T(); t.ell(6, 17, 7, 3, c=(30, 96, 84), h=0.1)
    for i in range(4): t.line([(3 + i * 5, 17), (3 + i * 5 + (i % 2 * 2 - 1), 11)], c=(80, 170, 130), h=0.5)
    out.append(('seaweed', t, 2.5))
    t = T()
    for n_, (x, y) in enumerate(((7, 14), (10, 11), (13, 14), (16, 10))): t.rect(x, y - 2 - n_ % 3, x + 2, y + 2, c=(220, 120, 110) if n_ % 2 else (240, 170, 140), h=0.6)
    out.append(('coral', t, 1.5))
    t = T(); t.line([(4, 12), (12, 12), (12, 6)], c=ABY, e=ABY, ea=0.55, h=-0.3); t.line([(12, 12), (20, 18)], c=ABY, e=ABY, ea=0.55, h=-0.3); t.px(4, 12, e=(230, 255, 255), ea=1, c=ABY)
    out.append(('glyph', t, 1.5))
    t = T(); t.scatter(9, area=(2, 2, 22, 22), c=(212, 228, 220), h=0.6)
    out.append(('barnacles', t, 2))
    t = T(); t.set(t.m_noise(0.4, 3, 3), c=mix(t.C[3, 3], (10, 40, 60), 0.5), dv=-0.05); out.append(('drenched', t, 2.5))
    return out
