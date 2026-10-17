"""Props d'Edo : lanternes de pierre, cloches, torii, arbres, statues. Chaque recette renvoie une image RGBA (pieds en bas, centré)."""
import math
import numpy as np
from engine import Canvas, Mat, hexrgb, mix

PALETTES = {
    'bell':   dict(stone='#8a8478', moss='#5f7a48', flame=('#fff2b0', '#ffc24a', '#ff7a1c')),
    'ember':  dict(stone='#5a524c', moss='#3a3430', flame=('#ffe0a0', '#ff9a3a', '#d8481a')),
    'mirror': dict(stone='#bcc9cc', moss='#6a9a82', flame=('#e8fbff', '#9fe0ff', '#58b8e8')),
    'ilex':   dict(stone='#8d9580', moss='#5a8a46', flame=('#fffbc0', '#ffe070', '#e8a830')),
}


def flame_rows(c, cx, by, hgt, wid, t, ramp, seed=0, fl=1.0):
    """Petite flamme pixel : colonne qui ondule, noyau clair, pointe ; t dans [0,1)."""
    for yy in range(int(hgt)):
        k = yy / max(1, hgt - 1)                      # 0 bas -> 1 pointe
        wd = wid * (1 - k) ** 0.8 * (0.85 + 0.15 * math.sin(2 * math.pi * (t * 2 + k * 1.6 + seed)))
        sway = math.sin(2 * math.pi * (t + k * 0.55 + seed)) * 0.9 * k * fl
        x0 = cx + sway
        for xx in range(int(math.floor(x0 - wd / 2)), int(math.ceil(x0 + wd / 2)) + 1):
            if abs(xx + 0.5 - x0) <= wd / 2 + 0.01:
                core = abs(xx + 0.5 - x0) <= wd / 4 and k < 0.7
                col = ramp[0] if core else (ramp[1] if k < 0.75 else ramp[2])
                c.pix(xx, int(by - yy), col)


def lantern(pal='bell', t=0.0, seed=1, broken=False, vine=False):
    P = PALETTES[pal]; c = Canvas(30, 44, seed)
    stone = Mat(P['stone'], 5, grain=0.05, dither=0.0)
    stone_d = Mat(mix(hexrgb(P['stone']), (20, 18, 30), 0.25), 5, grain=0.10)
    moss = Mat(P['moss'], 4, grain=0.12, dither=0.3)
    glow = Mat('#ffd070', 4, emissive=True, ramp=[P['flame'][2], P['flame'][2], P['flame'][1], P['flame'][0]])
    cx = 15
    # socle : base carrée + pied rond
    c.box(8, 38, 14, 4, 3, stone_d, top=stone)
    c.cylinder(cx, 28, 38, 3, stone, cap=stone, cap_ry=1.4, r_bot=3.5)
    # renflement du pied (nakadai) et plateau
    c.ellipsoid(cx, 27.5, 6.2, 2.6, stone)
    c.box(9, 22.5, 12, 3.5, 3, stone, top=stone)
    # lampe : cage avec fenêtre rougeoyante
    c.box(10, 12, 10, 10.5, 2.5, stone, top=stone)
    c.rect(12, 13.5, 18, 20.5, glow, emit=np.full_like(c.X, 0.55 + 0.25 * math.sin(2 * math.pi * t)))
    c.rect(12, 16.5, 18, 17.3, stone_d)   # barreau
    c.rect(10, 12.5, 12, 22.5, stone_d); c.rect(18, 12.5, 20, 22.5, stone_d)   # montants de la cage
    c.rect(12, 13.5, 18, 20.5, glow, emit=np.full_like(c.X, 0.55 + 0.25 * math.sin(2 * math.pi * t)))
    c.rect(12, 16.5, 18, 17.3, stone_d)
    # toit : pyramide basse aux angles relevés
    c.poly([(5, 12.5), (cx, 5.5), (25, 12.5), (22.5, 13.5), (cx, 12.2), (7.5, 13.5)], stone, nfn=lambda X, Y: np.stack([np.clip((X - cx) / 11, -1, 1) * 0.85, -0.55 + 0 * X, 0.62 + 0 * X], -1))
    c.poly([(7.5, 13.5), (cx, 12.2), (22.5, 13.5), (21, 15), (9, 15)], stone_d, (0, 0.5, 0.8))
    c.ellipsoid(cx, 5.2, 2.4, 2.4, stone)           # joyau
    c.cylinder(cx, 2.2, 4.6, 0.9, stone, cap=stone, cap_ry=0.5)
    # mousse au pied et sur le toit, aux endroits abrités
    nz = c.noise(2.5, 5); low = (c.Y > 33) & (nz > 0.46); c.recolor(low, moss)
    if pal in ('ilex', 'mirror'): c.recolor((c.Y > 25) & (c.Y < 29) & (nz > 0.58), moss); c.recolor((c.Y < 10) & (nz > 0.6) & (c.X < 14), moss)
    c.crack([(11, 25), (12, 28), (11, 30)], -0.45)
    c.occlude(30, 42, 0.38)
    if pal == 'ember':   # suie et fissure noircie
        sk = (c.noise(2.2, 9) > 0.5) & (c.mat >= 0); c.shade_mod(sk, -0.18)
    if vine:
        for yy in range(14, 40): c.pix(8 + int(2 * math.sin(yy * 0.5)), yy, '#4a7a3a')
    # flamme et halo
    flame_rows(c, cx, 20, 6, 3.4, t, P['flame'], seed=seed * 0.13, fl=0.6)
    return c.render()


# ---------- cloche (bonshō) sous sa charpente ----------
def bell(pal='bell', t=0.0, seed=1):
    ember = pal == 'ember'; c = Canvas(54, 66, seed)
    wood = Mat('#6a4630' if not ember else '#3a2a24', 5, grain=0.07, dither=0.0)
    wood_d = Mat('#3e281c' if not ember else '#201612', 4, grain=0.05)
    tile = Mat('#4a4f5c' if not ember else '#2e2a2c', 5, grain=0.06)
    bronze = Mat('#a0783a' if not ember else '#6a5236', 5, grain=0.05, dither=0.2, light=(255, 230, 150))
    green = Mat('#5f8a6a', 4, grain=0.1, dither=0.3)
    cx = 27
    # socle de pierre
    c.box(6, 58, 40, 6, 4, Mat('#7d776c' if not ember else '#4c4640', 5, grain=0.07), top=Mat('#9a9486' if not ember else '#5e5750', 5, grain=0.06))
    # poteaux et traverse
    for x in (9, 40):
        c.cylinder(x + 2, 22, 58, 2.6, wood, cap=wood_d, cap_ry=1.2)
        c.rect(x - 1, 54, x + 6, 58, wood_d)
    c.box(7, 17, 40, 5, 3, wood, top=wood_d)
    # petit toit de tuiles
    c.poly([(2, 18), (cx - 1, 8), (cx + 2, 8), (53, 18), (49, 21), (5, 21)], tile, nfn=lambda X, Y: np.stack([np.clip((X - cx) / 26, -1, 1) * 0.5, -0.6 + 0 * X, 0.65 + 0 * X], -1))
    for i in range(4): c.rect(3 + i * 12, 19.5, 6 + i * 12, 21, wood_d)
    c.rect(cx - 2, 7, cx + 3, 9, wood_d)
    # corde / crochet
    c.rect(cx - 0.5, 21, cx + 1, 25, wood_d)
    # cloche : tronc de cône, bandes, boutons ; elle oscille légèrement autour du crochet
    sw = math.sin(2 * math.pi * t) * 1.3
    def bx(y): return cx + 0.5 + sw * (y - 24) / 26
    top, bot = 25, 49
    for y in range(top, bot):
        k = (y - top) / (bot - top); r = 6.2 + 5.5 * (k ** 1.15); xc = bx(y)
        for x in range(int(xc - r - 1), int(xc + r + 2)):
            u = (x + 0.5 - xc) / r
            if abs(u) <= 1:
                n = np.array([u * 0.95, -0.12 + (0.15 if k < 0.08 else 0), math.sqrt(1 - u * u)]); c.put((c.X > x) & (c.X < x + 1) & (c.Y > y) & (c.Y < y + 1), n, bronze)
    for y0 in (29, 35, 45):   # bandes
        for x in range(0, 54):
            pass
        m = (c.Y >= y0) & (c.Y < y0 + 1.2) & (c.mat == c.mid(bronze)); c.shade_mod(m, -0.34)
    for yy, nx in ((31, 3), (31, 4)):   # boutons (nipples)
        pass
    for i in range(3):
        for j in range(2):
            x = bx(33 + j * 2) - 3.2 + i * 3.2; y = 31.5 + j * 4.2
            c.ellipsoid(x + 0.5, y, 1.1, 1.1, bronze)
    c.ellipsoid(bx(49), 49.2, 11.8, 2.6, bronze, flat=0.2)    # lèvre
    c.ellipsoid(bx(49), 50.4, 9.6, 1.6, Mat('#2a1c14', 3))
    # verdigris sur le haut, suie ou fissure selon la teinte
    nz = c.noise(2.4, 3); c.recolor((c.mat == c.mid(bronze)) & (nz > 0.64) & (c.Y < 34), green)
    if ember:
        c.crack([(bx(36) + 2, 33), (bx(40) + 3, 38), (bx(43) + 1, 44), (bx(47) + 3, 48)], -0.7)
        for k, y in enumerate((37, 40, 43)): c.pix(int(bx(y) + 2 + k), y + 1, '#ff8a2a'); c.pix(int(bx(y) + 3 + k), y + 2, '#a8340f')
    # maillet (shumoku) : tronc suspendu à deux cordes
    c.line((cx - 17, 41 + sw * 0.1), (cx - 4, 41 + sw * 0.1), 3.1, wood)
    c.line((cx - 18, 41), (cx - 24, 41), 2.0, wood_d)
    c.line((cx - 17, 41), (cx - 17, 24), 0.8, wood_d); c.line((cx - 8, 41), (cx - 8, 24), 0.8, wood_d)
    c.occlude(54, 64, 0.3)
    return c.render()


# ---------- torii ----------
def torii(pal='bell', t=0.0, seed=1):
    ember = pal == 'ember'; mirror = pal == 'mirror'; ilex = pal == 'ilex'; c = Canvas(64, 62, seed)
    red = Mat('#b8412e' if not ember else '#2d2522', 5, grain=0.05, dither=0.15, ramp=None if not ember else ['#120e0e', '#201a18', '#2d2522', '#3c3430', '#58443a'])
    redd = Mat('#8a2c24', 4, grain=0.05)
    blk = Mat('#2a2226', 5, grain=0.04, light=(200, 190, 220))
    stone = Mat('#8a8478', 5, grain=0.08)
    moss = Mat('#5a8a46', 4, grain=0.12, dither=0.3)
    ember_m = Mat('#ff8a2a', 4, emissive=True, ramp=['#7a1c10', '#c8381a', '#ff8a2a', '#ffd070'])
    if mirror: red = Mat('#d8553e', 5, grain=0.04, dither=0.1)
    cxL, cxR = 14, 49
    # pieds : socles noirs
    for x in (cxL, cxR):
        c.cylinder(x, 52, 58, 5.2, blk, cap=blk, cap_ry=1.8, r_bot=5.6)
    # piliers : léger fruit (plus larges en bas)
    for x in (cxL, cxR):
        c.cylinder(x, 14, 52, 3.7, red, cap=False, r_bot=4.5)
    # nuki (traverse basse) et plaque centrale
    c.box(8, 29, 48, 4, 2.5, red, top=redd)
    c.rect(cxL + 3, 31, cxR - 3, 33.2, redd)
    c.box(28, 14.5, 7, 14, 2, red, top=redd)       # gakuzuka
    c.box(27.5, 17.5, 8, 7, 1.5, blk)
    c.rect(29, 19.5, 34, 22.5, Mat('#d8b050', 4, grain=0.04), (0, 0, 1))
    # shimagi (traverse haute) et kasagi (linteau noir recourbé)
    c.box(5, 11, 54, 3.5, 3, red, top=redd)
    c.poly([(0, 11.5), (4, 7), (32, 5.5), (60, 7), (64, 11.5), (61, 10.5), (32, 8.8), (3, 10.5)], blk, nfn=lambda X, Y: np.stack([np.clip((X - 32) / 33, -1, 1) * 0.5, -0.7 + 0 * X, 0.5 + 0 * X], -1))
    c.poly([(2, 12), (6, 8.8), (32, 7.4), (58, 8.8), (62, 12), (58, 11), (32, 9.8), (6, 11)], Mat('#3a2f34', 4, grain=0.05), (0, -0.2, 0.9))
    c.box(2, 6, 60, 2.2, 3, blk, top=Mat('#463a40', 4, grain=0.04))
    c.occlude(50, 60, 0.3)
    if ember:   # bois brûlé : charbons rougeoyants, poutre rompue, fumée de braise
        nz = c.noise(2.0, 4); red_mask = (c.mat == c.mid(red)); c.recolor(red_mask & (nz > 0.66) & (c.Y > 20), Mat('#7a2a1c', 4, grain=0.1))
        for i, (x, y) in enumerate(((cxL - 2, 40), (cxL + 1, 46), (cxR - 1, 38), (cxR + 2, 47), (cxL, 24), (cxR - 2, 22))):
            c.pix(x, y, '#ff8a2a' if (i + int(t * 4)) % 3 else '#a8340f'); c.pix(x + 1, y, '#d8481a')
        c.rect(44, 29, 60, 34, Mat('#00000000'.replace('0000', '')[:7] if False else '#000000', 2), (0, 0, 1))   # trou : poutre rompue
        m = (c.X > 43) & (c.X < 62) & (c.Y > 28) & (c.Y < 35); c.mat[m] = -1
        c.line((43, 30), (50, 36), 2.4, red); c.line((43, 33), (53, 38), 1.8, blk)
        for k, (x, y) in enumerate(((41, 31), (47, 36), (52, 40))): c.pix(x, y, '#ff9a3a' if (k + int(t * 4)) % 2 else '#b8381a')
    if mirror:   # pieds dans l'eau : anneau de rides
        for k, (rx, a) in enumerate(((9, .55), (6.5, .8))):
            for x in (cxL, cxR):
                for xx in range(int(x - rx), int(x + rx) + 1):
                    for sgn in (-1, 1):
                        yy = int(57 + sgn * 1.4 * math.sqrt(max(0, 1 - ((xx - x) / rx) ** 2)) + 0.5 + (k if t > 0.5 else 0) * 0)
                        if (xx + k + int(t * 2)) % 2 == 0: c.pix(xx, yy, '#dff6ff', int(255 * a))
    if ilex:
        nz = c.noise(2.3, 6); c.recolor((c.mat == c.mid(red)) & (nz > 0.6) & (c.Y > 40), moss); c.recolor((c.mat == c.mid(blk)) & (nz > 0.5) & (c.Y > 51), moss)
        for x in (cxL - 3, cxR + 2):
            for yy in range(24, 52): c.pix(x + int(1.6 * math.sin(yy * 0.45 + x)), yy, '#4a7a3a' if yy % 3 else '#6aa04a')
        for (x, y) in ((cxL + 3, 30), (cxR - 4, 33), (cxL - 4, 44)): c.ellipsoid(x, y, 1.2, 1.2, Mat('#f0c860', 3, emissive=True, ramp=['#a87a28', '#e8b040', '#fff0a0']), emit=0.7)
    # lanternes de papier ? non : une shimenawa discrète sur la traverse haute
    if pal in ('bell', 'ilex', 'mirror'):
        for i in range(10): c.ellipsoid(18 + i * 3.1, 17.5 + math.sin(i * 1.2) * 0.8 + 2.2 * math.sin(i / 9 * math.pi), 1.9, 1.7, Mat('#d9ca8a', 4, grain=0.1, dither=0.3))
        for x in (24, 32, 40): c.rect(x, 20, x + 1.6, 24, Mat('#f4efe6', 3), (0, 0, 1))
    return c.render()


# ---------- arbres ----------
def _foliage(c, clusters, mat, gc, gr, mix_local=0.5):
    """Touffes de feuillage : chaque touffe est une sphère, mais ses normales sont mêlées à celles de la couronne entière (volume cohérent)."""
    for (x, y, rx, ry) in clusters:
        u = (c.X - x) / rx; v = (c.Y - y) / ry; r2 = u * u + v * v; mask = r2 <= 1
        loc = np.stack([u, v, np.sqrt(np.clip(1 - r2, 0, 1))], -1)
        gu = (c.X - gc[0]) / gr[0]; gv = (c.Y - gc[1]) / gr[1]; gg = np.stack([gu, gv, np.sqrt(np.clip(1 - gu * gu - gv * gv, 0.05, 1))], -1)
        c.put(mask, loc * mix_local + gg * (1 - mix_local), mat)


def tree(pal='ember', variant=0, t=0.0, seed=1):
    """Arbre de 2x2 cases (56x66). pal : ember (érable brûlé), mirror (cerisier), ilex (forêt), mystic (arbre lumineux). t : balancement du feuillage."""
    rs = np.random.RandomState(variant * 17 + 5 + hash(pal) % 97); c = Canvas(58, 68, variant * 7 + 3)
    cx = 29 + (variant - 1) * 1
    sway = math.sin(2 * math.pi * t)
    if pal == 'ember':   trunk = Mat('#2e2420', 5, grain=0.08, light=(180, 120, 90)); leaf_cols = ['#7a2a1a', '#a8421e', '#d8662e', '#f0903a'];
    elif pal == 'mirror': trunk = Mat('#5a4038', 5, grain=0.09); leaf_cols = ['#c9708e', '#e89ab4', '#f6bccf', '#fde0e8']
    elif pal == 'ilex':  trunk = Mat('#5a4430', 5, grain=0.09); leaf_cols = ['#1f5a40', '#2f7a50', '#4a9a58', '#8cc060']
    else:                trunk = Mat('#2a3a46', 5, grain=0.08, light=(150, 230, 220)); leaf_cols = ['#1a4a58', '#2a7a78', '#3aa890', '#8ae8c0']
    # racines et tronc
    c.cylinder(cx, 38, 64, 4.2 + variant * 0.3, trunk, cap=False, r_bot=6.2, cap_ry=1.5)
    for sx in (-1, 1):
        c.line((cx + sx * 4, 62), (cx + sx * 9.5, 65.5), 3.2, trunk, taper=0.5)
    c.line((cx - 1, 46), (cx - 12, 30 + variant), 3.4, trunk, taper=0.55); c.line((cx + 1, 44), (cx + 13, 29 - variant), 3.2, trunk, taper=0.55)
    c.line((cx, 40), (cx + 1, 24), 3.4, trunk, taper=0.6)
    leaf_dim = 1.0
    if pal == 'ember':   # arbre calciné : branches tortueuses et nues, quelques touffes rousses accrochées aux bouts
        ends = []
        for bx, by, ex, ey in ((cx - 12, 30, cx - 21, 23), (cx - 21, 23, cx - 25, 15), (cx - 12, 30, cx - 19, 37), (cx + 13, 29, cx + 21, 22), (cx + 21, 22, cx + 24, 13), (cx + 13, 29, cx + 20, 36), (cx + 1, 24, cx - 5, 14), (cx - 5, 14, cx - 8, 6), (cx + 1, 24, cx + 8, 12), (cx + 8, 12, cx + 12, 5)):
            c.line((bx, by), (ex, ey), 2.2, trunk, taper=0.45)
            if (ex, ey) in [(cx - 25, 15), (cx + 24, 13), (cx - 8, 6), (cx + 12, 5), (cx - 19, 37), (cx + 20, 36)]: ends.append((ex, ey))
        for k in range(2): c.line((cx - 25 + k, 15), (cx - 28, 11 + k * 3), 1.0, trunk)
        pts = []
        for (ex, ey) in ends:
            for j in range(4): pts.append((ex + rs.uniform(-4, 4) + sway * 0.7 * (1 - ey / 40), ey + rs.uniform(-4, 3), rs.uniform(3.6, 5.2), rs.uniform(3, 4.2)))
    elif pal == 'mystic':
        pts = [(cx + rs.uniform(-15, 15) + sway, 22 + rs.uniform(-11, 9), rs.uniform(7, 10), rs.uniform(5, 8)) for _ in range(10)]
    else:
        n = 12 if pal == 'ilex' else 11
        pts = []
        for i in range(n):
            a = rs.uniform(0, 6.28); d = rs.uniform(0.2, 1.0)
            pts.append((cx + math.cos(a) * 17 * d + sway * (0.5 + 0.5 * (24 - (24 + math.sin(a) * 15 * d)) / 30), 24 + math.sin(a) * 13 * d, rs.uniform(7.5, 10.5), rs.uniform(6, 8.5)))
    gc = (cx, 22); gr = (24, 20)
    # une couleur par touffe selon sa hauteur : feuillage plus clair en haut, plus sombre sous la couronne
    order = sorted(pts, key=lambda p: -p[1])
    for k, (x, y, rx, ry) in enumerate(order):
        tone = min(3, max(0, int((1 - (y - 8) / 34) * 3.2 + rs.uniform(-0.5, 0.5))))
        base = leaf_cols[tone]
        _foliage(c, [(x, y, rx, ry)], Mat(base, 5, grain=0.10, dither=0.45, light=(255, 250, 230)), gc, gr, 0.55)
    # petites touffes d'éclat : brins de feuilles qui accrochent la lumière
    for _ in range(26):
        x = int(cx + rs.uniform(-20, 20)); y = int(22 + rs.uniform(-16, 12))
        if 0 <= y < 68 and 0 <= x < 58 and c.mat[y, x] >= 0 and pal != 'ember': c.pix(x, y, leaf_cols[3]); c.pix(x + 1, y, leaf_cols[2])
    if pal == 'mirror':   # pétales qui tombent
        for k in range(5):
            ph = (t + k * 0.21) % 1; x = cx - 18 + k * 9 + sway * 2 + math.sin(ph * 6 + k) * 3; y = 30 + ph * 36
            c.pix(int(x), int(y), '#ffd9e4'); c.pix(int(x) + 1, int(y), '#f6a8c0')
    if pal == 'ember':
        for k in range(4):
            ph = (t + k * 0.27) % 1; x = cx - 16 + k * 11 + math.sin(ph * 7 + k) * 2; y = 62 - ph * 40
            c.pix(int(x), int(y), '#ff9a3a' if k % 2 else '#ffd070')
    if pal == 'mystic':   # fruits-lanternes et lueurs
        for k in range(6):
            x = cx - 16 + k * 6.5 + rs.uniform(-2, 2); y = 20 + rs.uniform(0, 18) + 2 * math.sin(2 * math.pi * (t + k / 6))
            c.ellipsoid(x, y, 1.7, 1.7, Mat('#ffb0e8', 4, emissive=True, ramp=['#a8409a', '#d860b8', '#f090d8', '#ffc8ee']), emit=0.55)
    if pal == 'ilex':   # champignons et fleurs au pied
        for x, cl in ((cx - 12, '#e8c860'), (cx + 12, '#f4eadc'), (cx - 6, '#f0a0c0')):
            c.ellipsoid(x, 66, 1.4, 1.4, Mat(cl, 3, emissive=True, ramp=[cl, cl, '#ffffff']), emit=0.5)
    c.occlude(58, 67, 0.32)
    return c.render()


# ---------- statues gardiennes ----------
def statue(pal='ilex', t=0.0, seed=1):
    """Statue de 1 case (32x56) : chien-lion (komainu) assis sur un socle ; mousse (ilex), runes lumineuses (mystic), coraux (storm)."""
    c = Canvas(34, 56, seed); cx = 17
    base_hex = {'ilex': '#8d9580', 'mystic': '#6a8a86', 'storm': '#7d8ea0'}[pal]
    stone = Mat(base_hex, 5, grain=0.06, dither=0.0); stone_d = Mat(mix(hexrgb(base_hex), (20, 20, 40), 0.3), 5, grain=0.06)
    moss = Mat('#5a8a46' if pal != 'storm' else '#2f8a78', 4, grain=0.12, dither=0.35)
    glow = Mat('#a0ffe0', 4, emissive=True, ramp=['#2a7a6a', '#4acaa8', '#a0ffe0', '#f0fffa'])
    # socle
    c.box(4, 46, 22, 8, 5, stone_d, top=stone)
    c.box(7, 42, 18, 4.5, 4, stone, top=stone)
    if pal == 'storm':   # silhouette d'un gardien atlante : colonne drapée portant un trident
        c.cylinder(cx, 14, 42, 6.2, stone, cap=stone, cap_ry=2.2, r_bot=7.2)
        c.ellipsoid(cx, 17.5, 8.4, 4.2, stone); c.ellipsoid(cx, 11, 5.0, 5.2, stone)
        for dx, hh in ((-4, 4.5), (-1.6, 6.5), (1.6, 6.5), (4, 4.5)): c.poly([(cx + dx - 1.1, 7.5), (cx + dx, 7.5 - hh), (cx + dx + 1.1, 7.5)], stone_d)
        for dx in (-3.5, 0, 3.5): c.crack([(cx + dx, 21), (cx + dx + 0.5, 30), (cx + dx - 0.5, 40)], -0.28)
        c.rect(cx - 3.5, 9.5, cx - 1.2, 11, glow, emit=0.9); c.rect(cx + 1.4, 9.5, cx + 3.6, 11, glow, emit=0.9)
        c.line((cx + 9, 44), (cx + 9, 3), 1.6, stone_d); c.line((cx + 5.5, 6), (cx + 12.5, 6), 1.4, stone_d)
        for x in (cx + 5.6, cx + 9, cx + 12.4): c.line((x, 6), (x, 1.5), 1.2, stone_d)
        for (x, y, r) in ((cx - 6, 30, 1.7), (cx - 4, 33, 1.3), (cx + 5, 25, 1.5), (cx - 7, 38, 1.5)): c.ellipsoid(x, y, r, r, Mat('#e8c8b0', 3, grain=0.1))
        for i in range(5): c.line((cx - 9 + i * 1.5, 54), (cx - 11 + i * 1.7 + math.sin(2 * math.pi * (t + i * 0.2)) * 1.2, 40 - i * 1.5), 1.2, moss)
    else:
        # corps assis : poitrail, pattes avant, croupe
        c.ellipsoid(cx + 1, 36, 8.4, 8.8, stone)            # croupe
        c.ellipsoid(cx - 1, 29, 6.8, 10.5, stone)           # poitrail
        c.rect(cx - 6.5, 36, cx - 2.3, 42.5, stone, (0, 0, 1)); c.rect(cx + 0.5, 36, cx + 4.5, 42.5, stone, (0, 0, 1))   # pattes
        c.ellipsoid(cx - 4.4, 42, 2.8, 1.5, stone); c.ellipsoid(cx + 2.6, 42, 2.8, 1.5, stone)
        # tête : crinière en boucles, museau, oreilles
        for (x, y, r) in ((cx - 5.5, 15, 3), (cx + 4.5, 15, 3), (cx - 6.3, 20, 2.6), (cx + 5.5, 20, 2.6), (cx, 11, 3.3)): c.ellipsoid(x, y, r, r, stone_d)
        c.ellipsoid(cx, 16.5, 5.6, 5.2, stone)
        c.ellipsoid(cx - 4.4, 11.2, 1.6, 2.2, stone); c.ellipsoid(cx + 4.4, 11.2, 1.6, 2.2, stone)
        c.ellipsoid(cx, 19.2, 3.4, 2.3, stone)
        c.rect(cx - 1.6, 20.2, cx + 1.6, 21.1, Mat('#1c1620', 2), (0, 0, 1))      # bouche
        eye = glow if pal == 'mystic' else Mat('#1c1620', 2)
        c.rect(cx - 3.3, 15, cx - 1.7, 16.2, eye, emit=0.9); c.rect(cx + 1.7, 15, cx + 3.3, 16.2, eye, emit=0.9)
        # bavoir de tissu (yodarekake) rouge pour la forêt d'Ilex
        if pal == 'ilex': c.poly([(cx - 6, 24), (cx + 4.5, 24), (cx + 3, 33), (cx - 4.5, 33)], Mat('#b8412e', 5, grain=0.05), nfn=lambda X, Y: np.stack([np.sin((X - cx) * 1.1) * 0.5, 0.1 + 0 * X, 0.8 + 0 * X], -1)); c.ellipsoid(cx - 0.5, 34.5, 1.6, 1.6, Mat('#e8c860', 3, grain=0.04))
        if pal == 'mystic':
            for k, (x, y) in enumerate(((cx - 1, 27), (cx - 3, 32), (cx + 2, 31))):
                a = 0.5 + 0.4 * math.sin(2 * math.pi * (t + k / 3)); c.rect(x - 1, y, x + 1, y + 3, glow, emit=a)
    nz = c.noise(2.4, 3)
    if pal != 'storm': c.recolor((nz > 0.5) & ((c.Y > 36) | ((c.Y < 12) & (c.X < cx))), moss)
    c.crack([(cx + 5, 27), (cx + 4, 31), (cx + 6, 35)], -0.5)
    c.occlude(46, 55, 0.35)
    return c.render()
