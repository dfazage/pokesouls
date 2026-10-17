"""Props de feu et de pierre : braseros, rochers, cristaux, piliers."""
import math
import numpy as np
import engine
from engine import Canvas, Mat, hexrgb, mix
from recipes_edo import flame_rows


def rock_blob(c, cx, cy, rx, ry, mat, rs, rough=0.35, facet=0.9):
    """Rocher à facettes : contour irrégulier (bruit en angle) et normales perturbées par le gradient d'un bruit."""
    nz = c.noise(4.0, int(rs.randint(1, 999))); gy, gx = np.gradient(nz)
    ang = np.arctan2(c.Y - cy, c.X - cx); wob = 1 + rough * 0.5 * (np.sin(ang * 3 + rs.uniform(0, 6)) * 0.5 + np.sin(ang * 5 + rs.uniform(0, 6)) * 0.3)
    u = (c.X - cx) / (rx * wob); v = (c.Y - cy) / (ry * wob); r2 = u * u + v * v; mask = r2 <= 1
    n = np.stack([u + gx * facet * 6, v + gy * facet * 6, np.sqrt(np.clip(1 - r2, 0, 1)) + 0.15], -1)
    return c.put(mask, n, mat)


def brazier(pal='lava', t=0.0, seed=1):
    c = Canvas(34, 46, seed); cx = 17
    col = {'lava': ('#3f3330', '#6a4a40'), 'stone': ('#8a7a68', '#a89a86'), 'ember': ('#2f2826', '#554640')}[pal]
    iron = Mat(col[0], 5, grain=0.06, dither=0.15); iron_l = Mat(col[1], 5, grain=0.06)
    coal = Mat('#ff6a1a', 4, emissive=True, ramp=['#3a1208', '#8a2a10', '#e8501a', '#ffb050'])
    # trépied
    for sx in (-1, 1): c.line((cx + sx * 3, 31), (cx + sx * 9, 44), 2.4, iron, taper=0.8)
    c.line((cx, 31), (cx, 44), 2.4, iron)
    c.cylinder(cx, 41, 43, 9, iron, cap=False, r_bot=9.2, cap_ry=2)
    # cuvette
    c.cylinder(cx, 24, 33, 11, iron_l, cap=iron, cap_ry=4.2, r_bot=6.5)
    c.ellipsoid(cx, 24.2, 9.4, 3.3 * engine.TILT, coal, emit=0.45 + 0.1 * math.sin(2 * math.pi * t))
    c.rect(cx - 11, 23.4, cx + 11, 25.2, iron_l); c.mat[(c.Y < 24.2) & (c.mat == c.mid(iron_l)) & (np.abs(c.X - cx) < 9)] = c.mid(coal)
    for y in (27.5, 30.5): c.rect(cx - 10, y, cx + 10, y + 0.9, iron, (0, 0, 1))
    # braises (points qui scintillent) et flammes
    for k, (x, y) in enumerate(((cx - 6, 23), (cx - 2, 24.5), (cx + 3, 23), (cx + 6, 24.3))): c.pix(x, y, '#ffd070' if int(t * 4 + k) % 2 else '#ff8a2a')
    ramp = ('#fff3b8', '#ffb84a', '#e8501a')
    for dx, h_, w_, ph in ((-5, 9, 4.6, 0.0), (0, 14, 6.6, 0.33), (5, 10, 4.8, 0.66)): flame_rows(c, cx + dx, 23, h_, w_, t, ramp, seed=ph, fl=1.1)
    for k in range(5):   # étincelles
        ph = (t + k * 0.2) % 1; c.pix(int(cx - 6 + k * 3 + math.sin(ph * 9 + k) * 2), int(20 - ph * 17), '#ffd070' if k % 2 else '#ff9a3a')
    c.occlude(40, 45, 0.3)
    return c.render()


def rock(pal='lava', variant=0, t=0.0, seed=1):
    rs = np.random.RandomState(variant * 31 + 7); c = Canvas(32, 28, variant + 3); cx = 16
    base = {'lava': '#3a2e30', 'stone': '#8d7a62', 'mirror': '#8a9aa0', 'storm': '#5a7480'}[pal]
    m = Mat(base, 5, grain=0.08, dither=0.1, light=(255, 220, 190) if pal == 'lava' else (255, 245, 215)); m2 = Mat(mix(hexrgb(base), (10, 8, 20), .25), 5, grain=0.08)
    rock_blob(c, cx - 5, 20, 9.5, 7.2, m2, rs); rock_blob(c, cx + 5, 21, 8.2, 6, m, rs)
    rock_blob(c, cx, 15.5 + variant, 10.2, 8.8, m, rs, rough=0.4)
    nz = c.noise(2.2, 2)
    if pal == 'lava':   # veines de lave qui battent
        glow = Mat('#ff8a2a', 4, emissive=True, ramp=['#7a1c10', '#d8481a', '#ff8a2a', '#ffd070'])
        pulse = 0.55 + 0.25 * math.sin(2 * math.pi * t)
        pts = [[(cx - 3, 10), (cx - 2, 14), (cx, 16), (cx + 2, 20)], [(cx + 4, 12), (cx + 6, 16), (cx + 5, 20)]]
        for p in pts:
            for (x0, y0), (x1, y1) in zip(p, p[1:]):
                for i in range(8):
                    x = int(x0 + (x1 - x0) * i / 8); y = int(y0 + (y1 - y0) * i / 8)
                    if 0 <= x < 32 and 0 <= y < 28 and c.mat[y, x] >= 0: c.mat[y, x] = c.mid(glow); c.emit[y, x] = pulse + 0.2 * ((i + variant) % 2)
    elif pal == 'stone':
        for y in (13, 17, 21): c.shade_mod((c.Y > y) & (c.Y < y + 1.2) & (c.mat >= 0), -0.2)
    elif pal == 'mirror':   # galets mouillés : mousse, rides à la base
        c.recolor((c.mat >= 0) & (nz > 0.58) & (c.Y > 17), Mat('#5f8a6a', 4, grain=0.1, dither=0.3))
        for k, rx in enumerate((12.5, 9)):
            for xx in range(int(cx - rx), int(cx + rx) + 1):
                yy = int(26.5 + 1.2 * math.sqrt(max(0, 1 - ((xx - cx) / rx) ** 2)) * (1 if k == 0 else -1))
                if (xx + int(t * 2) + k) % 2 == 0: c.pix(xx, yy, '#e0f6ff', 200)
    elif pal == 'storm':   # coraux et anémones accrochés, balanes
        for (x, y, h_) in ((cx - 7, 22, 6), (cx + 8, 23, 5), (cx + 1, 11, 4)):
            for k in range(4): c.line((x + k * 1.4 - 2, y), (x + k * 1.6 - 2.8 + math.sin(2 * math.pi * (t + k * .25)) * 0.8, y - h_), 1.3, Mat('#e0786e' if k % 2 else '#f0a090', 4, grain=0.05))
        for x, y in ((cx - 4, 12), (cx + 6, 16), (cx - 2, 18)): c.ellipsoid(x, y, 1.5, 1.2, Mat('#e8d8c8', 3, grain=0.1))
    c.occlude(22, 28, 0.3)
    return c.render()


def crystal(pal='lava', variant=0, t=0.0, seed=1):
    """Grappe de cristaux prismatiques : facettes gauche claire / droite sombre, noyau lumineux qui bat, éclats."""
    rs = np.random.RandomState(variant * 13 + 2); c = Canvas(30, 50, variant + 11)
    cols = {'lava': ('#d8481a', '#ff9a3a', '#6a1c14'), 'storm': ('#3aa8d8', '#9ae8f8', '#1a4a78'), 'mystic': ('#e870c8', '#ffc0ee', '#6a2a78')}[pal]
    core = Mat(cols[1], 4, emissive=True, ramp=[cols[2], cols[0], cols[1], '#ffffff'])
    left = Mat(cols[0], 5, grain=0.03, light=(255, 255, 255)); right = Mat(mix(hexrgb(cols[0]), hexrgb(cols[2]), 0.45), 5, grain=0.03); facet = Mat(cols[1], 5, grain=0.03)
    def prism(x, base, h, w, tilt):
        top = base - h; tx = x + tilt
        c.poly([(x - w, base), (x - w * 0.9 + tilt * 0.3, top + h * 0.22), (tx, top), (tx, base + 1.5)], left, (-0.55, -0.1, 0.83))
        c.poly([(tx, base + 1.5), (tx, top), (x + w * 0.9 + tilt * 0.3, top + h * 0.22), (x + w, base)], right, (0.6, -0.05, 0.8))
        c.poly([(x - w * 0.9 + tilt * 0.3, top + h * 0.22), (tx, top), (x + w * 0.9 + tilt * 0.3, top + h * 0.22), (tx, top + h * 0.34)], facet, (0, -0.65, 0.76))
        # noyau
        k = 0.5 + 0.5 * math.sin(2 * math.pi * (t + x * 0.05))
        c.poly([(x - w * 0.28, base - h * 0.12), (tx - 0.2, top + h * 0.45), (x + w * 0.28 + tilt * 0.3, base - h * 0.12)], core, emit=0.35 + 0.35 * k)
        c.pix(int(x - w * 0.5), int(base - h * 0.55), '#ffffff'); c.pix(int(x - w * 0.5), int(base - h * 0.55) + 1, '#ffffff', 160)
    prism(15 + variant, 46, 40 - variant * 4, 4.6, -1)
    prism(7, 47, 22, 3.4, -2); prism(23, 47, 26 + variant * 3, 3.7, 2)
    prism(11, 48, 13, 2.6, 0.5); prism(19, 48, 14, 2.8, -0.5)
    for k in range(5):   # étincelles autour
        ph = (t + k * 0.2) % 1; x = 4 + k * 5.5 + math.sin(ph * 6 + k) * 1.5; y = 40 - ph * 36
        c.pix(int(x), int(y), cols[1]); c.pix(int(x) + 1, int(y), '#ffffff', 190)
    c.occlude(44, 50, 0.28)
    return c.render()


def pillar(pal='stone', variant=0, t=0.0, seed=1):
    """Pilier de 1 case (28x62) : base, fût cannelé, chapiteau ; variante 1 = rompu avec gravats ; runes lumineuses selon la teinte."""
    rs = np.random.RandomState(variant * 29 + 4); c = Canvas(28, 64, variant + 21); cx = 14
    base = {'stone': '#9a8a74', 'storm': '#6a8696'}[pal]
    s = Mat(base, 5, grain=0.07, dither=0.05); sd = Mat(mix(hexrgb(base), (20, 16, 36), 0.3), 5, grain=0.06)
    glow = Mat('#ffcf70' if pal == 'stone' else '#6ae8d0', 4, emissive=True, ramp=['#7a4a18', '#c88a30', '#ffcf70', '#fff2c0'] if pal == 'stone' else ['#1a5a58', '#2aa090', '#6ae8d0', '#d0fff4'])
    moss = Mat('#5a8a46' if pal == 'stone' else '#2f8a78', 4, grain=0.12, dither=0.35)
    c.box(3, 56, 22, 6, 4, sd, top=s)
    c.box(5, 52, 18, 4.5, 3.5, s, top=s)
    top = 14 if variant == 0 else 28
    c.cylinder(cx, top, 53, 6.6, s, cap=s, cap_ry=2.6, r_bot=7.4)
    # cannelures verticales
    for dx in (-4, -1.4, 1.4, 4): c.shade_mod((np.abs(c.X - (cx + dx)) < 0.5) & (c.Y > top + 3) & (c.Y < 52) & (c.mat >= 0), -0.16)
    # bague décorée et runes
    ring_y = 27 if variant == 0 else 38
    c.rect(cx - 7.2, ring_y, cx + 7.2, ring_y + 3, sd); c.shade_mod((c.Y >= ring_y) & (c.Y < ring_y + 1) & (c.mat >= 0), 0.1)
    for k, dx in enumerate((-3.5, 0, 3.5)):
        a = 0.55 + 0.3 * math.sin(2 * math.pi * (t + k / 3)); c.rect(cx + dx - 0.9, ring_y + 6, cx + dx + 0.9, ring_y + 10 + (k % 2) * 2, glow, emit=a)
    if variant == 0:   # chapiteau
        c.box(cx - 9, 8, 18, 5, 3, s, top=s); c.cylinder(cx, 9, 13, 8, s, cap=s, cap_ry=3)
        c.box(cx - 7, 5, 14, 3.5, 2.5, sd, top=s)
    else:   # rompu : cassure dentelée et gravats
        c.poly([(cx - 7, top), (cx - 4, top - 4), (cx - 1, top - 1), (cx + 2, top - 5), (cx + 7, top - 1), (cx + 7, top + 2), (cx - 7, top + 2)], s, nfn=lambda X, Y: np.stack([(X - cx) * 0.1, -0.7 + 0 * X, 0.7 + 0 * X], -1))
        for (x, y, r) in ((4, 61, 3), (22, 62, 2.4), (9, 63, 2)): rock_blob(c, x, y, r + 1, r, s, rs)
    nz = c.noise(2.4, 3); c.recolor((c.mat >= 0) & (nz > 0.57) & (c.Y > 42), moss)
    c.crack([(cx + 3, ring_y - 8), (cx + 1, ring_y - 3), (cx + 4, ring_y + 4)], -0.5)
    if pal == 'storm':
        for (x, y, r) in ((cx - 5, 40, 1.7), (cx + 5, 33, 1.4), (cx - 4, 50, 1.5)): c.ellipsoid(x, y, r, r, Mat('#e8c8b0', 3, grain=0.1))
        for i in range(4): c.line((cx - 7 + i * 2, 62), (cx - 9 + i * 2 + math.sin(2 * math.pi * (t + i * .25)) * 1.2, 50 - i * 2), 1.3, moss)
    c.occlude(52, 63, 0.33)
    return c.render()
