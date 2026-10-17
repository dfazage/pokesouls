"""Familles de sol A : labo, centrale, glace, lave, roche, mousse. Chaque famille renvoie [(nom, Tile, poids)]."""
import numpy as np
from tilekit import Tile, Look, hexrgb, mix

S = 24


def jit(base, i, amt=7):
    r = np.random.RandomState(i * 7 + 3); b = np.array(hexrgb(base)); return tuple(np.clip(b + (r.rand(3) - 0.5) * amt, 0, 255))


def new(base, seed, i, mott=5, grain=3):
    t = Tile(S, S, seed=seed * 131 + i, base=jit(base, seed * 131 + i)); t.mottle(mott, 6.0, 1); t.grain(grain, 2); return t


def frame(t, k=0.5, w=1):
    """Interstice de la tuile : joint sombre en bas et à droite ; la lèvre claire en haut/gauche vient du voisin (rendu périodique)."""
    t.gap(S - w, 0, S, S, k=k); t.gap(0, S - w, S, S, k=k)


def rivet(t, x, y, k=1.4):
    for dx in (0, 1):
        for dy in (0, 1): t.px(x + dx, y + dy, h=0.75)
    m = t.m_rect(x, y, x + 2, y + 2); t.C[m] = np.clip(t.C[m] * k + 8, 0, 255)


def screw(t, x, y):
    t.px(x, y, h=-0.3, dv=-0.25); t.px(x + 1, y, h=0.3); t.px(x, y + 1, h=0.3)


def hazard(t, x0, y0, x1, y1, a='#e8c020', b='#1c1810', step=4):
    m = t.m_rect(x0, y0, x1, y1)
    st = ((t.X + t.Y) // step) % 2 == 0
    t.set(m & st, c=a, h=0.15); t.set(m & ~st, c=b, h=0.1)


def circle_ring(t, cx, cy, r, h_in=-0.5):
    t.ell(cx, cy, r, r, h=h_in)


# ======================================================== LABO
def lab(base, accent, seed=1, calm=1.0, acc2=None):
    out = []; ac = accent; n = [0]

    def T(w, **k):
        n[0] += 1; t = new(base, seed, n[0], **k); return t

    # plaques
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2)
    for x, y in ((2, 2), (19, 2), (2, 19), (19, 19)): rivet(t, x, y)
    out.append(('plain', t, 5))
    t = T(1); frame(t); t.plate(0, 0, 23, 11, 0, 0.2); t.plate(0, 12, 23, 23, 0.04, 0.2)
    for x, y in ((2, 2), (19, 2)): rivet(t, x, y)
    for x, y in ((2, 15), (19, 15)): rivet(t, x, y)
    t.line([(5, 7), (16, 8)], c=mix(t.C[5, 5], (200, 210, 235), 0.25), h=0.05)
    out.append(('twin', t, 4))
    t = T(1); frame(t)
    for x0, y0, x1, y1, hh in ((0, 0, 11, 11, 0), (12, 0, 23, 11, 0.05), (0, 12, 11, 23, 0.03), (12, 12, 23, 23, 0))[:4]: t.plate(x0, y0, x1, y1, hh, 0.2)
    for x, y in ((4, 4), (16, 4), (4, 16), (16, 16)): screw(t, x, y)
    out.append(('quad', t, 4))
    # grille de ventilation : cuvette sombre, ailettes éclairées
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); t.rect(4, 4, 19, 19, h=-0.55, c=mix(t.C[5, 5], (10, 12, 24), 0.6))
    for yy in range(5, 18, 3): t.rect(5, yy, 18, yy + 1, h=0.05, c=mix(t.C[5, 5], (170, 180, 205), 0.15)); t.rect(5, yy + 1, 18, yy + 2, h=-0.9, c=(8, 10, 20))
    for x, y in ((2, 2), (19, 2), (2, 19), (19, 19)): rivet(t, x, y)
    out.append(('vent', t, 2))
    # trappe avec poignée et charnières
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); t.gap(4, 4, 19, 5, -0.9); t.gap(4, 18, 19, 19, -0.9); t.gap(4, 4, 5, 19, -0.9); t.gap(18, 4, 19, 19, -0.9)
    t.rect(5, 5, 18, 18, h=0.18, c=mix(t.C[5, 5], (140, 150, 180), 0.12)); t.rect(8, 10, 15, 12, h=0.7, c=(150, 160, 190)); t.rect(8, 12, 15, 13, h=-0.4, c=(10, 12, 22))
    t.px(6, 6, h=0.7); t.px(17, 6, h=0.7); t.px(6, 17, h=0.7); t.px(17, 17, h=0.7)
    out.append(('hatch', t, 2))
    # dalle fissurée : un éclat laisse voir le dessous
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2)
    t.crack([(23, 6), (16, 9), (13, 14), (8, 15), (4, 21)], depth=-0.8, k=0.35); t.crack([(13, 14), (15, 20)], depth=-0.6, k=0.4)
    t.poly([(14, 15), (18, 14), (19, 19), (15, 20)], h=-0.45, c=mix(t.C[5, 5], (10, 12, 22), 0.55))
    t.scatter(5, area=(6, 10, 20, 22), h=0.5, c=(120, 128, 156))
    out.append(('crack', t, 2))
    # bordure de sécurité jaune-noir
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); hazard(t, 0, 18, 23, 22, step=4)
    t.rect(0, 17, 23, 18, h=0.3); t.rect(0, 22, 23, 23, h=0.0)
    for x in (2, 19): rivet(t, x, 3)
    out.append(('hazard', t, 1.5))
    # flaque de liquide de refroidissement (reflet turquoise)
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2)
    pud = t.m_ell(12, 13, 8, 5); t.set(pud, h=-0.25, c=mix(t.C[5, 5], (40, 150, 150), 0.55))
    t.set(t.m_ell(10, 12, 3, 1.4), c=(190, 245, 240), h=-0.15); t.set(pud, e=ac, ea=0.16)
    t.line([(20, 4), (20, 8)], c=mix(t.C[5, 5], (40, 150, 150), 0.5), h=-0.2)
    out.append(('coolant', t, 1.5))
    # prise murale : socle rond, trois contacts
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); t.ell(12, 12, 6, 6, h=-0.4, c=mix(t.C[5, 5], (10, 12, 22), 0.5)); t.ell(12, 12, 4, 4, h=0.15, c=mix(t.C[5, 5], (120, 130, 160), 0.2))
    for dx, dy in ((-2, 0), (2, 0), (0, 2)): t.px(12 + dx, 11 + dy, h=0.8, c=(210, 190, 90))
    out.append(('port', t, 1.5))
    # trace de circuit lumineuse : pistes et puces
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2)
    for x, y in ((2, 2), (19, 2), (2, 19), (19, 19)): rivet(t, x, y)
    t.rect(8, 8, 15, 13, h=0.5, c=(18, 20, 34)); t.rect(8, 8, 15, 9, h=0.7, c=(40, 44, 66))
    for xx in (9, 11, 13): t.px(xx, 13, h=0.6, c=(170, 170, 190)); t.px(xx, 7, h=0.6, c=(170, 170, 190))
    for pts in ([(3, 10), (8, 10)], [(15, 10), (20, 10), (20, 16)], [(11, 14), (11, 19), (4, 19)]):
        m = t.m_line(pts); t.set(m, h=0.2, c=mix(ac, (255, 255, 255), 0.1), e=ac, ea=0.95)
    for x, y in ((3, 10), (20, 16), (4, 19)): t.ell(x + 0.5, y + 0.5, 1.5, 1.5, e=(235, 255, 250), ea=1, c=ac, h=0.5)
    out.append(('trace', t, 3.0))
    # voyants au sol
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2)
    for x, y in ((3, 3), (17, 3), (3, 17), (17, 17)):
        t.rect(x, y, x + 4, y + 4, h=-0.3, c=(14, 16, 28)); t.rect(x + 1, y + 1, x + 3, y + 3, h=0.3, c=ac, e=ac, ea=0.9)
    t.line([(7, 5), (17, 5)], c=(16, 18, 32), h=-0.5)
    out.append(('lights', t, 1.2))
    # siphon rond
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); t.ell(12, 12, 7, 7, h=-0.35, c=mix(t.C[5, 5], (10, 12, 22), 0.5)); t.ell(12, 12, 6, 6, h=-0.9, c=(8, 10, 18))
    for a in range(0, 360, 45):
        ar = np.radians(a); t.line([(12 + np.cos(ar) * 1.5, 12 + np.sin(ar) * 1.5), (12 + np.cos(ar) * 6, 12 + np.sin(ar) * 6)], h=0.2, c=(120, 130, 160))
    t.ell(12, 12, 1.5, 1.5, h=0.4, c=(150, 160, 190))
    out.append(('drain', t, 1.2))
    # brûlure et suie
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); bm = t.m_ell(11, 13, 8, 6); t.set(bm, c=(12, 12, 20), dv=-0.1)
    for a in (-0.6, 0.1, 0.9, 1.7, 2.5): t.line([(11, 13), (11 + np.cos(a) * 11, 13 + np.sin(a) * 9)], c=(20, 20, 32))
    t.scatter(4, area=(6, 8, 18, 18), c=(255, 190, 80), e=(255, 170, 70), ea=0.8)
    out.append(('burn', t, 1.0))
    # stencil : numéro de secteur
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2)
    lc = mix(t.C[5, 5], (200, 210, 235), 0.4)
    for (xa, ya, xb, yb) in ((5, 6, 5, 16), (5, 6, 9, 6), (9, 6, 9, 11), (9, 11, 5, 11), (13, 6, 17, 6), (17, 6, 17, 16), (17, 16, 13, 16), (13, 16, 13, 6)): t.line([(xa, ya), (xb, yb)], c=lc, h=0.02)
    t.line([(4, 19), (19, 19)], c=lc, h=0.02)
    out.append(('stencil', t, 1.0))
    # dalle arrachée : sous-plancher, tuyaux et câbles
    t = T(1); frame(t); t.plate(0, 0, 23, 23, 0, 0.2); t.rect(3, 3, 20, 20, h=-1.0, c=(14, 16, 28))
    t.rect(4, 5, 19, 8, h=-0.55, c=(66, 74, 100)); t.rect(4, 5, 19, 6, h=-0.45, c=(120, 130, 160))
    t.line([(4, 13), (12, 13), (12, 18), (19, 18)], wd=2, h=-0.65, c=(150, 70, 60)); t.line([(5, 16), (10, 16)], h=-0.7, c=(60, 90, 170))
    t.scatter(3, area=(5, 9, 19, 19), h=-0.55, c=(220, 200, 90), e=(255, 220, 90), ea=0.5)
    out.append(('opened', t, 0.8))
    return out


# ======================================================== CENTRALE
def plant(base, accent, seed=2, calm=1.0, acc2=None):
    out = []; ac = accent; n = [0]

    def T():
        n[0] += 1; return new(base, seed, n[0], 6, 4)

    # tôle larmée : losanges alternés
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18)
    for ry in range(2, 22, 5):
        for rx in range(2, 22, 6):
            ox = rx + (3 if (ry // 5) % 2 else 0)
            if ox + 3 < 22: t.line([(ox, ry + 2), (ox + 3, ry)], wd=1, h=0.55, c=mix(t.C[5, 5], (200, 200, 215), 0.2))
    out.append(('tread', t, 5))
    # caillebotis : barres éclairées, trous noirs
    t = T(); frame(t); t.rect(0, 0, 23, 23, h=-0.6, c=(10, 10, 16))
    for yy in range(1, 22, 3): t.rect(0, yy, 23, yy + 1, h=0.2, c=mix(t.C[5, 5], (140, 140, 160), 0.1))
    for xx in range(1, 22, 6): t.rect(xx, 0, xx + 1, 23, h=0.35, c=mix(t.C[5, 5], (150, 150, 170), 0.15))
    out.append(('grate', t, 2.5))
    # bordure de sécurité
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18); hazard(t, 0, 0, 23, 4); hazard(t, 0, 19, 23, 22)
    t.rect(0, 4, 23, 5, h=0.3); t.rect(0, 18, 23, 19, h=0.3)
    out.append(('hazard', t, 2))
    # flaque d'huile irisée
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18)
    oil = t.m_ell(12, 13, 8, 5.5) | t.m_ell(8, 11, 4.5, 3.5); t.set(oil, h=-0.3, c=(14, 14, 20))
    t.set(t.m_ell(14, 12, 3, 1.3), c=(100, 90, 150), h=-0.2); t.set(t.m_ell(9, 14, 2, 1), c=(60, 120, 110), h=-0.2); t.px(16, 11, c=(220, 215, 240), h=-0.1)
    out.append(('oil', t, 1.8))
    # plaque d'égout
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18); t.ell(12, 12, 9, 9, h=-0.4, c=mix(t.C[5, 5], (10, 10, 18), 0.45)); t.ell(12, 12, 8, 8, h=0.12, c=mix(t.C[5, 5], (140, 140, 160), 0.1))
    t.line([(4, 12), (20, 12)], h=0.55, c=(130, 130, 150)); t.line([(12, 4), (12, 20)], h=0.55, c=(130, 130, 150))
    for a in range(0, 360, 60):
        ar = np.radians(a); t.px(12 + int(np.cos(ar) * 6.5), 12 + int(np.sin(ar) * 6.5), h=0.9, c=(190, 190, 205))
    out.append(('manhole', t, 1.5))
    # gaine de câbles : couvercle bombé jaune
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18); t.rect(0, 8, 23, 16, h=0.45, c=mix(t.C[5, 5], (180, 150, 40), 0.25))
    t.rect(0, 8, 23, 9, h=0.7); t.rect(0, 15, 23, 16, h=-0.2, dv=-0.1)
    for x in (3, 11, 19): rivet(t, x, 11)
    hazard(t, 0, 16, 23, 18, step=3)
    out.append(('conduit', t, 1.5))
    # étincelles et points de soudure
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18); t.set(t.m_ell(11, 12, 6, 4), c=(20, 18, 24), dv=-0.1)
    t.line([(11, 12), (4, 8)], c=(30, 24, 22)); t.line([(11, 12), (19, 17)], c=(30, 24, 22))
    for p in ((11, 12), (7, 10), (15, 14), (17, 9)): t.px(p[0], p[1], c=(255, 230, 120), e=ac, ea=0.9, h=0.3)
    out.append(('sparks', t, 1.2))
    # plaque rouillée
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18); rm = t.m_noise(0.56, 3.5, 5)
    t.set(rm, c=(150, 84, 48)); t.set(t.m_noise(0.7, 2.5, 6) & rm, c=(190, 110, 56)); t.rect(0, 0, 0, 0)
    for x, y in ((2, 2), (19, 19)): rivet(t, x, y)
    out.append(('rust', t, 2))
    # piste lumineuse ambre
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18)
    for pts in ([(0, 12), (7, 12), (7, 6), (17, 6)], [(12, 12), (12, 20), (23, 20)]):
        m = t.m_line(pts); t.set(m, h=0.15, c=mix(ac, (255, 255, 255), 0.1), e=ac, ea=0.9)
    for x, y in ((17, 6), (12, 12)): t.ell(x + 0.5, y + 0.5, 1.6, 1.6, c=ac, e=(255, 250, 220), ea=1, h=0.5)
    out.append(('trace', t, 2.5))
    # petite flaque d'eau
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18); p = t.m_ell(12, 13, 7, 4); t.set(p, h=-0.2, c=mix(t.C[5, 5], (70, 100, 150), 0.5)); t.set(t.m_ell(10, 12, 3, 1), c=(190, 215, 240), h=-0.1)
    out.append(('puddle', t, 1.2))
    t = T(); frame(t); t.plate(0, 0, 23, 23, 0, 0.18)
    for x, y in ((2, 2), (19, 2), (2, 19), (19, 19)): rivet(t, x, y)
    t.line([(3, 9), (20, 10)], h=0.05, c=mix(t.C[5, 5], (200, 200, 215), 0.2)); t.line([(5, 14), (17, 13)], h=0.05, c=mix(t.C[5, 5], (200, 200, 215), 0.15))
    out.append(('plain', t, 4))
    return out


# ======================================================== GLACE
def ice(base, accent, seed=3, calm=1.0, acc2=None):
    out = []; ac = accent; n = [0]
    white = (232, 246, 255)

    def T():
        n[0] += 1; t = new(base, seed, n[0], 8, 3); t.C += 0; return t

    def seam(t):   # joint regelé : une ligne claire (givre), pas un trou
        t.rect(S - 1, 0, S, S, h=-0.25, c=mix(t.C[5, 5], white, 0.45)); t.rect(0, S - 1, S, S, h=-0.25, c=mix(t.C[5, 5], white, 0.45))

    t = T(); seam(t); t.scatter(10, area=(1, 1, 22, 22), c=mix(t.C[5, 5], white, 0.5), h=0.1)
    out.append(('plain', t, 5))
    t = T(); seam(t)
    for pts in ([(2, 3), (8, 9), (7, 15), (15, 20)], [(8, 9), (17, 7), (21, 12)], [(7, 15), (3, 20)]):
        t.crack(pts, depth=-0.45, k=1.0); m = t.m_line(pts); t.C[m] = mix(t.C[m], white, 0.55)
    out.append(('cracks', t, 3))
    t = T(); seam(t)
    for cx, cy, r in ((6, 6, 3), (16, 8, 2), (11, 16, 4), (19, 18, 2)):
        t.ell(cx, cy, r, r, h=-0.25, c=mix(t.C[5, 5], (190, 230, 250), 0.35)); t.ell(cx, cy, r - 1, r - 1, h=0.1); t.px(cx - 1, cy - 1, c=white)
    out.append(('bubbles', t, 2.5))
    t = T(); seam(t)
    for k, off in enumerate((-6, 0, 6)):
        t.line([(2 + off, 22), (14 + off, 2)], wd=1 if k != 1 else 2, c=mix(t.C[5, 5], white, 0.5 - k * 0.1), h=0.15)
    out.append(('gleam', t, 2.5))
    t = T(); seam(t); sn = t.m_ell(10, 12, 8, 5.5) | t.m_ell(16, 15, 5, 4)
    t.set(sn, c=mix(t.C[5, 5], white, 0.8), h=0.35); t.set(t.m_ell(8, 9, 3, 1.5) & sn, c=(255, 255, 255), h=0.45)
    out.append(('snow', t, 2))
    t = T(); seam(t)
    t.crack([(0, 5), (8, 9), (12, 13), (16, 20), (18, 23)], depth=-0.9, k=0.45, wd=2, e=ac, ea=0.35)
    t.crack([(12, 13), (22, 11)], depth=-0.8, k=0.5, e=ac, ea=0.3)
    out.append(('deepcrack', t, 1.5))
    t = T(); seam(t)   # cristaux de givre en fougère
    for ox, oy, d in ((3, 4, 1), (20, 20, -1)):
        for br in range(4):
            x = ox + d * br * 2; y = oy + d * br * 2
            t.px(x, y, c=white, h=0.3); t.px(x + d, y - d, c=white, h=0.2); t.px(x - d, y + d, c=white, h=0.2)
    out.append(('frost', t, 1.5))
    t = T(); seam(t); dk = t.m_noise(0.5, 4.0, 3); t.set(dk, c=mix(t.C[5, 5], (20, 50, 100), 0.5), h=-0.35); t.set(t.m_noise(0.74, 2.0, 7) & dk, c=(70, 80, 110))
    out.append(('dark', t, 1.5))
    t = T(); seam(t); t.ell(12, 12, 6, 5, h=-0.3, c=mix(t.C[5, 5], (20, 60, 120), 0.5))
    for a in range(0, 360, 50): ar = np.radians(a); t.px(12 + int(np.cos(ar) * 3), 12 + int(np.sin(ar) * 2.5), c=(150, 220, 255), e=ac, ea=0.5)
    t.px(12, 12, c=(255, 255, 255), e=(220, 250, 255), ea=1)
    out.append(('hole', t, 0.8))
    return out


# ======================================================== LAVE
def lava(base, accent, seed=4, calm=1.0, acc2=(255, 200, 90)):
    out = []; ac = accent; n = [0]; hot = acc2

    def T():
        n[0] += 1; return new(base, seed, n[0], 8, 4)

    def magma(t, m, k=1.0):
        t.set(m, c=ac, e=ac, ea=0.9 * k, h=-0.5); core = m & t.m_noise(0.42, 2.0, 11); t.set(core, c=hot, e=hot, ea=0.95 * k)

    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2); t.scatter(8, area=(2, 2, 21, 21), c=mix(t.C[5, 5], (120, 70, 60), 0.4), h=0.25)
    out.append(('plain', t, 5))
    # joint de lave incandescent à droite et en bas
    t = T(); t.plate(0, 0, 22, 22, 0, 0.3)
    m1 = t.m_rect(22, 0, 24, 24); m2 = t.m_rect(0, 22, 24, 24); t.set(m1 | m2, h=-0.9); t.C[m1 | m2] = (40, 14, 10)
    mg = t.m_rect(22, 0, 23, 24) | t.m_rect(0, 22, 24, 23); magma(t, mg & t.m_noise(0.30, 2.2, 5)); magma(t, mg)
    out.append(('seam', t, 2.5))
    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2)
    cr = t.crack([(0, 14), (6, 11), (11, 13), (16, 8), (23, 9)], depth=-0.8, k=0.4, wd=2, e=ac, ea=0.95)
    t.crack([(11, 13), (13, 19), (20, 22)], depth=-0.7, k=0.4, e=ac, ea=0.85)
    t.set(t.m_line([(6, 11), (11, 13)]), c=hot, e=hot, ea=1)
    out.append(('crack', t, 3))
    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2)   # cratère
    t.ell(12, 12, 6, 5, h=-0.4, c=(34, 18, 16)); t.ell(12, 12, 4, 3, h=-0.7, c=ac, e=ac, ea=0.9); t.ell(12, 12, 2, 1.5, c=hot, e=hot, ea=1)
    for a in (0.3, 1.8, 3.4, 5.0): t.px(12 + int(np.cos(a) * 7), 12 + int(np.sin(a) * 5.5), h=0.5, c=(110, 70, 60))
    out.append(('pit', t, 1.5))
    t = T(); frame(t, 0.4)   # croûte cordée
    for k in range(6):
        y0 = 2 + k * 4; pts = [(0, y0 + 1), (6, y0 - 1), (12, y0 + 1), (18, y0 - 1), (23, y0 + 1)]
        t.line(pts, wd=2, h=0.25, c=mix(t.C[5, 5], (150, 90, 70), 0.3)); t.line([(p[0], p[1] + 2) for p in pts], h=-0.5, c=(30, 14, 12))
    t.scatter(4, area=(1, 1, 22, 22), c=ac, e=ac, ea=0.7)
    out.append(('rope', t, 2.5))
    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2); t.set(t.m_noise(0.5, 3.0, 2), c=(112, 100, 96), h=0.2); t.set(t.m_noise(0.7, 2.0, 3), c=(150, 140, 134), h=0.3)
    out.append(('ash', t, 2.5))
    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2); t.scatter(10, area=(2, 2, 21, 21), c=(255, 230, 190), h=0.4)
    t.poly([(6, 14), (9, 8), (12, 14)], h=0.7, c=(40, 30, 50)); t.poly([(14, 17), (16, 11), (19, 17)], h=0.8, c=(36, 26, 44)); t.line([(9, 8), (9, 13)], c=(120, 100, 130))
    out.append(('obsidian', t, 1.8))
    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2); pool = t.m_ell(12, 13, 7, 4.5)
    t.set(t.m_ell(12, 13, 8, 5.5), h=-0.3, c=(36, 18, 14)); magma(t, pool); t.set(t.m_ell(10, 12, 2, 1), c=(255, 245, 190), e=(255, 245, 190), ea=1)
    out.append(('pool', t, 1))
    t = T(); frame(t, 0.4); t.plate(0, 0, 23, 23, 0, 0.2)
    for x, y, r in ((6, 7, 2.2), (15, 6, 1.6), (10, 16, 3), (19, 17, 1.8)): t.ell(x, y, r, r * 0.8, h=0.55, c=mix(t.C[5, 5], (130, 90, 80), 0.3)); t.px(int(x - 1), int(y - 1), c=(190, 150, 130))
    out.append(('rubble', t, 2))
    return out


# ======================================================== ROCHE
def rock(base, accent, seed=5, calm=1.0, acc2=None):
    out = []; ac = accent; n = [0]

    def T():
        n[0] += 1; return new(base, seed, n[0], 7, 4)

    # dalles irrégulières : joints en polygone
    def slabs(t, polys):
        for pg in polys: t.poly(pg, h=0.0)
        m = np.zeros((S, S), bool)
        for pg in polys: m |= t.m_poly(pg)
        t.set(~m, h=-1.0); t.C[~m] *= 0.5
        for pg in polys:   # lèvre : pente intérieure
            im = t.m_poly(pg); inner = t.m_noise(2.0, 1) | np.zeros_like(im)
        return m

    t = T(); t.rect(0, 0, 24, 24, h=-1, k=None) if False else None
    t.H[:] = -1.0; t.C *= 0.55
    for pg in ([(0, 0), (11, 0), (12, 10), (0, 11)], [(13, 0), (22, 0), (23, 12), (14, 11)], [(0, 13), (13, 12), (11, 22), (0, 22)], [(15, 13), (23, 14), (23, 22), (13, 22)]):
        t.rect(0, 0, 0, 0); m = t.m_poly(pg); t.H[m] = 0.1; t.C[m] = new(base, seed, n[0] + 50, 7, 4).C[m]
    t.plate_like = True
    out.append(('flags', t, 4))
    t = T(); t.H[:] = -1.0; t.C *= 0.55
    for pg in ([(0, 0), (23, 0), (23, 9), (0, 10)], [(0, 12), (14, 11), (13, 22), (0, 22)], [(16, 11), (23, 11), (23, 22), (15, 22)]):
        m = t.m_poly(pg); t.H[m] = 0.1; t.C[m] = new(base, seed, n[0] + 70, 7, 4).C[m]
    for yy in (3, 6): t.line([(0, yy), (23, yy)], h=0.0, c=mix(t.C[2, 2], (30, 24, 20), 0.35))
    out.append(('strata', t, 3))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2)
    t.crack([(23, 5), (15, 10), (11, 15), (5, 17), (0, 23)], depth=-0.8, k=0.4); t.crack([(11, 15), (14, 23)], depth=-0.6, k=0.45)
    out.append(('crack', t, 2.5))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2)   # cailloux
    for x, y, r in ((5, 6, 2.5), (15, 5, 2), (9, 14, 3), (19, 16, 2.4), (4, 19, 1.8), (14, 20, 1.6)):
        t.ell(x + 1, y + 1, r + 0.4, r * 0.7, h=-0.3, c=mix(t.C[5, 5], (10, 8, 8), 0.5)); t.ell(x, y, r, r * 0.8, h=0.7, c=mix(t.C[5, 5], (150, 130, 110), 0.3))
    out.append(('pebbles', t, 3))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2)   # sable
    for k in range(5):
        y0 = 3 + k * 4; t.line([(0, y0 + 1), (7, y0), (15, y0 + 1), (23, y0)], h=0.2, c=mix(t.C[5, 5], (200, 170, 110), 0.35))
    out.append(('sand', t, 2.5))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2)   # fossile
    for k in range(1, 6):
        r = k * 1.5; a0 = k * 0.5
        t.line([(12 + np.cos(a) * r, 12 + np.sin(a) * r * 0.9) for a in np.linspace(a0, a0 + 5.2, 14)], h=0.1 + 0.05 * (k % 2), c=mix(t.C[5, 5], (200, 180, 150), 0.25 if k % 2 else 0.0))
    out.append(('fossil', t, 0.8))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2); t.scatter(14, area=(1, 1, 22, 22), c=(180, 160, 130), h=0.3); t.scatter(8, area=(1, 1, 22, 22), c=(30, 24, 22), h=-0.3)
    out.append(('gravel', t, 3))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2); t.scatter(5, area=(2, 2, 21, 21), c=ac, e=ac, ea=0.45, h=0.5)
    for x, y in ((6, 8), (15, 14)): t.px(x, y, c=(255, 230, 160), e=(255, 220, 140), ea=0.8)
    out.append(('glints', t, 1.2))
    t = T(); frame(t, 0.55); t.plate(0, 0, 23, 23, 0, 0.2)   # griffures
    for x in (6, 8, 10): t.line([(x, 6), (x + 5, 19)], c=mix(t.C[5, 5], (200, 180, 150), 0.3), h=-0.2)
    out.append(('claws', t, 0.8))
    return out


# ======================================================== MOUSSE (mystic)
def moss(base, accent, seed=6, calm=1.0, acc2=(160, 255, 220)):
    out = []; ac = accent; n = [0]; GR = (60, 120, 64); GL = (96, 170, 90)

    def T():
        n[0] += 1; return new(base, seed, n[0], 7, 3)

    def cobbles(t, bumps):
        t.H[:] = -0.9; t.C *= 0.6
        for cx, cy, rx, ry in bumps:
            m = t.m_ell(cx, cy, rx, ry); t.H[m] = 0.2; t.C[m] = new(base, seed, n[0] + int(cx * 3 + cy), 6, 3).C[m]
            t.ell(cx, cy, rx - 1, ry - 1, h=0.45)

    CB = [(6, 6, 6, 5.5), (17, 5, 6, 5), (6, 17, 6, 6), (17, 16, 6.2, 6), (12, 11.5, 3.5, 3)]
    t = T(); cobbles(t, CB); out.append(('cobble', t, 4))
    t = T(); cobbles(t, CB)
    for x, y in ((12, 0), (0, 12), (12, 23), (23, 12), (12, 12)): t.ell(x, y, 3, 2.5, c=GR, h=-0.3)
    t.scatter(10, area=(1, 1, 22, 22), c=GL, h=0.2)
    out.append(('mossy', t, 4))
    t = T(); cobbles(t, CB); mm = t.m_noise(0.5, 4.0, 4); t.set(mm, c=GR, h=0.5); t.set(t.m_noise(0.72, 2.0, 8) & mm, c=GL, h=0.7)
    out.append(('mosspatch', t, 2.5))
    t = T(); cobbles(t, CB)   # racines
    t.line([(0, 8), (8, 11), (15, 9), (23, 14)], wd=2, h=0.6, c=(70, 52, 40)); t.line([(8, 11), (10, 20)], h=0.5, c=(66, 48, 36)); t.line([(0, 8), (8, 11), (15, 9), (23, 14)], h=0.8, c=(110, 84, 60))
    out.append(('roots', t, 2))
    t = T(); cobbles(t, CB)   # champignons lumineux
    for x, y, s in ((7, 14, 3), (13, 17, 2), (16, 11, 2)):
        t.rect(x, y, x + 1, y + 3, h=0.3, c=(220, 200, 210)); t.ell(x + 0.5, y, s, s * 0.7, h=0.6, c=mix(ac, (255, 255, 255), 0.1), e=ac, ea=0.55); t.px(x, y - 1, c=(255, 255, 255), e=(255, 235, 250), ea=1)
    out.append(('shrooms', t, 1.8))
    t = T(); cobbles(t, CB)   # fleurs
    for x, y, c in ((5, 7, (250, 240, 200)), (16, 6, (250, 190, 230)), (9, 17, (200, 230, 255)), (18, 17, (250, 240, 200))):
        t.px(x, y, c=c, h=0.5); t.px(x - 1, y, c=c, h=0.4); t.px(x + 1, y, c=c, h=0.4); t.px(x, y - 1, c=c, h=0.4); t.px(x, y + 1, c=c, h=0.4); t.px(x, y, c=(255, 220, 80), h=0.6)
    out.append(('flowers', t, 1.5))
    t = T(); cobbles(t, CB)   # rune gravée
    g = acc2
    for pts in ([(12, 4), (12, 19)], [(8, 8), (12, 12), (16, 8)], [(8, 16), (12, 12), (16, 16)]): t.line(pts, c=g, e=g, ea=0.85, h=-0.4)
    out.append(('rune', t, 1.0))
    t = T(); cobbles(t, CB); p = t.m_ell(12, 13, 7, 4); t.set(p, h=-0.2, c=mix(t.C[5, 5], (50, 130, 130), 0.5)); t.set(t.m_ell(10, 12, 3, 1), c=(190, 240, 240))
    out.append(('dew', t, 1.2))
    return out
